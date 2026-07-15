# CMMS Foundation Implementation Plan (Phase 0 + Phase 1)

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 搭建 CMMS 项目骨架（Next.js 16 全栈 + Prisma + PostgreSQL + Redis + Docker），并实现 Guest（嘉宾信息库）模块作为参考实现，确立后续 7 个领域模块的开发范式。

**Architecture:** Next.js 16 App Router 全栈单体（非 monorepo），按 `lib/domain/<module>/` 严格分层（service/repository/types），Server Actions 作为业务入口，Prisma + PostgreSQL 持久化，Auth.js (NextAuth v5) 认证，CASL.js 权限，shadcn/ui 组件库。

**Tech Stack:** Node.js 20+ / TypeScript 5.9 / **Next.js 16.2.10** / **React 19.2.4** / **Prisma 7.8** / **Zod 4** / PostgreSQL 16 / Redis 7 / BullMQ / Pino / React Hook Form / **Vitest 4.1** / Playwright 1.61 / Docker Compose / pnpm 11.13

**Reference Design:** `docs/plans/2026-07-15-cmms-design.md` (Section 1.2 documents the version upgrade rationale)

---

## ⚠️ Important: Plan vs Reality Discrepancy

This plan was originally drafted for Next.js 14 + Tailwind v3 + Prisma 5 + Zod 3, but Tasks 0.1-0.5 have been executed with the latest stable versions (Next.js 16.2.10 / Tailwind v4 / Prisma 7.8 / Zod 4). When executing subsequent tasks:

1. **Tailwind v4 differences**: Use `@import "tailwindcss"` in CSS, no `tailwind.config.ts`. Theme via `@theme inline { ... }` in `globals.css`. Tailwind utilities mostly unchanged.
2. **Next.js 16 differences**: Turbopack is default. Some imports slightly different. Middleware API compatible.
3. **Prisma 7 differences**: Mostly compatible with v5 syntax. Some generator/datasource block syntax changes possible.
4. **ESLint 9 differences**: Use `eslint.config.mjs` (flat config), NOT `.eslintrc.json`.
5. **shadcn 4.12 differences**: Use `pnpm dlx shadcn@4.12.0 add ...`, NOT `shadcn-ui@latest`.

---

## Pre-flight Environment Check

Verified on host machine:
- Node.js v24.13.0 ✓
- npm 11.6.2 ✓
- Docker 29.4.3 ✓
- Git 2.53.0 ✓
- pnpm: NOT installed (install in Task 0.1)

---

## Phase 0: Project Skeleton (Tasks 0.1 - 0.13)

**Goal:** Bootable Next.js app with database, auth skeleton, CI pipeline, and zero functional features. Commit cadence: one commit per task.

### Task 0.1: Install pnpm + Initialize Git repository

**Files:**
- Create: `D:/work/cmms/.gitignore`

**Step 1: Enable corepack and install pnpm**

Run:
```bash
corepack enable
corepack prepare pnpm@latest --activate
pnpm --version
```

Expected: pnpm version string (e.g., `9.x.x`)

**Step 2: Initialize git repository**

Run:
```bash
cd D:/work/cmms
git init
git branch -m main
```

**Step 3: Create `.gitignore`**

Create `D:/work/cmms/.gitignore` with content:

```gitignore
# Dependencies
node_modules/
.pnpm-store/

# Next.js
.next/
out/
build/
dist/

# Environment
.env
.env.local
.env.*.local
!.env.example

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Logs
*.log
npm-debug.log*
pnpm-debug.log*

# Testing
coverage/
playwright-report/
test-results/

# Prisma
prisma/migrations/dev.db

# Docker
docker/data/

# Misc
.cache/
.turbo/
*.pem
```

**Step 4: Initial commit**

Run:
```bash
git add .gitignore
git commit -m "chore: initialize git repository with .gitignore"
```

---

### Task 0.2: Create Next.js 14 project with TypeScript and Tailwind

**Files:**
- Create: `D:/work/cmms/package.json` (and full Next.js scaffold)

**Step 1: Create Next.js app in current directory**

Run:
```bash
cd D:/work/cmms
pnpm create next-app@latest . --typescript --tailwind --eslint --app --src-dir=false --import-alias="@/*" --use-pnpm
```

When prompted "Are you sure you want to continue?" → `Y`
When prompted about Turbopack → `No`

Expected: Next.js 14 scaffolded in `D:/work/cmms/`

**Step 2: Verify it runs**

Run:
```bash
pnpm dev
```

Expected: Server starts at `http://localhost:3000`, default page renders. Press Ctrl+C to stop.

**Step 3: Clean default boilerplate**

Replace `D:/work/cmms/app/page.tsx` with:

```tsx
export default function HomePage() {
  return (
    <main className="flex min-h-screen items-center justify-center p-24">
      <h1 className="text-4xl font-bold">CMMS 会务管理系统</h1>
    </main>
  );
}
```

Replace `D:/work/cmms/app/globals.css` with:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
}

@media (prefers-color-scheme: dark) {
  :root {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
  }
}

body {
  color: hsl(var(--foreground));
  background: hsl(var(--background));
}
```

**Step 4: Commit**

Run:
```bash
git add -A
git commit -m "chore: scaffold Next.js 14 project with TypeScript and Tailwind"
```

---

### Task 0.3: Install core dependencies

**Step 1: Install runtime dependencies**

Run:
```bash
pnpm add prisma @prisma/client @auth/prisma-adapter next-auth@beta @casl/ability @casl/react
pnpm add zod react-hook-form @hookform/resolvers
pnpm add @prisma/client bullmq ioredis pino pino-pretty
pnpm add exceljs @tanstack/react-query
pnpm add bcryptjs
pnpm add class-variance-authority clsx tailwind-merge lucide-react
```

**Step 2: Install dev dependencies**

Run:
```bash
pnpm add -D @types/bcryptjs
pnpm add -D vitest @vitest/ui @playwright/test
pnpm add -D @testing-library/react @testing-library/jest-dom jsdom
pnpm add -D prettier eslint-config-prettier eslint-plugin-prettier
pnpm add -D @types/node
pnpm add -D prisma
pnpm add -D tsx
```

**Step 3: Commit**

Run:
```bash
git add -A
git commit -m "chore: install core runtime and dev dependencies"
```

---

### Task 0.4: Configure TypeScript, ESLint, Prettier

**Files:**
- Modify: `D:/work/cmms/tsconfig.json`
- Modify: `D:/work/cmms/.eslintrc.json`
- Create: `D:/work/cmms/.prettierrc`
- Create: `D:/work/cmms/.prettierignore`

**Step 1: Update `tsconfig.json`**

Replace content with:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "forceConsistentCasingInFileNames": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "plugins": [{ "name": "next" }],
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules", "playwright-report", "test-results"]
}
```

**Step 2: Update `.eslintrc.json`**

Replace content with:

```json
{
  "extends": ["next/core-web-vitals", "prettier"],
  "plugins": ["prettier"],
  "rules": {
    "prettier/prettier": "error",
    "@next/next/no-img-element": "warn",
    "react/no-unescaped-entities": "off"
  }
}
```

**Step 3: Create `.prettierrc`**

```json
{
  "semi": true,
  "singleQuote": true,
  "trailingComma": "all",
  "printWidth": 100,
  "tabWidth": 2,
  "arrowParens": "always",
  "endOfLine": "lf"
}
```

**Step 4: Create `.prettierignore`**

```
.next/
node_modules/
build/
dist/
coverage/
pnpm-lock.yaml
prisma/migrations/
```

**Step 5: Add scripts to `package.json`**

In `D:/work/cmms/package.json`, merge into `"scripts"`:

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "format": "prettier --write .",
    "format:check": "prettier --check .",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:ui": "vitest --ui",
    "test:e2e": "playwright test",
    "db:generate": "prisma generate",
    "db:migrate": "prisma migrate dev",
    "db:push": "prisma db push",
    "db:studio": "prisma studio",
    "db:seed": "tsx prisma/seed/index.ts",
    "worker:start": "tsx worker/index.ts"
  }
}
```

**Step 6: Verify lint passes**

Run:
```bash
pnpm lint
```

Expected: No errors.

**Step 7: Commit**

```bash
git add -A
git commit -m "chore: configure TypeScript strict mode, ESLint, Prettier"
```

---

### Task 0.5: Configure shadcn/ui

**Files:**
- Create: `D:/work/cmms/components.json`
- Create: `D:/work/cmms/lib/utils.ts`

**Step 1: Initialize shadcn/ui**

Run:
```bash
pnpm dlx shadcn-ui@latest init -d
```

When prompted:
- Style: `New York`
- Base color: `Slate`
- CSS variables: `Yes`

This will create `components.json` and `lib/utils.ts`, and update `tailwind.config.ts` and `app/globals.css`.

**Step 2: Verify lib/utils.ts exists**

Check `D:/work/cmms/lib/utils.ts` exists with `cn()` helper.

**Step 3: Add core shadcn/ui components**

Run:
```bash
pnpm dlx shadcn-ui@latest add button card input label table dialog dropdown-menu form toast select badge avatar separator tabs sheet skeleton
```

Expected: Components installed under `D:/work/cmms/components/ui/`.

**Step 4: Commit**

```bash
git add -A
git commit -m "chore: configure shadcn/ui with core components"
```

---

### Task 0.6: Create Docker Compose for PostgreSQL + Redis

**Files:**
- Create: `D:/work/cmms/docker/docker-compose.yml`
- Create: `D:/work/cmms/.env.example`
- Create: `D:/work/cmms/.env` (gitignored)

**Step 1: Create docker-compose.yml**

Create `D:/work/cmms/docker/docker-compose.yml`:

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    container_name: cmms-postgres
    restart: unless-stopped
    environment:
      POSTGRES_USER: cmms
      POSTGRES_PASSWORD: cmms_dev_password
      POSTGRES_DB: cmms
    ports:
      - '5432:5432'
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ['CMD-SHELL', 'pg_isready -U cmms -d cmms']
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    container_name: cmms-redis
    restart: unless-stopped
    ports:
      - '6379:6379'
    volumes:
      - redis_data:/data
    healthcheck:
      test: ['CMD', 'redis-cli', 'ping']
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  postgres_data:
  redis_data:
```

**Step 2: Create `.env.example`**

Create `D:/work/cmms/.env.example`:

```bash
# Database
DATABASE_URL="postgresql://cmms:cmms_dev_password@localhost:5432/cmms?schema=public"

# Redis
REDIS_URL="redis://localhost:6379"

# NextAuth
NEXTAUTH_SECRET="change-me-in-production-use-openssl-rand-base64-32"
NEXTAUTH_URL="http://localhost:3000"

# Field encryption (AES-256-GCM, 32-byte hex string)
FIELD_ENCRYPTION_KEY="0000000000000000000000000000000000000000000000000000000000000000"

# App
NODE_ENV="development"
LOG_LEVEL="debug"
```

**Step 3: Create `.env` (copy from example)**

Run:
```bash
cp .env.example .env
```

