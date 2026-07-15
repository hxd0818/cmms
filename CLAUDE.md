# CLAUDE.md

This file provides project-specific guidance to Claude Code when working in this repository.

## Communication

- **中文沟通**：所有回复、解释、讨论使用中文
- **称呼**：称呼用户为"爸爸"
- **代码注释**：英文（国际标准）
- **用户面消息**：中文

## Project Snapshot

CMMS（会务管理系统）是单组织内部使用的、以接待运营为核心的通用会务管理平台。Next.js 16 全栈单体，非 monorepo。

**当前进度**：Phase 0+1 完成（v0.2.0-guest-module），Phase 2 计划已就绪待实施。

## Critical Project Rules

### 1. 端口与资源（必须遵守）

本机已有多个项目占用端口，CMMS 使用**独立端口**和**完全隔离的 Docker 资源**：

| 服务          | 端口     | 备注                                 |
| ------------- | -------- | ------------------------------------ |
| Web (Next.js) | **3010** | dev script 已配置 `next dev -p 3010` |
| PostgreSQL    | **5434** | docker-compose 映射 `5434:5432`      |
| Redis         | **6381** | docker-compose 映射 `6381:6379`      |

Docker Compose 配置要点（`docker/docker-compose.yml`）：

- 顶级 `name: cmms`（独立 project name，不与默认 `docker` 目录名冲突）
- 自定义 network `cmms-network`
- **bind mount** 到 `docker/data/{postgres,redis}/`（数据完全归本项目，不用 docker-managed volume）

### 2. 命令清单

```bash
# 开发
pnpm dev                  # Next.js dev server (port 3010)
pnpm worker:start         # BullMQ worker 独立进程（处理 Excel 导入等）
docker compose -f docker/docker-compose.yml up -d    # 启动 PostgreSQL + Redis
docker compose -f docker/docker-compose.yml down      # 停止容器

# 数据库
pnpm db:migrate           # prisma migrate dev（开发时生成迁移）
pnpm db:generate          # 重新生成 Prisma client
pnpm db:seed              # 运行种子脚本（admin@cmms.local 等）
pnpm exec prisma studio   # 可视化数据库

# 质量门
pnpm lint                 # ESLint
pnpm typecheck            # tsc --noEmit
pnpm format               # Prettier auto-fix
pnpm format:check         # Prettier check（CI 用）
pnpm test                 # Vitest 单元测试
pnpm test:e2e             # Playwright E2E

# CI 验证（推送前必须全绿）
pnpm lint && pnpm typecheck && pnpm format:check && pnpm test && pnpm build
```

### 3. 严禁事项（CRITICAL）

- **严禁使用 WebSocket**（项目规则，用 TanStack Query 轮询替代）
- **严禁 emoji**（代码、注释、UI 文本、日志、变量名都不允许，用 "success" 而非 "checkmark"）
- **严禁 UI 渐变**（用纯色，不用 linear-gradient）
- **严禁 fetch/axios 直调 API**（前端必须通过 Server Actions）
- **严禁修改与当前任务无关的文件**
- **严禁 TODO 或注释掉的代码块**留在最终代码
- **严禁在 schema.prisma 中写 `url`**（Prisma 7 已废弃，URL 在 `prisma.config.ts`）
- **严禁用 `@prisma/client` 导入模型/枚举**（Prisma 7 改了路径，模型用 `@/lib/generated/prisma/client`，枚举用 `@/lib/generated/prisma/enums`）
- **严禁在 Edge runtime 中使用 Prisma**（proxy.ts / middleware 不允许，需要 dual NextAuth config 模式）
- **严禁 middleware.ts**（Next.js 16 已改名为 `proxy.ts`）
- **严禁 shadcn Button 的 `asChild` prop**（shadcn 4.12 用 @base-ui/react，不支持；用 `<Link className={buttonVariants()}>` 替代）

### 4. 必须遵守

- **TDD**：先写测试 → 验证失败 → 实现 → 验证通过 → commit
- **小步提交**：每个任务一个 commit，commit message 用 conventional commits 格式
- **CHANGELOG.md**：完成阶段（Phase）后必须更新
- **设计文档优先**：复杂功能（>3 个文件）必须先在 `docs/plans/` 写设计，待爸爸确认后实施
- **质疑需求**：发现需求矛盾或更优实现，必须提出来讨论，不盲从

### 5. 已记录的纠正

- **2026-07-15 Docker 资源隔离**：爸爸指出 docker 容器和数据目录必须完全独立。已修复为显式 `name: cmms` + 自定义 network + bind mount 到项目内目录。
- **2026-07-15 版本升级**：爸爸要求用最新稳定版（Next.js 16.2.10 / Tailwind v4 / Prisma 7.8 / Zod 4）。计划中的 14+v3 已废弃，所有任务按实际版本执行。
- **2026-07-15 pnpm 安装方式**：Windows corepack 因权限失败，改用 `npm install -g pnpm`，效果一致。
- **2026-07-15 端口冲突**：3000（cdep）/ 3001（ccidscan dev）/ 5432-5433 / 6379 都被占用，CMMS 改用 3010 / 5434 / 6381。
- **2026-07-15 文档归位**：爸爸指出工程文档应统一放 `docs/` 目录，不应堆在根目录。已移动 ARCHITECTURE/DEVELOPMENT/DEPLOYMENT/SECURITY/TESTING/CONTRIBUTING 到 `docs/`。保留根目录的仅 4 份：`README.md`（GitHub 门面）、`LICENSE`（法律惯例）、`CLAUDE.md`（Claude Code 必需）、`CHANGELOG.md`（GitHub Release 兼容）。**新增文档默认放 docs/，不要堆根目录**。

