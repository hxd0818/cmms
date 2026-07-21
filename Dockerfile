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
# Placeholder DATABASE_URL for prisma generate (real URL injected at runtime)
ENV DATABASE_URL="postgresql://x:x@localhost:5432/x"
RUN pnpm db:generate
RUN pnpm build

# ============ Stage 3: Runtime ============
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001
RUN apk add --no-cache wget

# Next.js standalone server
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# Prisma + generated client (for migrations)
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/prisma.config.ts ./prisma.config.ts

# lib/ directory (db client, shared utils, domain services — needed by worker + seed)
COPY --from=builder --chown=nextjs:nodejs /app/lib ./lib

# Worker: full node_modules for BullMQ/ExcelJS/ioredis
COPY --from=builder --chown=nextjs:nodejs /app/worker ./worker
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./package.json
COPY --from=builder --chown=nextjs:nodejs /app/tsconfig.json ./tsconfig.json

# Entrypoint: auto-migrate + seed + start server
COPY --chown=nextjs:nodejs docker/entrypoint.sh ./entrypoint.sh
RUN chmod +x entrypoint.sh

USER nextjs
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD wget --quiet --spider http://localhost:3000/api/health || exit 1

CMD ["./entrypoint.sh"]