Generate a real `NEXTAUTH_SECRET`:
```bash
openssl rand -base64 32
```

Replace the `NEXTAUTH_SECRET` value in `.env` with the output.

Generate a real `FIELD_ENCRYPTION_KEY`:
```bash
openssl rand -hex 32
```

Replace `FIELD_ENCRYPTION_KEY` in `.env`.

**Step 4: Start PostgreSQL and Redis**

Run:
```bash
docker compose -f docker/docker-compose.yml up -d
docker compose -f docker/docker-compose.yml ps
```

Expected: Both services show `(healthy)` status.

**Step 5: Verify PostgreSQL connection**

Run:
```bash
docker exec cmms-postgres psql -U cmms -d cmms -c "SELECT version();"
```

Expected: PostgreSQL 16.x version string.

**Step 6: Commit**

```bash
git add docker/docker-compose.yml .env.example
git commit -m "chore: add Docker Compose for PostgreSQL 16 and Redis 7"
```

---

### Task 0.7: Configure Prisma + initial schema

**Files:**
- Create: `D:/work/cmms/prisma/schema.prisma`
- Create: `D:/work/cmms/lib/db/client.ts`
- Create: `D:/work/cmms/lib/db/field-encryption.ts`
- Create: `D:/work/cmms/prisma/seed/index.ts`

**Step 1: Initialize Prisma**

Run:
```bash
pnpm prisma init --datasource-provider postgresql
```

This creates `prisma/schema.prisma` and updates `.env` (already exists, may warn).

**Step 2: Write minimal schema with User model only (for auth)**

Replace `D:/work/cmms/prisma/schema.prisma`:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ============ System ============

model User {
  id           String   @id @default(cuid())
  email        String   @unique
  name         String
  passwordHash String
  role         SystemRole @default(VIEWER)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  @@map("users")
}

enum SystemRole {
  SUPER_ADMIN
  VIEWER
}
```

**Step 3: Generate Prisma client and run first migration**

Run:
```bash
pnpm db:generate
pnpm db:migrate -- --name init
```

Expected: Migration `prisma/migrations/<timestamp>_init/migration.sql` created, applied to DB.

**Step 4: Create Prisma client singleton**

Create `D:/work/cmms/lib/db/client.ts`:

```typescript
import { PrismaClient } from '@prisma/client';

declare global {
  // eslint-disable-next-line no-var
  var __cmmsPrisma: PrismaClient | undefined;
}

export const prisma =
  global.__cmmsPrisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  global.__cmmsPrisma = prisma;
}
```

**Step 5: Create seed script**

Create `D:/work/cmms/prisma/seed/index.ts`:

```typescript
import bcrypt from 'bcryptjs';
import { prisma } from '../../lib/db/client';

async function main() {
  const passwordHash = await bcrypt.hash('admin123', 12);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@cmms.local' },
    update: {},
    create: {
      email: 'admin@cmms.local',
      name: '系统管理员',
      passwordHash,
      role: 'SUPER_ADMIN',
    },
  });

  console.log('Seeded admin user:', admin.email);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

**Step 6: Run seed**

Run:
```bash
pnpm db:seed
```

Expected: `Seeded admin user: admin@cmms.local`

**Step 7: Verify via psql**

Run:
```bash
docker exec cmms-postgres psql -U cmms -d cmms -c "SELECT id, email, name, role FROM users;"
```

Expected: One row with admin user.

**Step 8: Commit**

```bash
git add -A
git commit -m "feat: configure Prisma with User model and seed script"
```

---

### Task 0.8: Configure NextAuth.js v5

**Files:**
- Create: `D:/work/cmms/lib/auth/config.ts`
- Create: `D:/work/cmms/lib/auth/index.ts`
- Create: `D:/work/cmms/app/api/auth/[...nextauth]/route.ts`
- Create: `D:/work/cmms/middleware.ts`
- Create: `D:/work/cmms/app/login/page.tsx`
- Create: `D:/work/cmms/app/login/actions.ts`

**Step 1: Create auth config**

Create `D:/work/cmms/lib/auth/config.ts`:

```typescript
import NextAuth, { type NextAuthConfig } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db/client';

export const authConfig: NextAuthConfig = {
  session: { strategy: 'jwt', maxAge: 60 * 60 * 8 }, // 8 hours
  pages: { signIn: '/login' },
  providers: [
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(creds) {
        if (!creds?.email || !creds?.password) return null;
        const email = String(creds.email);
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) return null;
        const ok = await bcrypt.compare(String(creds.password), user.passwordHash);
        if (!ok) return null;
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role: string }).role;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
      }
      return session;
    },
  },
};

export const { auth, handlers, signIn, signOut } = NextAuth(authConfig);
```

**Step 2: Extend NextAuth types**

Create `D:/work/cmms/types/next-auth.d.ts`:

```typescript
import { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      role: string;
    } & DefaultSession['user'];
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    role: string;
  }
}
```

**Step 3: Create route handler**

Create `D:/work/cmms/app/api/auth/[...nextauth]/route.ts`:

```typescript
export { GET, POST } from '@/lib/auth/config';
```

Wait — `handlers` is exported from config. Fix:

```typescript
import { handlers } from '@/lib/auth/config';
export const { GET, POST } = handlers;
```

**Step 4: Create middleware for route protection**

Create `D:/work/cmms/middleware.ts`:

```typescript
import { auth } from '@/lib/auth/config';
import { NextResponse } from 'next/server';

const PUBLIC_PATHS = ['/login', '/api/auth', '/g', '/d'];

export default auth((req) => {
  const { pathname } = req.nextUrl;

  // Allow public paths
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Protect everything else
  if (!req.auth) {
    const loginUrl = new URL('/login', req.nextUrl.origin);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
});

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
```

**Step 5: Create login page**

Create `D:/work/cmms/app/login/page.tsx`:

```tsx
import { LoginForm } from './LoginForm';

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center p-8">
      <div className="w-full max-w-md">
        <h1 className="mb-6 text-2xl font-bold text-center">CMMS 登录</h1>
        <LoginForm />
      </div>
    </main>
  );
}
```

Create `D:/work/cmms/app/login/LoginForm.tsx`:

```tsx
'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const result = await signIn('credentials', {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      setError('邮箱或密码错误');
      setLoading(false);
      return;
    }

    const callbackUrl = params.get('callbackUrl') ?? '/dashboard';
    router.push(callbackUrl);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <Label htmlFor="email">邮箱</Label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
        />
      </div>
      <div>
        <Label htmlFor="password">密码</Label>
        <Input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="current-password"
        />
      </div>
      {error && <p className="text-sm text-red-500">{error}</p>}
      <Button type="submit" disabled={loading} className="w-full">
        {loading ? '登录中...' : '登录'}
      </Button>
      <p className="text-xs text-gray-500 text-center">默认账号: admin@cmms.local / admin123</p>
    </form>
  );
}
```

Add `SessionProvider` wrapper. Create `D:/work/cmms/app/providers.tsx`:

```tsx
'use client';

import { SessionProvider } from 'next-auth/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 60_000, refetchOnWindowFocus: false },
        },
      }),
  );

  return (
    <SessionProvider>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </SessionProvider>
  );
}
```

Modify `D:/work/cmms/app/layout.tsx` to wrap children with `<Providers>`:

```tsx
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'CMMS 会务管理系统',
  description: 'Conference Management & Member Service',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
```

**Step 6: Create dashboard placeholder**

Create `D:/work/cmms/app/dashboard/page.tsx`:

```tsx
import { auth } from '@/lib/auth/config';
import { redirect } from 'next/navigation';

export default async function DashboardPage() {
  const session = await auth();
  if (!session) redirect('/login');

  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold mb-4">控制台</h1>
      <p className="text-gray-600">欢迎, {session.user.name} ({session.user.role})</p>
    </main>
  );
}
```

**Step 7: Test login flow manually**

Run:
```bash
pnpm dev
```

Visit `http://localhost:3000` → should redirect to `/login`.
Login with `admin@cmms.local` / `admin123` → should redirect to `/dashboard`.

**Step 8: Commit**

```bash
git add -A
git commit -m "feat: configure NextAuth v5 with credentials provider and login page"
```

---

### Task 0.9: Configure Vitest

**Files:**
- Create: `D:/work/cmms/vitest.config.ts`
- Create: `D:/work/cmms/tests/setup.ts`
- Create: `D:/work/cmms/tests/example.test.ts`

**Step 1: Create vitest config**

Create `D:/work/cmms/vitest.config.ts`:

```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    include: ['**/*.{test,spec}.{ts,tsx}'],
    exclude: ['node_modules', '.next', 'tests/e2e/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['lib/**', 'app/**'],
      exclude: ['**/*.d.ts', '**/index.ts'],
    },
  },
  resolve: {
    alias: { '@': path.resolve(__dirname, './') },
  },
});
```

Install plugin:
```bash
pnpm add -D @vitejs/plugin-react
```

**Step 2: Create setup file**

Create `D:/work/cmms/tests/setup.ts`:

```typescript
import '@testing-library/jest-dom/vitest';
```

**Step 3: Write an example test to verify setup**

Create `D:/work/cmms/tests/example.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';

describe('vitest setup', () => {
  it('works', () => {
    expect(1 + 1).toBe(2);
  });
});
```

**Step 4: Run tests**

Run:
```bash
pnpm test
```

Expected: 1 test passed.

**Step 5: Commit**

```bash
git add -A
git commit -m "chore: configure Vitest with jsdom and React Testing Library"
```

---

### Task 0.10: Configure Playwright

**Files:**
- Create: `D:/work/cmms/playwright.config.ts`
- Create: `D:/work/cmms/tests/e2e/login.spec.ts`

**Step 1: Initialize Playwright**

Run:
```bash
pnpm dlx playwright@latest init --browser=chromium --lang=ts
```

This creates `playwright.config.ts` and `tests-e2e/` (we'll move to `tests/e2e/`).

**Step 2: Edit `playwright.config.ts`**

Replace with:

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [['html', { open: 'never' }]],
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    locale: 'zh-CN',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
```

**Step 3: Write login E2E test**

Create `D:/work/cmms/tests/e2e/login.spec.ts`:

```typescript
import { test, expect } from '@playwright/test';

test.describe('Login flow', () => {
  test('redirects unauthenticated user to login', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/login/);
  });

  test('logs in with valid credentials', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('邮箱').fill('admin@cmms.local');
    await page.getByLabel('密码').fill('admin123');
    await page.getByRole('button', { name: '登录' }).click();
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.getByText('控制台')).toBeVisible();
  });

  test('rejects invalid credentials', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('邮箱').fill('admin@cmms.local');
    await page.getByLabel('密码').fill('wrong');
    await page.getByRole('button', { name: '登录' }).click();
    await expect(page.getByText('邮箱或密码错误')).toBeVisible();
  });
});
```

**Step 4: Run E2E tests**

Run:
```bash
pnpm test:e2e
```

Expected: 3 tests passed.

**Step 5: Commit**

```bash
git add -A
git commit -m "test: configure Playwright with login E2E tests"
```

---

### Task 0.11: Create directory structure skeleton

**Files (create as empty with `.gitkeep` or README):**

```
lib/domain/guest/         README.md
lib/domain/meeting/       README.md
lib/domain/agenda/        README.md
lib/domain/reception/     README.md
lib/domain/transport/     README.md
lib/domain/lodging/       README.md
lib/domain/catering/      README.md
lib/domain/gift/          README.md
lib/shared/               README.md
lib/queue/                README.md
app/actions/              README.md
app/(staff)/dashboard/    page.tsx (already exists, move)
app/guest/                README.md
app/driver/               README.md
worker/                   README.md
```

**Step 1: Create domain module READMEs**

For each domain module under `lib/domain/`, create a `README.md` describing its responsibility. Example for `lib/domain/guest/README.md`:

```markdown
# Guest Domain Module

