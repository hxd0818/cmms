# Changelog

本项目所有显著变更都会记录在此文件中。格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/)，版本号遵循 [Semantic Versioning](https://semver.org/lang/zh-CN/)。

详细的每日技术实现记录见 `docs/changelog/` 目录。

---

## [Unreleased] — 2026-07-18 审计补全

### Phase 1 — 核心业务逻辑修复

- **审计日志自动记录**：所有 16 个 Server Action 文件的 create/update/delete 操作（共 48 个日志点）自动记录到 AuditLog 表。新增 `auditLog()` helper 提取 session 中的操作者信息。
- **费用自动生成钩子**：TransportOrder→COMPLETED、LodgingOrder→CHECKED_OUT、GiftOrder→DELIVERED 时自动创建 FeeRecord（fire-and-forget，不阻塞主操作）。
- **任务分配 + 我的任务**：TransportOrder/LodgingOrder/CateringOrder/GiftOrder 新增 `assigneeId` 字段。`/my-tasks` 页面显示分配给当前用户的所有任务，按类型分组。`assignTask()` Server Action 支持分配/取消分配。

### Phase 2 — 重要功能增强

- **MeetingStaff 会议角色**：MeetingStaff 模型 + MeetingRole 枚举（10 种角色：OWNER/RECEPTION_LEAD/TRANSPORT_LEAD 等）。`/meetings/[id]/staff` 页面管理工作人员分配。
- **批量签到**：签到台 Kanban 支持多选嘉宾 + 浮动批量签到按钮。
- **报表导出**：`/api/meetings/[id]/export` 端点支持 3 种 Excel 导出（概览/嘉宾名单/费用明细）。
- **RSVP 管理**：工作人员可修改嘉宾参会状态（PENDING/CONFIRMED/DECLINED），嘉宾端显示参会状态。
- **室友分配**：住宿管理界面支持多选室友，`assignRoommates()` action + service。
- **司机当日任务列表**：司机端从单任务改为显示同车当日全部任务，当前任务高亮。

### Phase 3 — 运维安全加固

- **字段级脱敏**：VIEWER 角色看到掩码手机（138\*\*\*\*1234）和身份证号，11 个单元测试。
- **速率限制**：登录端点 Redis 滑动窗口（5 次/5 分钟），fail-open 设计，6 个单元测试。
- **备份恢复脚本**：`scripts/backup.sh`（gzip pg_dump, 保留 7 份）+ `scripts/restore.sh`（交互式确认）。
- **通知系统基础**：NotificationTemplate + NotificationLog Prisma 模型 + sender 接口（日志模式，无真实 SMS）。

## [Unreleased] — 2026-07-17/18 迭代改进

### Changed — 架构级变更

- **资源池独立化**：Vehicle 和 Hotel 从全局共享改为每场会议独立（加 `meetingId`）。删除全局 `/vehicles` `/hotels` 页面，改为会议内标签页管理。
- **字典系统统一**：消除全项目 24 个硬编码 `_LABEL` map，统一到 `lib/shared/dictionary.ts`。管理员可在 `/admin/dictionary` 后台修改枚举标签。客户端组件通过 `DictProvider` + `useDbDict()` 获取 DB 标签。
- **导航重构**：会议子页面全部改为标签页导航（`MeetingTabs`），消除死胡同。非会议页面加面包屑。根路径 `/` 自动跳转。
- **SelectValue 废弃**：base-ui 的 `<SelectValue />` 显示原始枚举值，全项目替换为手动 `<span>` 映射 dict 标签。

### Added — 新功能

- **嘉宾端门户**（`app/guest/[token]/page.tsx`）：Token 链接分享行程（接送/住宿/餐饮/议程/礼品/陪同），30 天有效，无需登录。
- **分享链接按钮**：会议嘉宾管理 Sheet 面板内「生成分享链接」+ 复制到剪贴板。
- **字典管理后台**（`/admin/dictionary`）：SUPER_ADMIN 可编辑 19 个分类 90 个标签，1 分钟缓存生效。
- **会议嘉宾设置编辑**：Sheet 面板内编辑随行角色/等级覆盖/所属主嘉宾/继承标志/分组标签。
- **拼车支持**：接送车辆分配从硬性时间冲突改为容量检测，支持多人拼车 + 确认提示。
- **议程类型扩展**：新增闭门会/调研/沙龙/评审/路演/答辩 6 种。
- **资源管理标签页**（`/meetings/[id]/resources`）：集中管理车辆/酒店房间/餐桌，含内联添加 + 删除。

### Fixed

- Prisma Decimal 序列化错误（礼品单价/费用金额转 number 后再传客户端组件）
- GuestManager Fragment key 警告
- `/api/health` 被 auth 中间件拦截（加入 PUBLIC_PATHS）
- 嘉宾端 404（路由 `/g/` 改为 `/guest/` 匹配实际文件夹）
- CI 失败（FIELD_ENCRYPTION_KEY YAML 整数解析，加引号修复）

- **Phase 4 - 运营优化**：报表 + 通知中心 + 审计日志 + 生产硬化

---

## [0.3.0] - 2026-07-15 — Phase 2：现场运营核心

### Added — M2.1 Meeting + MeetingGuest

- **Meeting Prisma 模型**：MeetingStatus 5 态状态机（DRAFT→PLANNING→ONGOING→COMPLETED，任意→CANCELED）
- **MeetingGuest 自引用随行关系**：primaryMeetingGuestId + EntourageRole（7 种角色）+ 规格继承（levelOverride / inheritLodging / inheritTransport）
- **ReceptionStage 5 态状态机**：NOT_ARRIVED→CHECKED_IN→IN_HOUSE→DEPARTED（+NO_SHOW）
- **Meeting UI**：列表（状态 Badge）+ 详情（状态切换下拉）+ 创建/编辑表单（datetime-local）
- **MeetingGuest Excel 批量导入**：BullMQ 异步，按手机号查找 Guest，主嘉宾缓存支持随行关联
- **会议嘉宾管理 UI**：搜索添加 Dialog + 主嘉宾/随行缩进展示 + 移除

### Added — M2.2 Agenda

- **AgendaItem 模型**：含 AgendaType 6 类 + speakerIds 数组 + 时间范围
- **演讲嘉宾冲突检测**：PostgreSQL `hasSome` + 日期重叠查询，同一演讲嘉宾不可时间重叠
- **议程时间线 UI**：类型 Badge + 创建表单 + 删除确认

### Added — M2.3 Reception

- **签到服务**：5 态状态机 + 简化 Guest 360 聚合器（meetingGuest + speaker 议程）
- **签到台 UI**：搜索待签到嘉宾（按姓名/单位）+ 一键签到 + 标记未到
- **Kanban 任务看板**：4 列（待签到/已签到/在场/已离场）+ 5 秒轮询（替代 WebSocket）

### Added — M2.4 Transport + Vehicle

- **Vehicle 资源池**：plateNo 唯一 + 类型/容量/司机信息
- **TransportOrder 冲突检测**：车辆时间窗口（前 30min + 后 60min）重叠检测 + 容量校验（主嘉宾 + inheritTransport 随行）
- **7 态状态机**：UNASSIGNED→ASSIGNED→EN_ROUTE→PICKED_UP→COMPLETED（+REASSIGNED/CANCELED）
- **调度 UI**：按时间排序表 + 分配车辆 Dialog + 状态切换下拉（只显示合法下一状态）

### Added — M2.5 Token 系统 + 司机端

- **GuestAccessToken + DriverAccessToken**：HMAC-SHA256 哈希存储（原值不入库），有状态（DB-backed），可吊销（revokedAt），自动过期
- **Token Server Actions**：issueGuestToken / revokeGuestToken / issueDriverToken
- **司机端 H5**：`/d/[token]` 路由，Token 验证 Layout + 任务详情 + 状态更新按钮 + REST API endpoint

### Changed

- Prisma 7 model relations 需在 MeetingGuest 上声明所有反向关系
- shadcn 4.12 Select onValueChange 返回 `string | null`（非 `string`），需处理 null
- Zod 4 `.partial()` 在含 `.refine()` 的 schema 上报错（拆分 base + refine 解决）

### Fixed

- AgendaForm zodResolver 用了含 `meetingId` 的 schema，表单不含 `meetingId` 导致校验失败 → 拆分 `agendaFormSchema`
- Turbopack `.next` 缓存在 Prisma schema 变更后不自动失效 → 手动清理 `.next` 目录
- Playwright strict mode 在多元素匹配时报错 → 用 `.first()` 或更精确的选择器

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
