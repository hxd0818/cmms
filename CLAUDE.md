# CLAUDE.md

This file provides project-specific guidance to Claude Code when working in this repository.

## Communication

- **中文沟通**：所有回复、解释、讨论使用中文
- **称呼**：称呼用户为"爸爸"
- **代码注释**：英文（国际标准）
- **用户面消息**：中文

## Project Snapshot

CMMS（会务管理系统）是单组织内部使用的、以接待运营为核心的通用会务管理平台。Next.js 16 全栈单体，非 monorepo。

**当前进度**：Phase 0-4 + 审计补全 + 分配看板 + 接待端验证门全部完成。含字典管理、嘉宾端门户、会议独立资源池、导航标签页、审计日志自动记录、费用自动生成、任务分配、MeetingStaff 角色、批量签到、报表导出、RSVP、室友分配、司机日程、字段脱敏、速率限制、通知系统、接送/住宿/餐饮/接待四类分配看板、接待人员名册 CRUD、接待端手机验证门 + 嘉宾切换卡片 + 分享嘉宾链接。

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
- **2026-07-17 资源独立**：爸爸指出车辆和酒店必须是每场会议独立的资源池，不能全局共享。Vehicle 和 Hotel 已加 `meetingId`，全局 `/vehicles` 和 `/hotels` 页面已删除，改为会议内标签页管理。
- **2026-07-17 字典系统**：所有枚举标签集中到 `lib/shared/dictionary.ts`（代码层）+ `DictionaryEntry` 数据库表（后台可配置）。客户端组件通过 `DictProvider` + `useDbDict()` hook 获取 DB 标签。
- **2026-07-17 SelectValue 问题**：base-ui 的 `<SelectValue />` 显示原始枚举值（非中文），全项目已替换为手动 `<span>` 映射。**严禁使用 `<SelectValue />`**。
- **2026-07-17 导航标签页**：会议所有子页面用 `<MeetingTabs>` 组件做横向标签页导航，不再有死胡同。
- **2026-07-19 分配看板**：接送/住宿/餐饮/接待四个标签页通过 `?view=board` URL 参数切换到双栏分配看板模式（`AssignmentBoard` 通用组件 + `ViewToggle` 切换按钮）。左栏多选待分配项（住宿为单选），右栏点击资源批量分配。接待看板顶部有 scope 选择器。住宿看板禁用 OCCUPIED/MAINTENANCE 房间。
- **2026-07-19 接待端手机验证门**：`/companion/{id}` 打开时若档案有手机号，需输入后 4 位验证（前端比对）才能查看任务详情。缓解 Companion ID 永久 token 的安全风险。
- **2026-07-19 接待人员 CRUD**：新增 `updateCompanion` / `deleteCompanion` Server Actions。名册行内编辑/删除（已分配的不允许删除）。
- **2026-07-19 接待端嘉宾切换**：门户顶部横向嘉宾切换卡片（姓名 + 等级），仅渲染当前嘉宾详情。
- **2026-07-19 Prisma 加密扩展修复**：`decryptFieldsOn` 改为递归解密（`decryptRecursive`），处理 `include` 嵌套关系中的加密字段（如 `MeetingGuest` include `Guest.phone`）。原按 `model` 参数只解密顶层的实现已废弃。
- **2026-07-19 术语变更**：UI 文案中「陪同」全部改为「接待」（MeetingTabs 标签、名册标题、接待端标题等）。代码中 Companion 模型/字段名保持不变。

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
- **递归解密**：`decryptFieldsOn` 调用 `decryptRecursive` 深度遍历返回对象，处理 `include` 嵌套关系中的加密字段（如 `MeetingGuest` include `Guest.phone`）。不依赖 `model` 参数。

### 嘉宾/陪同/司机端 Token

- **有状态**（DB-backed），不是 JWT
- HMAC-SHA256 哈希存储（`tokenHash`，原值不入库）
- 可吊销（revokedAt 字段）
- 自动过期（expiresAt）
- 审计（lastAccessedAt, accessCount）
- 嘉宾端页面：`app/guest/[token]/page.tsx`（行程展示，无需登录）
- 司机端页面：`app/driver/[token]/page.tsx`（任务详情 + 状态更新）

### 字典系统（DictProvider）

- **代码层**：`lib/shared/dictionary.ts` — `DICTIONARY` 常量，19 个枚举分类
- **数据库层**：`DictionaryEntry` 表 — 管理员可在后台修改标签，无需改代码
- **服务层**：`lib/domain/dictionary/service.ts` — 1 分钟缓存，DB 优先代码兜底
- **客户端注入**：`DictProvider`（React Context）+ `useDbDict()` hook
- **后台管理**：`/admin/dictionary`（仅 SUPER_ADMIN）
- **使用规则**：客户端组件用 `useDbDict()` 替代静态 `dict` import；`<SelectValue />` 已废弃，用手动 `<span>` 映射