## Responsibility
- 嘉宾信息库 CRUD
- 跨会议沉淀的嘉宾档案
- 敏感字段加密（手机号、身份证）
- Excel 批量导入

## Structure
- `service.ts` - Business logic
- `repository.ts` - Data access
- `types.ts` - Types
- `schema.ts` - Zod schemas

## Dependencies
- prisma client (`lib/db/client`)
- field encryption (`lib/db/field-encryption`)
```

Repeat for other 7 modules (meeting, agenda, reception, transport, lodging, catering, gift) with appropriate content.

**Step 2: Create shared lib README**

Create `D:/work/cmms/lib/shared/README.md`:

```markdown
# Shared Library

前后端共享的 Zod schema / 类型 / 枚举 / 常量。

## Usage
```ts
import { GuestLevel, guestSchema } from '@/lib/shared/guest';
```
```

**Step 3: Create worker entry stub**

Create `D:/work/cmms/worker/index.ts`:

```typescript
import { logger } from '@/lib/utils/logger';

logger.info('CMMS worker starting (placeholder)');

// BullMQ workers will be registered here in Phase 1 Task 1.11
```

Create `D:/work/cmms/lib/utils/logger.ts`:

```typescript
import pino from 'pino';

export const logger = pino({
  level: process.env.LOG_LEVEL ?? 'info',
  transport:
    process.env.NODE_ENV === 'development'
      ? { target: 'pino-pretty', options: { colorize: true } }
      : undefined,
});
```

**Step 4: Move dashboard to (staff) route group**

Run:
```bash
mkdir -p "app/(staff)"
git mv app/dashboard "app/(staff)/dashboard"
```

Update `D:/work/cmms/middleware.ts` — the route group `(staff)` doesn't affect URL, so `/dashboard` path stays the same.

**Step 5: Commit**

```bash
git add -A
git commit -m "chore: create domain module structure and worker entry"
```

---

### Task 0.12: Configure GitHub Actions CI

**Files:**
- Create: `D:/work/cmms/.github/workflows/ci.yml`

**Step 1: Create CI workflow**

Create `D:/work/cmms/.github/workflows/ci.yml`:

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    timeout-minutes: 30

    services:
      postgres:
        image: postgres:16-alpine
        env:
          POSTGRES_USER: cmms
          POSTGRES_PASSWORD: cmms_dev_password
          POSTGRES_DB: cmms
        ports: ['5432:5432']
        options: >-
          --health-cmd "pg_isready -U cmms"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

      redis:
        image: redis:7-alpine
        ports: ['6379:6379']
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    env:
      DATABASE_URL: postgresql://cmms:cmms_dev_password@localhost:5432/cmms?schema=public
      REDIS_URL: redis://localhost:6379
      NEXTAUTH_SECRET: ci-test-secret-not-for-production
      NEXTAUTH_URL: http://localhost:3000
      FIELD_ENCRYPTION_KEY: 0000000000000000000000000000000000000000000000000000000000000000

    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v4
        with:
          version: latest

      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'

      - run: pnpm install --frozen-lockfile

      - name: Lint
        run: pnpm lint

      - name: Type check
        run: pnpm typecheck

      - name: Format check
        run: pnpm format:check

      - name: Prisma migrate
        run: pnpm db:migrate -- --skip-seed

      - name: Unit tests
        run: pnpm test -- --coverage

      - name: Build
        run: pnpm build

      - name: Install Playwright browsers
        run: pnpm exec playwright install --with-deps chromium

      - name: E2E tests
        run: pnpm test:e2e

      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 7
```

**Step 2: Commit**

```bash
git add -A
git commit -m "ci: add GitHub Actions workflow for lint, test, build, E2E"
```

---

### Task 0.13: Phase 0 final integration commit

**Step 1: Verify all checks pass locally**

Run:
```bash
pnpm lint && pnpm typecheck && pnpm format:check && pnpm test && pnpm build
```

Expected: all green.

**Step 2: Tag the milestone**

Run:
```bash
git tag -a v0.1.0-foundation -m "Phase 0 complete: project skeleton with auth, DB, CI"
git log --oneline
```

Expected: ~13 commits since project init.

---

## Phase 1: Guest Module End-to-End (Tasks 1.1 - 1.14)

**Goal:** Build a complete vertical slice through Guest (嘉宾库) module: Prisma schema → repository → service → Server Actions → UI (list/detail/form) → Excel import → tests. This establishes the pattern for the remaining 7 domain modules.

### Task 1.1: Prisma schema — Guest model + enums

**Files:**
- Modify: `D:/work/cmms/prisma/schema.prisma`
- Test: `D:/work/cmms/tests/unit/guest/schema.test.ts`

**Step 1: Write the failing test**

Create `D:/work/cmms/tests/unit/guest/schema.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { guestLevelSchema, genderSchema } from '@/lib/shared/guest';

describe('Guest enums', () => {
  it('accepts valid GuestLevel', () => {
    expect(guestLevelSchema.parse('VIP_A')).toBe('VIP_A');
    expect(guestLevelSchema.parse('B')).toBe('B');
  });

  it('rejects invalid GuestLevel', () => {
    expect(() => guestLevelSchema.parse('VIP')).toThrow();
    expect(() => guestLevelSchema.parse('X')).toThrow();
  });

  it('accepts valid Gender', () => {
    expect(genderSchema.parse('MALE')).toBe('MALE');
    expect(genderSchema.parse('FEMALE')).toBe('FEMALE');
  });
});
```

**Step 2: Run test to verify it fails**

```bash
pnpm test tests/unit/guest/schema.test.ts
```

Expected: FAIL — `lib/shared/guest` doesn't exist.

**Step 3: Add Guest model to Prisma schema**

Append to `prisma/schema.prisma` (before the closing if any):

```prisma
// ============ Guest ============

model Guest {
  id          String     @id @default(cuid())
  name        String
  gender      Gender?
  phone       String?    @unique
  email       String?
  company     String?
  title       String?
  level       GuestLevel @default(C)
  avatarUrl   String?
  idNumber    String?
  dietaryTags String[]
  notes       String?
  deletedAt   DateTime?

  meetingGuests MeetingGuest[]
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  @@index([name])
  @@index([company])
  @@map("guests")
}

enum Gender {
  MALE
  FEMALE
  OTHER
}

enum GuestLevel {
  VIP_A
  VIP_B
  A
  B
  C
}

// Forward declaration — full definition in Task 2.1 (next plan)
model MeetingGuest {
  id String @id @default(cuid())

  @@map("meeting_guests")
}
```

**Step 4: Create shared schemas**

Create `D:/work/cmms/lib/shared/guest.ts`:

```typescript
import { z } from 'zod';

export const guestLevelSchema = z.enum(['VIP_A', 'VIP_B', 'A', 'B', 'C']);
export type GuestLevel = z.infer<typeof guestLevelSchema>;

export const genderSchema = z.enum(['MALE', 'FEMALE', 'OTHER']);
export type Gender = z.infer<typeof genderSchema>;

export const guestCreateSchema = z.object({
  name: z.string().min(1, '姓名必填').max(100),
  gender: genderSchema.optional(),
  phone: z
    .string()
    .regex(/^1[3-9]\d{9}$/, '手机号格式错误')
    .optional()
    .or(z.literal('')),
  email: z.string().email('邮箱格式错误').optional().or(z.literal('')),
  company: z.string().max(200).optional(),
  title: z.string().max(100).optional(),
  level: guestLevelSchema.default('C'),
  avatarUrl: z.string().url().optional(),
  idNumber: z
    .string()
    .regex(/^[1-9]\d{16}[\dXx]$/, '身份证号格式错误')
    .optional()
    .or(z.literal('')),
  dietaryTags: z.array(z.string()).default([]),
  notes: z.string().max(2000).optional(),
});

export type GuestCreateInput = z.infer<typeof guestCreateSchema>;

export const guestUpdateSchema = guestCreateSchema.partial();
export type GuestUpdateInput = z.infer<typeof guestUpdateSchema>;
```

**Step 5: Run migration**

```bash
pnpm db:migrate -- --name add-guest-model
pnpm db:generate
```

**Step 6: Run tests to verify pass**

```bash
pnpm test tests/unit/guest/schema.test.ts
```

Expected: PASS.

**Step 7: Commit**

```bash
git add -A
git commit -m "feat(guest): add Guest Prisma model and shared Zod schemas"
```

---

### Task 1.2: Field encryption middleware (sensitive data)

**Files:**
- Create: `D:/work/cmms/lib/db/field-encryption.ts`
- Create: `D:/work/cmms/lib/db/prisma-extensions.ts`
- Test: `D:/work/cmms/tests/unit/db/field-encryption.test.ts`

**Step 1: Write the failing test**

Create `D:/work/cmms/tests/unit/db/field-encryption.test.ts`:

```typescript
import { describe, it, expect, beforeAll } from 'vitest';
import { encrypt, decrypt } from '@/lib/db/field-encryption';

describe('field encryption', () => {
  beforeAll(() => {
    process.env.FIELD_ENCRYPTION_KEY = 'a'.repeat(64);
  });

  it('encrypts and decrypts a value round-trip', () => {
    const original = '13812345678';
    const encrypted = encrypt(original);
    expect(encrypted).not.toBe(original);
    expect(encrypted).toMatch(/^enc:/);
    expect(decrypt(encrypted)).toBe(original);
  });

  it('handles empty values', () => {
    expect(encrypt('')).toBe('');
    expect(decrypt('')).toBe('');
    expect(decrypt(null as unknown as string)).toBeNull();
  });

  it('produces different ciphertext for same plaintext (random IV)', () => {
    const a = encrypt('13812345678');
    const b = encrypt('13812345678');
    expect(a).not.toBe(b);
    expect(decrypt(a)).toBe(decrypt(b));
  });
});
```

**Step 2: Run test to verify it fails**

```bash
pnpm test tests/unit/db/field-encryption.test.ts
```

Expected: FAIL — module not found.

**Step 3: Implement encryption**

Create `D:/work/cmms/lib/db/field-encryption.ts`:

