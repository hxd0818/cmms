# CMMS Production Dockerfile (multi-stage, non-root)
# Builds both Web (Next.js standalone) + Worker (BullMQ)
#
# Build: docker build -t cmms:latest .
# Run:   docker compose -f docker/docker-compose.prod.yml up -d

# ============ Stage 1: Dependencies ============
FROM node:22-alpine AS deps
WORKDIR /app
RUN corepack enable pnpm
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile --config.dangerouslyAllowAllBuilds=true

# ============ Stage 2: Build ============
FROM node:22-alpine AS builder
WORKDIR /app
RUN corepack enable pnpm
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
ENV DATABASE_URL="postgresql://x:x@localhost:5432/x"
RUN pnpm db:generate
RUN pnpm build

# ============ Stage 3: Runtime ============
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Install su-exec for privilege dropping + wget for healthcheck
RUN apk add --no-cache wget su-exec

# Create app user
RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001
RUN mkdir -p /app/tmp/uploads

# Next.js standalone server
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# Prisma + generated client (for migrations)
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts

# lib/ directory (db client, shared utils, domain services)
COPY --from=builder /app/lib ./lib

# Worker + full node_modules
COPY --from=builder /app/worker ./worker
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/tsconfig.json ./tsconfig.json

# Entrypoint: fix perms + migrate + seed + start
COPY docker/entrypoint.sh ./entrypoint.sh
RUN chmod +x entrypoint.sh

# Fix ownership for all app files
RUN chown -R nextjs:nodejs /app

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD wget --quiet --spider http://localhost:3000/api/health || exit 1

# Run as root initially so entrypoint can fix volume perms, then drop to nextjs
CMD ["su-exec", "nextjs", "./entrypoint.sh"]