## Architecture Quick Reference

### 领域分层（lib/domain/<module>/）

每个领域模块严格三层：

- `types.ts` — TypeScript 类型定义
- `repository.ts` — Prisma 数据访问（CRUD + 软删除 + 搜索）
- `service.ts` — 业务规则（错误处理 + 状态机 + 冲突检测）

业务入口：

- 工作人员端 → `app/actions/<module>.actions.ts`（Server Actions，含 auth + validation）
- 嘉宾/陪同/司机端 → 独立 Server Actions（`app/guest/[token]/actions.ts` 等）

参考实现：`lib/domain/guest/`（Phase 1 完整实现，作为后续 7 个模块的范式）

### 权限模型（CASL）

- `lib/auth/abilities.ts` 定义 AppAbility
- SUPER_ADMIN：可管理一切
- VIEWER：只读 Guest/Meeting/MeetingGuest/AgendaItem
- 会议级角色（OWNER/RECEPTION_LEAD/...）：Phase 2+ 在 MeetingStaff 表中关联

### 认证架构（Dual NextAuth Config）

由于 Edge runtime 不支持 Prisma，NextAuth 配置拆为两份：

- `lib/auth/config.ts` — Edge-safe（providers 空数组，仅 JWT/session callbacks），用于 `proxy.ts`
- `lib/auth/index.ts` — 完整 Node 配置（含 Credentials + Prisma），用于 `/api/auth/[...nextauth]/route.ts` 和 server-side `auth()` 调用

### 字段加密

- AES-256-GCM，密钥来自 `FIELD_ENCRYPTION_KEY`（32 字节 hex）
- 通过 Prisma `$extends` 拦截器透明加密/解密
- 当前加密：`Guest.phone`, `Guest.idNumber`
- 新增字段加密：在 `lib/db/prisma-extensions.ts` 的 `ENCRYPTED_FIELDS` 添加

### 嘉宾/陪同/司机端 Token

- **有状态**（DB-backed），不是 JWT
- HMAC-SHA256 哈希存储（`tokenHash`，原值不入库）
- 可吊销（revokedAt 字段）
- 自动过期（expiresAt）
- 审计（lastAccessedAt, accessCount）

## Key Files

| 路径                                                    | 内容                                                |
| ------------------------------------------------------- | --------------------------------------------------- |
| `docs/plans/2026-07-15-cmms-design.md`                  | 完整设计（800+ 行）                                 |
| `docs/plans/2026-07-15-cmms-foundation.md`              | Phase 0+1 实施计划（3900+ 行）                      |
| `docs/plans/2026-07-15-cmms-phase2.md`                  | Phase 2 实施计划                                    |
| `docs/plans/2026-07-15-cmms-phase3.md`                  | Phase 3 实施计划                                    |
| `docs/plans/2026-07-15-cmms-phase4.md`                  | Phase 4 实施计划                                    |
| `prisma/schema.prisma`                                  | 数据模型                                            |
| `proxy.ts`                                              | Next.js 16 Edge middleware（路由保护）              |
| `lib/auth/{config,index}.ts`                            | Dual NextAuth config                                |
| `lib/db/{client,prisma-extensions,field-encryption}.ts` | Prisma + 加密                                       |
| `lib/domain/guest/`                                     | 参考实现（Repository + Service + Importer）         |
| `lib/actions/utils.ts`                                  | Server Action 通用工具（auth + validation + error） |
| `docker/docker-compose.yml`                             | 独立的 PostgreSQL + Redis                           |

## Git Workflow

- 分支：`main` 是主开发分支（个人项目，不强制 PR 流程）
- Commit：conventional commits（feat/fix/chore/docs/test/refactor/perf/ci）
- Tag：完成阶段打 tag（`v0.1.0-foundation`, `v0.2.0-guest-module`, `v0.3.0-phase2`, ...）
- 推送前自检：`pnpm lint && pnpm typecheck && pnpm format:check && pnpm test && pnpm build`

## 当前未实现（Phase 2+ 待做）

- Meeting / MeetingGuest / Agenda / Reception / Transport / Driver portal（Phase 2）
- Lodging / Catering / Gift / Fee / Guest 360 视图（Phase 3）
- 报表 / 通知中心 / 审计日志 / 生产硬化（Phase 4）

实施新模块前，**必须先读** `docs/plans/2026-07-15-cmms-phase2.md`（或对应阶段的 plan）。