```typescript
import crypto from 'crypto';

const ALGO = 'aes-256-gcm';
const IV_LEN = 12; // 96-bit IV for GCM
const TAG_LEN = 16;
const PREFIX = 'enc:';

function getKey(): Buffer {
  const hex = process.env.FIELD_ENCRYPTION_KEY;
  if (!hex || hex.length !== 64) {
    throw new Error('FIELD_ENCRYPTION_KEY must be a 32-byte hex string (64 chars)');
  }
  return Buffer.from(hex, 'hex');
}

export function encrypt(plaintext: string | null | undefined): string {
  if (plaintext == null || plaintext === '') return plaintext ?? '';
  const iv = crypto.randomBytes(IV_LEN);
  const cipher = crypto.createCipheriv(ALGO, getKey(), iv);
  const enc = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return PREFIX + Buffer.concat([iv, tag, enc]).toString('base64');
}

export function decrypt(ciphertext: string | null | undefined): string | null {
  if (ciphertext == null) return null;
  if (ciphertext === '') return '';
  if (!ciphertext.startsWith(PREFIX)) return ciphertext; // assume plaintext (legacy)
  const data = Buffer.from(ciphertext.slice(PREFIX.length), 'base64');
  const iv = data.subarray(0, IV_LEN);
  const tag = data.subarray(IV_LEN, IV_LEN + TAG_LEN);
  const enc = data.subarray(IV_LEN + TAG_LEN);
  const decipher = crypto.createDecipheriv(ALGO, getKey(), iv);
  decipher.setAuthTag(tag);
  const dec = Buffer.concat([decipher.update(enc), decipher.final()]);
  return dec.toString('utf8');
}

/**
 * Returns a mask-friendly version: 138****5678
 */
export function maskPhone(phone: string | null | undefined): string {
  if (!phone || phone.length < 7) return phone ?? '';
  return phone.slice(0, 3) + '****' + phone.slice(-4);
}

/**
 * Returns a mask-friendly version: 110101********1234
 */
export function maskIdNumber(id: string | null | undefined): string {
  if (!id || id.length < 8) return id ?? '';
  return id.slice(0, 6) + '********' + id.slice(-4);
}
```

**Step 4: Run tests to verify pass**

```bash
pnpm test tests/unit/db/field-encryption.test.ts
```

Expected: 3 tests pass.

**Step 5: Add Prisma extension for transparent encryption**

Create `D:/work/cmms/lib/db/prisma-extensions.ts`:

```typescript
import { PrismaClient } from '@prisma/client';
import { encrypt, decrypt } from './field-encryption';

const ENCRYPTED_FIELDS: Record<string, string[]> = {
  Guest: ['phone', 'idNumber'],
};

export function applyEncryptionExtension(client: PrismaClient): PrismaClient {
  return client.$extends({
    query: {
      $allModels: {
        async create({ model, args, query }) {
          const fields = ENCRYPTED_FIELDS[model];
          if (fields) {
            for (const f of fields) {
              if (args.data && args.data[f] != null) {
                args.data[f] = encrypt(args.data[f]);
              }
            }
          }
          return query(args);
        },
        async createMany({ model, args, query }) {
          const fields = ENCRYPTED_FIELDS[model];
          if (fields) {
            for (const row of args.data as Array<Record<string, unknown>>) {
              for (const f of fields) {
                if (row[f] != null) row[f] = encrypt(row[f] as string);
              }
            }
          }
          return query(args);
        },
        async update({ model, args, query }) {
          const fields = ENCRYPTED_FIELDS[model];
          if (fields && args.data) {
            for (const f of fields) {
              if (args.data[f] != null) args.data[f] = encrypt(args.data[f] as string);
            }
          }
          return query(args);
        },
        async findMany({ model, args, query }) {
          const result = await query(args);
          const fields = ENCRYPTED_FIELDS[model];
          if (fields) {
            for (const row of result as Array<Record<string, unknown>>) {
              for (const f of fields) {
                if (row[f] != null) row[f] = decrypt(row[f] as string);
              }
            }
          }
          return result;
        },
        async findUnique({ model, args, query }) {
          const result = await query(args);
          const fields = ENCRYPTED_FIELDS[model];
          if (result && fields) {
            const row = result as Record<string, unknown>;
            for (const f of fields) {
              if (row[f] != null) row[f] = decrypt(row[f] as string);
            }
          }
          return result;
        },
        async findFirst({ model, args, query }) {
          const result = await query(args);
          const fields = ENCRYPTED_FIELDS[model];
          if (result && fields) {
            const row = result as Record<string, unknown>;
            for (const f of fields) {
              if (row[f] != null) row[f] = decrypt(row[f] as string);
            }
          }
          return result;
        },
      },
    },
  }) as PrismaClient;
}
```

**Step 6: Apply extension in client**

Modify `D:/work/cmms/lib/db/client.ts`:

```typescript
import { PrismaClient } from '@prisma/client';
import { applyEncryptionExtension } from './prisma-extensions';

declare global {
  // eslint-disable-next-line no-var
  var __cmmsPrisma: PrismaClient | undefined;
}

const baseClient =
  global.__cmmsPrisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

export const prisma = applyEncryptionExtension(baseClient);

if (process.env.NODE_ENV !== 'production') {
  global.__cmmsPrisma = baseClient;
}
```

**Step 7: Commit**

```bash
git add -A
git commit -m "feat(db): add AES-256-GCM field encryption with Prisma extension"
```

---

### Task 1.3: Guest repository layer

**Files:**
- Create: `D:/work/cmms/lib/domain/guest/types.ts`
- Create: `D:/work/cmms/lib/domain/guest/repository.ts`
- Test: `D:/work/cmms/tests/unit/guest/repository.test.ts`

**Step 1: Write the failing test**

Create `D:/work/cmms/tests/unit/guest/repository.test.ts`:

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { guestRepository } from '@/lib/domain/guest/repository';

// Mock prisma
vi.mock('@/lib/db/client', () => ({
  prisma: {
    guest: {
      create: vi.fn(),
      update: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

import { prisma } from '@/lib/db/client';

describe('guestRepository', () => {
  beforeEach(() => vi.clearAllMocks());

  it('create() persists a guest', async () => {
    vi.mocked(prisma.guest.create).mockResolvedValue({
      id: 'g1',
      name: '张三',
      gender: 'MALE',
      phone: '13812345678',
      email: null,
      company: null,
      title: null,
      level: 'C',
      avatarUrl: null,
      idNumber: null,
      dietaryTags: [],
      notes: null,
      deletedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      meetingGuests: [],
    });

    const result = await guestRepository.create({
      name: '张三',
      gender: 'MALE',
      phone: '13812345678',
      level: 'C',
      dietaryTags: [],
    });

    expect(result.id).toBe('g1');
    expect(prisma.guest.create).toHaveBeenCalledWith({
      data: {
        name: '张三',
        gender: 'MALE',
        phone: '13812345678',
        level: 'C',
        dietaryTags: [],
      },
    });
  });

  it('findById() returns null for missing guest', async () => {
    vi.mocked(prisma.guest.findUnique).mockResolvedValue(null);
    const result = await guestRepository.findById('missing');
    expect(result).toBeNull();
  });

  it('list() applies pagination and search', async () => {
    vi.mocked(prisma.guest.findMany).mockResolvedValue([]);
    vi.mocked(prisma.guest.count).mockResolvedValue(0);

    await guestRepository.list({ search: '张', page: 1, pageSize: 20 });

    expect(prisma.guest.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          OR: expect.arrayContaining([
            expect.objectContaining({ name: expect.objectContaining({ contains: '张' }) }),
          ]),
          deletedAt: null,
        }),
        skip: 0,
        take: 20,
      }),
    );
  });

  it('softDelete() sets deletedAt instead of deleting', async () => {
    vi.mocked(prisma.guest.update).mockResolvedValue({} as never);
    await guestRepository.softDelete('g1');
    expect(prisma.guest.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'g1' },
        data: expect.objectContaining({ deletedAt: expect.any(Date) }),
      }),
    );
  });
});
```

**Step 2: Run test to verify it fails**

```bash
pnpm test tests/unit/guest/repository.test.ts
```

Expected: FAIL.

**Step 3: Implement types**

Create `D:/work/cmms/lib/domain/guest/types.ts`:

```typescript
import type { Guest, GuestLevel, Gender } from '@prisma/client';

export type GuestEntity = Guest;

export interface GuestListParams {
  search?: string;
  level?: GuestLevel;
  company?: string;
  page?: number;
  pageSize?: number;
  includeDeleted?: boolean;
}

export interface GuestListResult {
  items: Guest[];
  total: number;
  page: number;
  pageSize: number;
}

export interface GuestCreateData {
  name: string;
  gender?: Gender;
  phone?: string;
  email?: string;
  company?: string;
  title?: string;
  level: GuestLevel;
  avatarUrl?: string;
  idNumber?: string;
  dietaryTags?: string[];
  notes?: string;
}

export interface GuestUpdateData {
  name?: string;
  gender?: Gender | null;
  phone?: string | null;
  email?: string | null;
  company?: string | null;
  title?: string | null;
  level?: GuestLevel;
  avatarUrl?: string | null;
  idNumber?: string | null;
  dietaryTags?: string[];
  notes?: string | null;
}
```

**Step 4: Implement repository**

Create `D:/work/cmms/lib/domain/guest/repository.ts`:

```typescript
import { prisma } from '@/lib/db/client';
import type {
  GuestCreateData,
  GuestListParams,
  GuestListResult,
  GuestUpdateData,
} from './types';

