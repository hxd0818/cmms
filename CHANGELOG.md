# Changelog

本项目所有显著变更都会记录在此文件中。格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/)，版本号遵循 [Semantic Versioning](https://semver.org/lang/zh-CN/)。

详细的每日技术实现记录见 `docs/changelog/` 目录。

---

## [Unreleased]

### 计划中
- **Phase 2 - 现场运营**：Meeting + MeetingGuest + Agenda + Reception + Transport + Driver portal（[plan](./docs/plans/2026-07-15-cmms-phase2.md)）
- **Phase 3 - 深度接待**：Lodging + Catering + Gift + Fee + Guest 360° 视图
- **Phase 4 - 运营优化**：报表 + 通知中心 + 审计日志 + 生产硬化

---

## [0.2.0] - 2026-07-15 — Phase 1：Guest 模块端到端

### Added
- **Guest Prisma 模型**：含 Gender / GuestLevel 枚举，软删除（deletedAt）
- **AES-256-GCM 字段加密**：手机号、身份证号透明加密（`lib/db/field-encryption.ts` + Prisma `$extends`）
- **共享 Zod schema**：`lib/shared/guest.ts`（含中文手机号正则、身份证号校验）
- **共享错误类层级**：`lib/shared/errors.ts`（AppError / ValidationError / NotFoundError / ConflictError / ...）
- **Guest 领域分层**：`lib/domain/guest/{types,repository,service,importer}.ts`
  - Repository：CRUD + 软删除 + 跨字段搜索（姓名/手机/单位/职务）+ 分页
  - Service：手机号去重、NotFound/Conflict 错误处理
  - Importer：Excel 批量导入（姓名/性别/手机/邮箱/单位/职务/等级/身份证/饮食标签/备注）
- **CASL 权限框架**：`lib/auth/abilities.ts`（SUPER_ADMIN 全权 / VIEWER 只读）
- **Server Actions**：`app/actions/guest.actions.ts` + 通用工具 `lib/actions/utils.ts`（auth + Zod validation + error handling）
- **工作人员端 UI**：
  - 列表页（服务端渲染 + 分页）
  - 详情页（grid 字段布局）
  - 创建/编辑表单（React Hook Form + Zod + sonner toast）
  - 软删除按钮（Dialog 确认）
  - Staff Layout（侧边栏导航 + 用户信息）
- **Excel 模板下载**：`/api/guests/template.xlsx`
- **Excel 批量导入**：BullMQ 异步管线（`lib/queue/`）+ Worker 进程入口
- **测试覆盖**：20 单元测试 + 8 E2E 测试

### Changed
- 域模型枚举 import 路径：Prisma 7 改为 `@/lib/generated/prisma/{client,enums}`，不再用 `@prisma/client`

---

## [0.1.0] - 2026-07-15 — Phase 0：项目骨架

### Added
- **Next.js 16.2.10 全栈**：App Router + Turbopack + React 19.2.4
- **TypeScript 5.9 严格模式**：开启 `strict` / `noUncheckedIndexedAccess` / `noImplicitOverride`
- **Tailwind CSS v4**：CSS-first 配置（`@import "tailwindcss"`）
- **shadcn/ui 4.12**：16 个核心组件（button/card/input/label/table/dialog/dropdown-menu/form/select/badge/avatar/separator/tabs/sheet/skeleton/textarea/sonner）
- **Prisma 7.8**：driver adapter 模式（不在 schema 写 `url`，在 `prisma.config.ts`）
- **PostgreSQL 16 + Redis 7**：Docker Compose，独立 project name `cmms` + 自定义 network `cmms-network` + bind mount 到项目内目录
- **NextAuth v5 (beta.31)**：dual config 模式（Edge-safe + Node）
  - `lib/auth/config.ts`：Edge-safe，用于 `proxy.ts`
  - `lib/auth/index.ts`：完整 Node，含 Credentials + Prisma
- **proxy.ts**（Next.js 16 中间件改名）：路由保护，公开路径 `/login`、`/api/auth`、`/g`、`/d`
- **Vitest 4 + Playwright 1.61**：单元 + E2E 测试框架
- **GitHub Actions CI**：lint / typecheck / format / migrate / seed / test / build / E2E 全流程
- **种子数据**：`admin@cmms.local` (SUPER_ADMIN) + `viewer@cmms.local` (VIEWER)

### Decisions
- **Next.js 14 → 16**：原计划 14 已 EOL，升级到 2026-07-01 发布的 16.2.10（active 版本）
- **Tailwind v3 → v4**：CSS-first 配置，与 Next.js 16 原生兼容
- **Prisma 5 → 7**：最新大版本，driver adapter 模式
- **端口分配**：避开本机其他项目，Web 用 3010 / PostgreSQL 5434 / Redis 6381
- **Docker 资源完全隔离**：`name: cmms` + 自定义 network + bind mount，不与其他项目共享

---

## 版本号规则

- `v0.X.Y`：开发期版本（每个 Phase 一个 minor）
- `v1.0.0`：首个生产可用版本（Phase 4 完成后）
- `v1.X.Y`：生产版本（minor = 新功能，patch = bug 修复）