### 会议资源池（Per-Meeting）

- **Vehicle** 和 **Hotel** 都有 `meetingId` — 每场会议独立管理
- 不再有全局 `/vehicles` 和 `/hotels` 页面
- **资源管理页面**：`/meetings/[id]/resources` — 集中管理车辆、酒店房间、餐桌
  - `VehicleManager`：车辆列表 + 内联添加 + 删除
  - `HotelRoomManager`：酒店列表 + 添加酒店 + 按酒店添加房间
  - `DiningTableManager`：餐桌列表 + 内联添加 + 删除
- MeetingTabs 新增「资源」标签（接送/住宿/餐饮标签页内也保留各自的添加表单）

### 导航架构

- **MeetingTabs**：会议所有子页面顶部横向标签（详情/嘉宾/议程/签到/接送/住宿/餐饮/礼品/陪同/费用/人员/资源）
- **Breadcrumbs**：非会议页面用面包屑（嘉宾详情等）
- **StaffNav**：侧边栏分两组（核心业务 + 系统），资源管理已移入会议内

### 审计与费用自动化

- **审计日志**：所有 Server Action 的 create/update/delete 操作自动记录到 `AuditLog` 表（`auditLog()` helper）
- **费用自动生成**：TransportOrder→COMPLETED / LodgingOrder→CHECKED_OUT / GiftOrder→DELIVERED 时自动创建 FeeRecord（fire-and-forget）

### 任务分配与会议角色

- **assigneeId**：TransportOrder/LodgingOrder/CateringOrder/GiftOrder 都有 `assigneeId`（关联 User）
- **我的任务**：`/my-tasks` 页面显示分配给当前用户的所有任务
- **MeetingStaff**：会议级角色（OWNER/RECEPTION_LEAD/TRANSPORT_LEAD 等 10 种），在 `/meetings/[id]/staff` 管理

### 安全加固

- **字段脱敏**：VIEWER 角色看到掩码手机（138\*\*\*\*1234）和身份证
- **速率限制**：登录 5 次/5 分钟窗口（Redis 滑动窗口），fail-open 设计
- **备份恢复**：`scripts/backup.sh`（gzip pg_dump, 保留 7 份）+ `scripts/restore.sh`

## Key Files

| 路径                                                       | 内容                                                |
| ---------------------------------------------------------- | --------------------------------------------------- |
| `docs/plans/2026-07-15-cmms-design.md`                     | 完整设计（800+ 行）                                 |
| `docs/plans/2026-07-15-cmms-foundation.md`                 | Phase 0+1 实施计划（3900+ 行）                      |
| `docs/plans/2026-07-17-navigation-redesign.md`             | 导航重构设计                                        |
| `prisma/schema.prisma`                                     | 数据模型（含 meetingId 绑定的 Vehicle/Hotel）       |
| `proxy.ts`                                                 | Next.js 16 Edge middleware（路由保护）              |
| `lib/auth/{config,index}.ts`                               | Dual NextAuth config                                |
| `lib/db/{client,prisma-extensions,field-encryption}.ts`    | Prisma + 加密                                       |
| `lib/shared/dictionary.ts`                                 | 字典常量（19 个枚举分类，唯一数据源）               |
| `lib/domain/dictionary/service.ts`                         | 字典 DB 服务（1 分钟缓存 + 后台可配置）             |
| `components/providers/DictProvider.tsx`                    | React Context 注入 DB 标签给客户端组件              |
| `components/layout/MeetingTabs.tsx`                        | 会议标签页导航组件                                  |
| `components/shared/AssignmentBoard.tsx`                    | 通用分配看板组件（左栏多选 + 右栏资源批量分配）     |
| `components/shared/ViewToggle.tsx`                         | 列表/看板双模式切换按钮（`?view=board`）            |
| `app/(staff)/meetings/[id]/companions/CompanionRoster.tsx` | 接待人员名册（行内编辑/删除/分享）                  |
| `app/companion/[token]/CompanionPortal.tsx`                | 接待端门户（手机验证门 + 嘉宾切换 + 详情卡片）      |
| `app/companion/[token]/GuestShareButton.tsx`               | 接待端分享嘉宾行程链接按钮                          |
| `lib/domain/guest/`                                        | 参考实现（Repository + Service + Importer）         |
| `lib/actions/utils.ts`                                     | Server Action 通用工具（auth + validation + error） |
| `docker/docker-compose.yml`                                | 独立的 PostgreSQL + Redis                           |

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