export const guestRepository = {
  async create(data: GuestCreateData) {
    return prisma.guest.create({
      data: {
        name: data.name,
        gender: data.gender,
        phone: data.phone,
        email: data.email,
        company: data.company,
        title: data.title,
        level: data.level,
        avatarUrl: data.avatarUrl,
        idNumber: data.idNumber,
        dietaryTags: data.dietaryTags ?? [],
        notes: data.notes,
      },
    });
  },

  async update(id: string, data: GuestUpdateData) {
    return prisma.guest.update({ where: { id }, data });
  },

  async findById(id: string) {
    return prisma.guest.findUnique({ where: { id } });
  },

  async findByPhone(phone: string) {
    return prisma.guest.findUnique({ where: { phone } });
  },

  async list(params: GuestListParams): Promise<GuestListResult> {
    const { search, level, company, page = 1, pageSize = 20, includeDeleted = false } = params;

    const where: Record<string, unknown> = {};
    if (!includeDeleted) where.deletedAt = null;
    if (level) where.level = level;
    if (company) where.company = { contains: company, mode: 'insensitive' };
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } },
        { company: { contains: search, mode: 'insensitive' } },
        { title: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      prisma.guest.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.guest.count({ where }),
    ]);

    return { items, total, page, pageSize };
  },

  async softDelete(id: string) {
    return prisma.guest.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  },
};
```

**Step 5: Run tests to verify pass**

```bash
pnpm test tests/unit/guest/repository.test.ts
```

Expected: 4 tests pass.

**Step 6: Commit**

```bash
git add -A
git commit -m "feat(guest): implement repository layer with pagination and soft delete"
```

---

### Task 1.4: Guest service layer (business rules)

**Files:**
- Create: `D:/work/cmms/lib/domain/guest/service.ts`
- Create: `D:/work/cmms/lib/shared/errors.ts`
- Test: `D:/work/cmms/tests/unit/guest/service.test.ts`

**Step 1: Write the failing test**

Create `D:/work/cmms/tests/unit/guest/service.test.ts`:

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('@/lib/domain/guest/repository', () => ({
  guestRepository: {
    create: vi.fn(),
    update: vi.fn(),
    findById: vi.fn(),
    findByPhone: vi.fn(),
    list: vi.fn(),
    softDelete: vi.fn(),
  },
}));

import { guestService } from '@/lib/domain/guest/service';
import { guestRepository } from '@/lib/domain/guest/repository';
import { ConflictError, NotFoundError } from '@/lib/shared/errors';

describe('guestService', () => {
  beforeEach(() => vi.clearAllMocks());

  describe('create', () => {
    it('rejects duplicate phone', async () => {
      vi.mocked(guestRepository.findByPhone).mockResolvedValue({
        id: 'existing',
      } as never);

      await expect(
        guestService.create({
          name: '张三',
          phone: '13812345678',
          level: 'C',
        }),
      ).rejects.toThrow(ConflictError);
    });

    it('creates when phone is unique', async () => {
      vi.mocked(guestRepository.findByPhone).mockResolvedValue(null);
      vi.mocked(guestRepository.create).mockResolvedValue({
        id: 'g1',
        name: '张三',
      } as never);

      const result = await guestService.create({
        name: '张三',
        phone: '13812345678',
        level: 'C',
      });

      expect(result.id).toBe('g1');
    });
  });

  describe('update', () => {
    it('rejects update of missing guest', async () => {
      vi.mocked(guestRepository.findById).mockResolvedValue(null);
      await expect(guestService.update('missing', { name: 'X' })).rejects.toThrow(NotFoundError);
    });
  });

  describe('delete', () => {
    it('soft deletes existing guest', async () => {
      vi.mocked(guestRepository.findById).mockResolvedValue({ id: 'g1' } as never);
      vi.mocked(guestRepository.softDelete).mockResolvedValue({} as never);
      await guestService.delete('g1');
      expect(guestRepository.softDelete).toHaveBeenCalledWith('g1');
    });
  });
});
```

**Step 2: Run test to verify it fails**

```bash
pnpm test tests/unit/guest/service.test.ts
```

Expected: FAIL.

**Step 3: Implement shared errors**

Create `D:/work/cmms/lib/shared/errors.ts`:

```typescript
export class AppError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode: number = 500,
  ) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 'VALIDATION_ERROR', 400);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, id: string) {
    super(`${resource} not found: ${id}`, 'NOT_FOUND', 404);
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 'CONFLICT', 409);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized') {
    super(message, 'UNAUTHORIZED', 401);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden') {
    super(message, 'FORBIDDEN', 403);
  }
}

/**
 * Convert any error to a safe public message.
 * Internal details only logged, not returned.
 */
export function toPublicError(error: unknown): { code: string; message: string; statusCode: number } {
  if (error instanceof AppError) {
    return { code: error.code, message: error.message, statusCode: error.statusCode };
  }
  return { code: 'INTERNAL_ERROR', message: 'Internal server error', statusCode: 500 };
}
```

**Step 4: Implement service**

Create `D:/work/cmms/lib/domain/guest/service.ts`:

```typescript
import { guestRepository } from './repository';
import { ConflictError, NotFoundError } from '@/lib/shared/errors';
import type { GuestCreateData, GuestListParams, GuestUpdateData } from './types';

export const guestService = {
  async create(data: GuestCreateData) {
    if (data.phone) {
      const existing = await guestRepository.findByPhone(data.phone);
      if (existing) {
        throw new ConflictError(`Guest with phone ${data.phone} already exists`);
      }
    }
    return guestRepository.create(data);
  },

  async update(id: string, data: GuestUpdateData) {
    const existing = await guestRepository.findById(id);
    if (!existing) throw new NotFoundError('Guest', id);

    if (data.phone && data.phone !== existing.phone) {
      const dupe = await guestRepository.findByPhone(data.phone);
      if (dupe) throw new ConflictError(`Phone ${data.phone} already in use`);
    }

    return guestRepository.update(id, data);
  },

  async findById(id: string) {
    const guest = await guestRepository.findById(id);
    if (!guest) throw new NotFoundError('Guest', id);
    return guest;
  },

  async list(params: GuestListParams) {
    return guestRepository.list(params);
  },

  async delete(id: string) {
    const existing = await guestRepository.findById(id);
    if (!existing) throw new NotFoundError('Guest', id);
    return guestRepository.softDelete(id);
  },
};
```

**Step 5: Run tests to verify pass**

```bash
pnpm test tests/unit/guest/service.test.ts
```

Expected: 3+ tests pass.

**Step 6: Commit**

```bash
git add -A
git commit -m "feat(guest): implement service layer with business rules and shared errors"
```

---

### Task 1.5: CASL permission rules

**Files:**
- Create: `D:/work/cmms/lib/auth/abilities.ts`
- Test: `D:/work/cmms/tests/unit/auth/abilities.test.ts`

**Step 1: Write the failing test**

Create `D:/work/cmms/tests/unit/auth/abilities.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { defineAbilityFor, type AppSubject } from '@/lib/auth/abilities';

describe('abilities', () => {
  it('SUPER_ADMIN can manage everything', () => {
    const ability = defineAbilityFor({ role: 'SUPER_ADMIN' });
    expect(ability.can('manage', 'Guest')).toBe(true);
    expect(ability.can('delete', 'Guest')).toBe(true);
  });

  it('VIEWER can read but not write', () => {
    const ability = defineAbilityFor({ role: 'VIEWER' });
    expect(ability.can('read', 'Guest')).toBe(true);
    expect(ability.can('create', 'Guest')).toBe(false);
    expect(ability.can('delete', 'Guest')).toBe(false);
  });

  it('VIEWER cannot read AuditLog', () => {
    const ability = defineAbilityFor({ role: 'VIEWER' });
    expect(ability.can('read', 'AuditLog')).toBe(false);
  });
});
```

**Step 2: Run test to verify it fails**

```bash
pnpm test tests/unit/auth/abilities.test.ts
```

Expected: FAIL.

**Step 3: Implement abilities**

Create `D:/work/cmms/lib/auth/abilities.ts`:

```typescript
import { AbilityBuilder, createMongoAbility, type MongoAbility } from '@casl/ability';

export type AppAction = 'create' | 'read' | 'update' | 'delete' | 'manage';
export type AppSubject =
  | 'Guest'
  | 'Meeting'
  | 'MeetingGuest'
  | 'AgendaItem'
  | 'TransportOrder'
  | 'LodgingOrder'
  | 'CateringOrder'
  | 'GiftOrder'
  | 'FeeRecord'
  | 'AuditLog'
  | 'User';

export interface AppUser {
  role: 'SUPER_ADMIN' | 'VIEWER' | string; // extended per-meeting later
  meetingRoles?: Record<string, string>; // meetingId -> MeetingRole
}

export type AppAbility = MongoAbility<[AppAction, AppSubject]>;

export function defineAbilityFor(user: AppUser): AppAbility {
  const { can, cannot, build } = new AbilityBuilder<AppAbility>(createMongoAbility);

  if (user.role === 'SUPER_ADMIN') {
    can('manage', 'all'); // full access
    return build();
  }

  // VIEWER (and default)
  can('read', ['Guest', 'Meeting', 'MeetingGuest', 'AgendaItem']);
  cannot('read', ['AuditLog', 'User']);
  cannot('manage', 'all');

  // Per-meeting roles will be layered on in Phase 2
  // (ReceptionLead / Coordinator etc.)

  return build();
}

export function assertCan(
  ability: AppAbility,
  action: AppAction,
  subject: AppSubject,
): void {
  if (!ability.can(action, subject)) {
    throw new Error(`Forbidden: ${action} ${subject}`);
  }
}
```

**Step 4: Run tests to verify pass**

```bash
pnpm test tests/unit/auth/abilities.test.ts
```

Expected: 3 tests pass.

**Step 5: Commit**

```bash
git add -A
git commit -m "feat(auth): implement CASL ability rules with SUPER_ADMIN and VIEWER"
```

---

### Task 1.6: Server Actions for Guest (create/update/delete)

**Files:**
- Create: `D:/work/cmms/app/actions/guest.actions.ts`
- Create: `D:/work/cmms/lib/actions/utils.ts`
- Test: `D:/work/cmms/tests/unit/actions/guest.test.ts`

**Step 1: Write the failing test**

Create `D:/work/cmms/tests/unit/actions/guest.test.ts`:

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('@/lib/auth/config', () => ({
  auth: vi.fn(),
}));

vi.mock('@/lib/domain/guest/service', () => ({
  guestService: {
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

import { createGuest, updateGuest, deleteGuest } from '@/app/actions/guest.actions';
import { guestService } from '@/lib/domain/guest/service';
import { auth } from '@/lib/auth/config';

describe('guest actions', () => {
  beforeEach(() => vi.clearAllMocks());

  it('rejects unauthenticated call', async () => {
    vi.mocked(auth).mockResolvedValue(null as never);
    const result = await createGuest({ name: '张三', level: 'C' });
    expect(result.ok).toBe(false);
  });

  it('rejects VIEWER role', async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { id: 'u1', role: 'VIEWER', name: 'X', email: 'x@x.com' },
    } as never);
    const result = await createGuest({ name: '张三', level: 'C' });
    expect(result.ok).toBe(false);
  });

  it('validates input', async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { id: 'u1', role: 'SUPER_ADMIN', name: 'X', email: 'x@x.com' },
    } as never);
    const result = await createGuest({ name: '', level: 'C' });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors).toBeDefined();
    }
  });

  it('creates guest successfully', async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { id: 'u1', role: 'SUPER_ADMIN', name: 'X', email: 'x@x.com' },
    } as never);
    vi.mocked(guestService.create).mockResolvedValue({ id: 'g1', name: '张三' } as never);

    const result = await createGuest({ name: '张三', level: 'C' });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.id).toBe('g1');
    }
  });
});
```

**Step 2: Run test to verify it fails**

```bash
pnpm test tests/unit/actions/guest.test.ts
```

Expected: FAIL.

**Step 3: Implement action utilities**

Create `D:/work/cmms/lib/actions/utils.ts`:

```typescript
import { ZodError, type ZodSchema } from 'zod';
import { auth } from '@/lib/auth/config';
import { defineAbilityFor, type AppAbility, type AppSubject, type AppAction } from '@/lib/auth/abilities';
import { ForbiddenError, UnauthorizedError } from '@/lib/shared/errors';

export interface ActionResult<T> {
  ok: boolean;
  data?: T;
  error?: { code: string; message: string };
  errors?: Record<string, string[]>; // field validation errors
}

export async function getContext() {
  const session = await auth();
  if (!session?.user) throw new UnauthorizedError();

  const ability = defineAbilityFor({
    role: session.user.role,
  });

  return { session, ability };
}

export function assertAuthorized(
  ability: AppAbility,
  action: AppAction,
  subject: AppSubject,
) {
  if (!ability.can(action, subject)) {
    throw new ForbiddenError(`${action} ${subject}`);
  }
}

export function validate<T>(schema: ZodSchema<T>, input: unknown): T {
  return schema.parse(input);
}

export function handleError(error: unknown): ActionResult<never> {
  if (error instanceof ZodError) {
    return {
      ok: false,
      error: { code: 'VALIDATION_ERROR', message: 'Input validation failed' },
      errors: error.flatten().fieldErrors,
    };
  }
  if (error instanceof ForbiddenError || error instanceof UnauthorizedError) {
    return { ok: false, error: { code: 'FORBIDDEN', message: error.message } };
  }
  // AppError subclasses
  if (error instanceof Error && 'code' in error && 'statusCode' in error) {
    const e = error as Error & { code: string; message: string };
    return { ok: false, error: { code: e.code, message: e.message } };
  }
  console.error('[action] unexpected error', error);
  return { ok: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } };
}
```

**Step 4: Implement guest actions**

Create `D:/work/cmms/app/actions/guest.actions.ts`:

```typescript
'use server';

import { guestCreateSchema, guestUpdateSchema } from '@/lib/shared/guest';
import { guestService } from '@/lib/domain/guest/service';
import { assertAuthorized, getContext, handleError, type ActionResult } from '@/lib/actions/utils';
import { revalidatePath } from 'next/cache';

export async function createGuest(
  input: Record<string, unknown>,
): Promise<ActionResult<{ id: string }>> {
  try {
    const { ability } = await getContext();
    assertAuthorized(ability, 'create', 'Guest');

    const data = guestCreateSchema.parse(input);
    const guest = await guestService.create(data);
    revalidatePath('/guests');

    return { ok: true, data: { id: guest.id } };
  } catch (e) {
    return handleError(e);
  }
}

export async function updateGuest(
  id: string,
  input: Record<string, unknown>,
): Promise<ActionResult<{ id: string }>> {
  try {
    const { ability } = await getContext();
    assertAuthorized(ability, 'update', 'Guest');

    const data = guestUpdateSchema.parse(input);
    const guest = await guestService.update(id, data);
    revalidatePath('/guests');
    revalidatePath(`/guests/${id}`);

    return { ok: true, data: { id: guest.id } };
  } catch (e) {
    return handleError(e);
  }
}

export async function deleteGuest(id: string): Promise<ActionResult<{ id: string }>> {
  try {
    const { ability } = await getContext();
    assertAuthorized(ability, 'delete', 'Guest');

    await guestService.delete(id);
    revalidatePath('/guests');

    return { ok: true, data: { id } };
  } catch (e) {
    return handleError(e);
  }
}
```

**Step 5: Run tests to verify pass**

```bash
pnpm test tests/unit/actions/guest.test.ts
```

Expected: 4 tests pass.

**Step 6: Commit**

```bash
git add -A
git commit -m "feat(guest): add Server Actions with auth, validation, and error handling"
```

---

### Task 1.7: Staff UI — Guest list page

**Files:**
- Create: `D:/work/cmms/app/(staff)/guests/page.tsx`
- Create: `D:/work/cmms/app/(staff)/guests/GuestList.tsx`
- Create: `D:/work/cmms/components/layout/StaffLayout.tsx`

**Step 1: Create staff layout**

Create `D:/work/cmms/components/layout/StaffLayout.tsx`:

```tsx
import Link from 'next/link';
import { auth } from '@/lib/auth/config';
import { redirect } from 'next/navigation';

const NAV_ITEMS = [
  { href: '/dashboard', label: '控制台' },
  { href: '/guests', label: '嘉宾库' },
  { href: '/meetings', label: '会议管理' },
];

export default async function StaffLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session) redirect('/login');

  return (
    <div className="min-h-screen flex">
      <aside className="w-56 bg-slate-900 text-slate-100 p-4">
        <div className="mb-6">
          <h1 className="text-lg font-bold">CMMS</h1>
          <p className="text-xs text-slate-400">会务管理系统</p>
        </div>
        <nav className="space-y-1">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block px-3 py-2 rounded text-sm hover:bg-slate-800"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="absolute bottom-4 left-4 text-xs">
          <p>{session.user.name}</p>
          <p className="text-slate-400">{session.user.role}</p>
        </div>
      </aside>
      <main className="flex-1 p-8 bg-slate-50">{children}</main>
    </div>
  );
}
```

Create `D:/work/cmms/app/(staff)/layout.tsx`:

```tsx
import StaffLayout from '@/components/layout/StaffLayout';

export default function Layout({ children }: { children: React.ReactNode }) {
  return <StaffLayout>{children}</StaffLayout>;
}
```

**Step 2: Create Guest list page (Server Component)**

Create `D:/work/cmms/app/(staff)/guests/page.tsx`:

```tsx
import { guestService } from '@/lib/domain/guest/service';
import { GuestList } from './GuestList';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface PageProps {
  searchParams: Promise<{ search?: string; level?: string; page?: string }>;
}

export default async function GuestsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const result = await guestService.list({
    search: params.search,
    level: params.level as 'VIP_A' | 'VIP_B' | 'A' | 'B' | 'C' | undefined,
    page: params.page ? Number(params.page) : 1,
    pageSize: 20,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">嘉宾库</h1>
          <p className="text-sm text-slate-500">共 {result.total} 位嘉宾</p>
        </div>
        <Button asChild>
          <Link href="/guests/new">新增嘉宾</Link>
        </Button>
      </div>
      <GuestList
        items={result.items}
        page={result.page}
        pageSize={result.pageSize}
        total={result.total}
      />
    </div>
  );
}
```

**Step 3: Create GuestList client component**

Create `D:/work/cmms/app/(staff)/guests/GuestList.tsx`:

```tsx
'use client';

import Link from 'next/link';
import type { Guest } from '@prisma/client';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

interface Props {
  items: Guest[];
  page: number;
  pageSize: number;
  total: number;
}

const LEVEL_COLORS: Record<string, string> = {
  VIP_A: 'bg-red-100 text-red-800',
  VIP_B: 'bg-orange-100 text-orange-800',
  A: 'bg-blue-100 text-blue-800',
  B: 'bg-slate-100 text-slate-800',
  C: 'bg-gray-100 text-gray-600',
};

export function GuestList({ items, page, pageSize, total }: Props) {
  return (
    <div className="space-y-4">
      <div className="rounded-md border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>姓名</TableHead>
              <TableHead>性别</TableHead>
              <TableHead>单位</TableHead>
              <TableHead>职务</TableHead>
              <TableHead>等级</TableHead>
              <TableHead>标签</TableHead>
              <TableHead>更新时间</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-slate-500 py-8">
                  暂无数据
                </TableCell>
              </TableRow>
            ) : (
              items.map((g) => (
                <TableRow key={g.id}>
                  <TableCell>
                    <Link href={`/guests/${g.id}`} className="font-medium text-blue-600 hover:underline">
                      {g.name}
                    </Link>
                  </TableCell>
                  <TableCell>{g.gender ?? '-'}</TableCell>
                  <TableCell>{g.company ?? '-'}</TableCell>
                  <TableCell>{g.title ?? '-'}</TableCell>
                  <TableCell>
                    <Badge className={LEVEL_COLORS[g.level]} variant="secondary">
                      {g.level}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {(g.dietaryTags ?? []).map((t) => (
                      <Badge key={t} variant="outline" className="mr-1">
                        {t}
                      </Badge>
                    ))}
                  </TableCell>
                  <TableCell className="text-sm text-slate-500">
                    {new Date(g.updatedAt).toLocaleDateString('zh-CN')}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {total > pageSize && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-500">
            第 {page} 页, 共 {Math.ceil(total / pageSize)} 页
          </p>
          <div className="space-x-2">
            {page > 1 && (
              <Link
                href={`/guests?page=${page - 1}`}
                className="px-3 py-1 border rounded text-sm"
              >
                上一页
              </Link>
            )}
            {page * pageSize < total && (
              <Link
                href={`/guests?page=${page + 1}`}
                className="px-3 py-1 border rounded text-sm"
              >
                下一页
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
```

**Step 4: Test manually**

Run:
```bash
pnpm dev
```

Visit `http://localhost:3000/guests` → should show empty list.

**Step 5: Commit**

```bash
git add -A
git commit -m "feat(guest): add guest list page with server-rendered table"
```

---

### Task 1.8: Staff UI — Guest detail page

**Files:**
- Create: `D:/work/cmms/app/(staff)/guests/[id]/page.tsx`

**Step 1: Create detail page**

Create `D:/work/cmms/app/(staff)/guests/[id]/page.tsx`:

```tsx
import { guestService } from '@/lib/domain/guest/service';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function GuestDetailPage({ params }: PageProps) {
  const { id } = await params;
  let guest;
  try {
    guest = await guestService.findById(id);
  } catch {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">{guest.name}</h1>
          <p className="text-sm text-slate-500 mt-1">
            {guest.company} · {guest.title}
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link href={`/guests/${guest.id}/edit`}>编辑</Link>
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-4 bg-white rounded-md border p-6">
        <Field label="等级">
          <Badge variant="secondary">{guest.level}</Badge>
        </Field>
        <Field label="性别">{guest.gender ?? '-'}</Field>
        <Field label="手机">{guest.phone ?? '-'}</Field>
        <Field label="邮箱">{guest.email ?? '-'}</Field>
        <Field label="身份证">{guest.idNumber ?? '-'}</Field>
        <Field label="饮食标签">
          {(guest.dietaryTags ?? []).join(', ') || '-'}
        </Field>
        <Field label="创建时间">
          {new Date(guest.createdAt).toLocaleString('zh-CN')}
        </Field>
        <Field label="备注" full>
          {guest.notes ?? '-'}
        </Field>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
  full,
}: {
  label: string;
  children: React.ReactNode;
  full?: boolean;
}) {
  return (
    <div className={full ? 'col-span-2' : ''}>
      <p className="text-xs text-slate-500 mb-1">{label}</p>
      <div className="text-sm">{children}</div>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add -A
git commit -m "feat(guest): add guest detail page"
```

---

### Task 1.9: Staff UI — Guest create/edit form

**Files:**
- Create: `D:/work/cmms/app/(staff)/guests/new/page.tsx`
- Create: `D:/work/cmms/app/(staff)/guests/[id]/edit/page.tsx`
- Create: `D:/work/cmms/components/guests/GuestForm.tsx`
- Create: `D:/work/cmms/components/guests/GuestFormDialog.tsx`

**Step 1: Create reusable form component**

Create `D:/work/cmms/components/guests/GuestForm.tsx`:

```tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { guestCreateSchema, type GuestCreateInput } from '@/lib/shared/guest';
import { createGuest, updateGuest } from '@/app/actions/guest.actions';

interface Props {
  mode: 'create' | 'edit';
  guestId?: string;
  defaultValues?: Partial<GuestCreateInput>;
}

export function GuestForm({ mode, guestId, defaultValues }: Props) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<GuestCreateInput>({
    resolver: zodResolver(guestCreateSchema),
    defaultValues: {
      level: 'C',
      dietaryTags: [],
      ...defaultValues,
    },
  });

  const level = watch('level');

  async function onSubmit(data: GuestCreateInput) {
    setServerError(null);
    setSubmitting(true);
    try {
      const result =
        mode === 'create'
          ? await createGuest(data as Record<string, unknown>)
          : await updateGuest(guestId!, data as Record<string, unknown>);

      if (!result.ok) {
        setServerError(result.error?.message ?? 'Failed');
      } else {
        router.push(`/guests/${result.data!.id}`);
        router.refresh();
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-w-2xl">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name">姓名 *</Label>
          <Input id="name" {...register('name')} />
          {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
        </div>
        <div>
          <Label htmlFor="gender">性别</Label>
          <Select
            value={watch('gender') ?? ''}
            onValueChange={(v) => setValue('gender', v as 'MALE' | 'FEMALE' | 'OTHER')}
          >
            <SelectTrigger>
              <SelectValue placeholder="请选择" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="MALE">男</SelectItem>
              <SelectItem value="FEMALE">女</SelectItem>
              <SelectItem value="OTHER">其他</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="phone">手机</Label>
          <Input id="phone" {...register('phone')} />
          {errors.phone && <p className="text-xs text-red-500">{errors.phone.message}</p>}
        </div>
        <div>
          <Label htmlFor="email">邮箱</Label>
          <Input id="email" type="email" {...register('email')} />
          {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
        </div>
        <div>
          <Label htmlFor="company">单位</Label>
          <Input id="company" {...register('company')} />
        </div>
        <div>
          <Label htmlFor="title">职务</Label>
          <Input id="title" {...register('title')} />
        </div>
        <div>
          <Label htmlFor="level">等级</Label>
          <Select
            value={level}
            onValueChange={(v) => setValue('level', v as GuestCreateInput['level'])}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="VIP_A">VIP-A</SelectItem>
              <SelectItem value="VIP_B">VIP-B</SelectItem>
              <SelectItem value="A">A</SelectItem>
              <SelectItem value="B">B</SelectItem>
              <SelectItem value="C">C</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="idNumber">身份证号</Label>
          <Input id="idNumber" {...register('idNumber')} />
          {errors.idNumber && <p className="text-xs text-red-500">{errors.idNumber.message}</p>}
        </div>
      </div>

      <div>
        <Label htmlFor="notes">备注</Label>
        <Textarea id="notes" {...register('notes')} rows={3} />
      </div>

      {serverError && <p className="text-sm text-red-500">{serverError}</p>}

      <div className="flex gap-2">
        <Button type="submit" disabled={submitting}>
          {submitting ? '保存中...' : mode === 'create' ? '创建' : '保存'}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          取消
        </Button>
      </div>
    </form>
  );
}
```

Add `Textarea` via shadcn:
```bash
pnpm dlx shadcn-ui@latest add textarea
```

**Step 2: Create new page**

Create `D:/work/cmms/app/(staff)/guests/new/page.tsx`:

```tsx
import { GuestForm } from '@/components/guests/GuestForm';

export default function NewGuestPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">新增嘉宾</h1>
      <GuestForm mode="create" />
    </div>
  );
}
```

**Step 3: Create edit page**

Create `D:/work/cmms/app/(staff)/guests/[id]/edit/page.tsx`:

```tsx
import { guestService } from '@/lib/domain/guest/service';
import { GuestForm } from '@/components/guests/GuestForm';
import { notFound } from 'next/navigation';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditGuestPage({ params }: PageProps) {
  const { id } = await params;
  let guest;
  try {
    guest = await guestService.findById(id);
  } catch {
    notFound();
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">编辑嘉宾</h1>
      <GuestForm mode="edit" guestId={guest.id} defaultValues={{
        name: guest.name,
        gender: guest.gender ?? undefined,
        phone: guest.phone ?? undefined,
        email: guest.email ?? undefined,
        company: guest.company ?? undefined,
        title: guest.title ?? undefined,
        level: guest.level,
        idNumber: guest.idNumber ?? undefined,
        notes: guest.notes ?? undefined,
      }} />
    </div>
  );
}
```

**Step 4: Manual smoke test**

```bash
pnpm dev
```

- Visit `/guests/new` → fill form → submit → should redirect to detail page.
- Try invalid phone → should show validation error.

**Step 5: Commit**

```bash
git add -A
git commit -m "feat(guest): add create/edit forms with Zod validation"
```

---

### Task 1.10: Guest soft-delete UI

**Files:**
- Modify: `D:/work/cmms/app/(staff)/guests/[id]/page.tsx`
- Create: `D:/work/cmms/components/guests/DeleteGuestButton.tsx`

**Step 1: Create delete button component**

Create `D:/work/cmms/components/guests/DeleteGuestButton.tsx`:

```tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { deleteGuest } from '@/app/actions/guest.actions';

export function DeleteGuestButton({ guestId, guestName }: { guestId: string; guestName: string }) {
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const router = useRouter();

  async function onConfirm() {
    setDeleting(true);
    const result = await deleteGuest(guestId);
    setDeleting(false);
    if (result.ok) {
      router.push('/guests');
      router.refresh();
    } else {
      alert(result.error?.message ?? 'Delete failed');
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="destructive">删除</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>确认删除嘉宾</DialogTitle>
          <DialogDescription>
            将删除嘉宾「{guestName}」。此操作为软删除,可在数据库层面恢复。
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            取消
          </Button>
          <Button variant="destructive" onClick={onConfirm} disabled={deleting}>
            {deleting ? '删除中...' : '确认删除'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

**Step 2: Modify detail page to include delete button**

Modify `D:/work/cmms/app/(staff)/guests/[id]/page.tsx` — add import and button in the header actions:

```tsx
import { DeleteGuestButton } from '@/components/guests/DeleteGuestButton';

// ... inside the actions area, add:
<DeleteGuestButton guestId={guest.id} guestName={guest.name} />
```

**Step 3: Commit**

```bash
git add -A
git commit -m "feat(guest): add soft-delete button with confirmation dialog"
```

---

### Task 1.11: Excel import (BullMQ async)

**Files:**
- Create: `D:/work/cmms/lib/queue/index.ts`
- Create: `D:/work/cmms/lib/queue/guest-import.queue.ts`
- Create: `D:/work/cmms/lib/domain/guest/importer.ts`
- Modify: `D:/work/cmms/worker/index.ts`
- Create: `D:/work/cmms/app/(staff)/guests/import/page.tsx`
- Create: `D:/work/cmms/app/(staff)/guests/import/ImportForm.tsx`
- Create: `D:/work/cmms/app/actions/import.actions.ts`

**Step 1: Create queue infrastructure**

Create `D:/work/cmms/lib/queue/index.ts`:

```typescript
import { Queue, Worker } from 'bullmq';
import IORedis from 'ioredis';
import { logger } from '@/lib/utils/logger';

export const connection = new IORedis(process.env.REDIS_URL ?? 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
});

export function defineQueue<T>(name: string) {
  const queue = new Queue<T>(name, { connection });
  return queue;
}

export function registerWorker<T>(
  name: string,
  handler: (job: { id: string; data: T }) => Promise<void>,
) {
  const worker = new Worker<T>(name, async (job) => handler(job), { connection });
  worker.on('failed', (job, err) => {
    logger.error({ jobId: job?.id, err: err.message }, 'job failed');
  });
  return worker;
}
```

**Step 2: Define guest import queue**

Create `D:/work/cmms/lib/queue/guest-import.queue.ts`:

```typescript
import { defineQueue, registerWorker } from './index';
import { processGuestImport } from '@/lib/domain/guest/importer';
import { logger } from '@/lib/utils/logger';

export interface GuestImportJobData {
  filePath: string;
  userId: string;
  jobId: string;
}

export const guestImportQueue = defineQueue<GuestImportJobData>('guest-import');

export function registerGuestImportWorker() {
  return registerWorker<GuestImportJobData>('guest-import', async (job) => {
    logger.info({ jobId: job.id, data: job.data }, 'processing guest import');
    await processGuestImport(job.data);
  });
}
```

**Step 3: Implement importer**

Create `D:/work/cmms/lib/domain/guest/importer.ts`:

```typescript
import ExcelJS from 'exceljs';
import { guestRepository } from './repository';
import { logger } from '@/lib/utils/logger';
import type { GuestCreateData } from './types';
import type { GuestLevel } from '@prisma/client';

const COLUMN_MAP = {
  姓名: 'name',
  性别: 'gender',
  手机: 'phone',
  邮箱: 'email',
  单位: 'company',
  职务: 'title',
  等级: 'level',
  身份证号: 'idNumber',
  饮食标签: 'dietaryTags',
  备注: 'notes',
} as const;

const LEVEL_MAP: Record<string, GuestLevel> = {
  'VIP-A': 'VIP_A',
  'VIP-B': 'VIP_B',
  A: 'A',
  B: 'B',
  C: 'C',
};

export interface ImportResult {
  total: number;
  created: number;
  skipped: number;
  errors: { row: number; reason: string }[];
}

export async function processGuestImport(data: {
  filePath: string;
  userId: string;
}): Promise<ImportResult> {
  const result: ImportResult = { total: 0, created: 0, skipped: 0, errors: [] };
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(data.filePath);

  const sheet = workbook.worksheets[0];
  if (!sheet) throw new Error('Excel file has no sheets');

  // Build column index map from header row
  const headerMap: Record<number, string> = {};
  sheet.getRow(1).eachCell((cell, col) => {
    const header = String(cell.value ?? '').trim();
    if (header in COLUMN_MAP) {
      headerMap[col] = COLUMN_MAP[header as keyof typeof COLUMN_MAP];
    }
  });

  for (let r = 2; r <= sheet.rowCount; r++) {
    result.total++;
    const row = sheet.getRow(r);
    const record: Record<string, unknown> = {};
    for (const [col, field] of Object.entries(headerMap)) {
      record[field] = row.getCell(Number(col)).value;
    }

    try {
      const name = String(record.name ?? '').trim();
      if (!name) {
        result.errors.push({ row: r, reason: 'name is required' });
        continue;
      }

      const phone = record.phone ? String(record.phone).trim() : undefined;

      // De-duplicate by phone
      if (phone) {
        const existing = await guestRepository.findByPhone(phone);
        if (existing) {
          result.skipped++;
          continue;
        }
      }

      const levelRaw = String(record.level ?? 'C').trim();
      const level = LEVEL_MAP[levelRaw] ?? 'C';

      const guestData: GuestCreateData = {
        name,
        gender: record.gender ? (String(record.gender).trim() as 'MALE' | 'FEMALE') : undefined,
        phone,
        email: record.email ? String(record.email).trim() : undefined,
        company: record.company ? String(record.company).trim() : undefined,
        title: record.title ? String(record.title).trim() : undefined,
        level,
        idNumber: record.idNumber ? String(record.idNumber).trim() : undefined,
        dietaryTags: record.dietaryTags
          ? String(record.dietaryTags).split(/[,，]/).map((s) => s.trim()).filter(Boolean)
          : [],
        notes: record.notes ? String(record.notes).trim() : undefined,
      };

      await guestRepository.create(guestData);
      result.created++;
    } catch (e) {
      result.errors.push({
        row: r,
        reason: e instanceof Error ? e.message : 'unknown error',
      });
    }
  }

  logger.info({ result, userId: data.userId }, 'guest import completed');
  return result;
}
```

**Step 4: Register worker in worker entry**

Modify `D:/work/cmms/worker/index.ts`:

```typescript
import { registerGuestImportWorker } from '@/lib/queue/guest-import.queue';
import { logger } from '@/lib/utils/logger';

async function main() {
  logger.info('CMMS worker starting');

  const workers = [registerGuestImportWorker()];

  logger.info({ workers: workers.length }, 'workers registered');

  // Graceful shutdown
  const shutdown = async () => {
    logger.info('shutting down workers...');
    await Promise.all(workers.map((w) => w.close()));
    process.exit(0);
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

main().catch((err) => {
  logger.error({ err: err.message }, 'worker fatal');
  process.exit(1);
});
```

**Step 5: Implement import Server Action**

Create `D:/work/cmms/app/actions/import.actions.ts`:

```typescript
'use server';

import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { getContext, handleError, type ActionResult } from '@/lib/actions/utils';
import { guestImportQueue } from '@/lib/queue/guest-import.queue';
import { randomUUID } from 'crypto';

export async function uploadGuestImport(
  formData: FormData,
): Promise<ActionResult<{ jobId: string }>> {
  try {
    const { session } = await getContext();
    const file = formData.get('file') as File | null;
    if (!file) {
      return { ok: false, error: { code: 'NO_FILE', message: '请选择文件' } };
    }
    if (!file.name.endsWith('.xlsx')) {
      return { ok: false, error: { code: 'BAD_TYPE', message: '仅支持 .xlsx 文件' } };
    }

    const uploadDir = path.join(process.cwd(), 'tmp', 'uploads');
    await mkdir(uploadDir, { recursive: true });
    const jobId = randomUUID();
    const filePath = path.join(uploadDir, `${jobId}.xlsx`);
    const buf = Buffer.from(await file.arrayBuffer());
    await writeFile(filePath, buf);

    await guestImportQueue.add('import', {
      filePath,
      userId: session.user.id,
      jobId,
    });

    return { ok: true, data: { jobId } };
  } catch (e) {
    return handleError(e);
  }
}
```

**Step 6: Create import UI**

Create `D:/work/cmms/app/(staff)/guests/import/page.tsx`:

```tsx
import { ImportForm } from './ImportForm';
import Link from 'next/link';

export default function ImportPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">批量导入嘉宾</h1>
      <p className="text-sm text-slate-500">
        请使用模板上传,字段:姓名、性别、手机、邮箱、单位、职务、等级、身份证号、饮食标签、备注。
      </p>
      <p>
        <Link href="/api/guests/template.xlsx" className="text-blue-600 underline">
          下载模板
        </Link>
      </p>
      <ImportForm />
    </div>
  );
}
```

Create `D:/work/cmms/app/(staff)/guests/import/ImportForm.tsx`:

```tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { uploadGuestImport } from '@/app/actions/import.actions';

export function ImportForm() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const router = useRouter();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;
    setLoading(true);
    setMessage(null);
    const fd = new FormData();
    fd.set('file', file);
    const result = await uploadGuestImport(fd);
    setLoading(false);
    if (result.ok) {
      setMessage(`导入任务已提交 (Job ID: ${result.data!.jobId.slice(0, 8)})。后台处理完成后将自动更新嘉宾列表。`);
      setTimeout(() => router.push('/guests'), 3000);
    } else {
      setMessage(result.error?.message ?? 'Failed');
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 max-w-md">
      <div>
        <Label htmlFor="file">Excel 文件 (.xlsx)</Label>
        <Input
          id="file"
          type="file"
          accept=".xlsx"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          required
        />
      </div>
      <Button type="submit" disabled={!file || loading}>
        {loading ? '上传中...' : '上传并导入'}
      </Button>
      {message && <p className="text-sm">{message}</p>}
    </form>
  );
}
```

**Step 7: Test import manually**

Run worker in one terminal:
```bash
pnpm worker:start
```

Run app in another:
```bash
pnpm dev
```

Create a test `guests.xlsx` with header row: 姓名, 手机, 单位, 等级
And 2 data rows. Upload via `/guests/import`.

Expected:
- Worker logs "processing guest import" then "guest import completed"
- `/guests` shows the new guests

**Step 8: Commit**

```bash
git add -A
git commit -m "feat(guest): add Excel batch import with BullMQ async processing"
```

---

### Task 1.12: Excel template download endpoint

**Files:**
- Create: `D:/work/cmms/app/api/guests/template.xlsx/route.ts`

**Step 1: Create template route**

Create `D:/work/cmms/app/api/guests/template.xlsx/route.ts`:

```typescript
import ExcelJS from 'exceljs';
import { NextResponse } from 'next/server';

export async function GET() {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('嘉宾导入模板');

  sheet.columns = [
    { header: '姓名', key: 'name', width: 15 },
    { header: '性别', key: 'gender', width: 8 },
    { header: '手机', key: 'phone', width: 15 },
    { header: '邮箱', key: 'email', width: 25 },
    { header: '单位', key: 'company', width: 30 },
    { header: '职务', key: 'title', width: 15 },
    { header: '等级', key: 'level', width: 10 },
    { header: '身份证号', key: 'idNumber', width: 22 },
    { header: '饮食标签', key: 'dietaryTags', width: 20 },
    { header: '备注', key: 'notes', width: 30 },
  ];

  // Example row
  sheet.addRow({
    name: '张三',
    gender: '男',
    phone: '13812345678',
    email: 'zhangsan@example.com',
    company: '示例公司',
    title: '总经理',
    level: 'VIP-A',
    idNumber: '110101199001011234',
    dietaryTags: '清真,无辣',
    notes: '示例数据',
  });

  // Highlight header row
  sheet.getRow(1).font = { bold: true };
  sheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE0E7FF' },
  };

  const buf = await workbook.xlsx.writeBuffer();

  return new NextResponse(Buffer.from(buf), {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="guest-import-template.xlsx"',
    },
  });
}
```

**Step 2: Test the endpoint**

```bash
curl -o /tmp/template.xlsx http://localhost:3000/api/guests/template.xlsx
ls -la /tmp/template.xlsx
```

Expected: File downloads successfully.

**Step 3: Commit**

```bash
git add -A
git commit -m "feat(guest): add Excel template download endpoint"
```

---

### Task 1.13: E2E tests for Guest CRUD

**Files:**
- Create: `D:/work/cmms/tests/e2e/guests.spec.ts`

**Step 1: Write E2E test**

Create `D:/work/cmms/tests/e2e/guests.spec.ts`:

```typescript
import { test, expect } from '@playwright/test';

test.describe('Guest management', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin
    await page.goto('/login');
    await page.getByLabel('邮箱').fill('admin@cmms.local');
    await page.getByLabel('密码').fill('admin123');
    await page.getByRole('button', { name: '登录' }).click();
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test('create a new guest via form', async ({ page }) => {
    const phone = `139${Date.now().toString().slice(-8)}`;
    await page.goto('/guests/new');
    await page.getByLabel('姓名 *').fill(`测试嘉宾_${Date.now()}`);
    await page.getByLabel('手机').fill(phone);
    await page.getByLabel('单位').fill('E2E测试公司');
    await page.getByRole('button', { name: '创建' }).click();
    await expect(page).toHaveURL(/\/guests\/g/);
  });

  test('rejects duplicate phone', async ({ page }) => {
    const phone = `138${Date.now().toString().slice(-8)}`;
    // First create
    await page.goto('/guests/new');
    await page.getByLabel('姓名 *').fill('A');
    await page.getByLabel('手机').fill(phone);
    await page.getByRole('button', { name: '创建' }).click();
    await expect(page).toHaveURL(/\/guests\/g/);

    // Try duplicate
    await page.goto('/guests/new');
    await page.getByLabel('姓名 *').fill('B');
    await page.getByLabel('手机').fill(phone);
    await page.getByRole('button', { name: '创建' }).click();
    await expect(page.getByText(/already exists/)).toBeVisible();
  });

  test('shows guest list', async ({ page }) => {
    await page.goto('/guests');
    await expect(page.getByText('嘉宾库')).toBeVisible();
    await expect(page.getByRole('table')).toBeVisible();
  });

  test('validates required name field', async ({ page }) => {
    await page.goto('/guests/new');
    await page.getByRole('button', { name: '创建' }).click();
    await expect(page.getByText('姓名必填')).toBeVisible();
  });
});
```

**Step 2: Run E2E tests**

Make sure dev server + worker are running, then:
```bash
pnpm test:e2e guests.spec.ts
```

Expected: All 4 tests pass.

**Step 3: Commit**

```bash
git add -A
git commit -m "test(guest): add E2E tests for guest CRUD and validation"
```

---

### Task 1.14: Phase 1 final commit and tag

**Step 1: Run full check suite**

```bash
pnpm lint && pnpm typecheck && pnpm format:check && pnpm test && pnpm build
```

Expected: all green.

**Step 2: Run full E2E suite**

```bash
pnpm test:e2e
```

Expected: All E2E tests pass.

**Step 3: Tag the milestone**

```bash
git tag -a v0.2.0-guest-module -m "Phase 1 complete: Guest module end-to-end with Excel import"
git log --oneline
```

Expected: ~27 commits since project start.

---

## Post-Plan Notes

### What's delivered
- Bootable Next.js 14 fullstack app with auth
- PostgreSQL + Redis via Docker
- Vitest + Playwright + GitHub Actions CI
- Guest module as reference: Prisma → service → Server Actions → UI → Excel import
- Field-level encryption for sensitive data
- CASL permission framework (SUPER_ADMIN / VIEWER roles)

### Reference pattern for next 7 modules
The Guest module establishes the canonical pattern. For Meeting / Agenda / Transport / Lodging / Catering / Gift / Reception, repeat:
1. Add Prisma model + migration (`prisma/schema.prisma`)
2. Shared Zod schema (`lib/shared/<module>.ts`)
3. Repository (`lib/domain/<module>/repository.ts`)
4. Service (`lib/domain/<module>/service.ts`)
5. Server Actions (`app/actions/<module>.actions.ts`)
6. UI list + detail + form (`app/(staff)/<module>/`)
7. Tests (unit + E2E)

### Next plan (to be written after Phase 1 is verified)
- Phase 2: Meeting + Agenda + Reception (sign-in) + Transport + Driver portal
- Phase 3: Lodging + Catering + Gift + Fee + Guest 360° view
- Phase 4: Reports + Notifications + Audit + Production hardening

---

## Reference Skills

- @superpowers:test-driven-development
- @superpowers:executing-plans
- @superpowers:verification-before-completion
- @superpowers:requesting-code-review
