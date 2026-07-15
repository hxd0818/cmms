# CMMS 会务管理系统 - 设计文档

> **Document Date**: 2026-07-15
> **Status**: Approved (Design Phase)
> **Author**: Claude Code (brainstorming with user)
> **Next Step**: Implementation planning (writing-plans skill)

---

## 0. 项目概述

### 0.1 项目定位

**CMMS (Conference Management & Member Service)** 是一款**单组织内部使用的、以接待运营为核心的通用会务管理平台**。

**核心差异化**：
- 不同于"日程发布系统"，CMMS 以**接待运营**为核心（接送/住宿/餐饮/礼品/陪同）
- 不同于"单场活动工具"，CMMS 沉淀**跨会议的嘉宾档案**，VIP 信息长期累积
- 不同于"流程审批工具"，CMMS 服务**现场实操**（签到、调度、状态实时更新）

### 0.2 用户与场景

| 用户类型 | 使用端 | 核心场景 |
|---|---|---|
| 会务工作人员 | PC + 移动端 H5（登录） | 嘉宾库管理、会议筹备、现场接待、调度 |
| 嘉宾本人 | 移动端 H5（扫码） | 查看个人议程、接送、住宿、餐饮安排 |
| 陪同人员（秘书/翻译等） | 移动端 H5（扫码） | 查看主嘉宾接待安排、执行现场任务 |
| 外部司机 | 移动端 H5（链接） | 查看自己被分配的接送任务 |

### 0.3 MVP 模块范围

1. 嘉宾信息库（含随行人员关系）
2. 会议-嘉宾关联管理
3. 议程与排期管理
4. 签到与现场接待
5. 接送车辆调度
6. 住宿与房间分配
7. 餐饮与桌位
8. 礼品/陪同/费用管理

---

## 1. 整体架构

### 1.1 架构形态：Next.js 全栈单体

```
┌──────────────────────────────────────────────────────┐
│            Next.js 14 (App Router) 全栈              │
│                                                      │
│  ┌─────────────────┐  ┌──────────────────────────┐   │
│  │ 工作人员 PC/H5   │  │ 嘉宾/陪同/司机 H5端       │   │
│  │ (需 NextAuth)   │  │ (扫码 + Token 校验)      │   │
│  └────────┬────────┘  └───────────┬──────────────┘   │
│           │                       │                  │
│           ▼                       ▼                  │
│  ┌────────────────────────────────────────────────┐  │
│  │     Server Actions + Route Handlers            │  │
│  │  (auth/guest/meeting/transport/lodging/...)    │  │
│  └────────────────────┬───────────────────────────┘  │
│                       │                              │
│  ┌────────────────────▼───────────────────────────┐  │
│  │  Prisma ORM (TypeScript 共享类型)              │  │
│  └────────────────────┬───────────────────────────┘  │
└───────────────────────┼──────────────────────────────┘
                        ▼
            ┌─────────────────────────┐
            │  PostgreSQL 16          │
            │  + Redis 7 (队列/缓存)  │
            └─────────────────────────┘

            (独立 worker 进程，同仓库)
            ┌─────────────────────────┐
            │  BullMQ Worker          │
            │  - Excel 批量导入       │
            │  - 通知批量发送         │
            │  - 报表异步导出         │
            └─────────────────────────┘
```

**架构选择理由**：
- 单组织内部系统，CRUD + 调度型业务，无高并发要求
- 全栈 TypeScript，DX 极佳，类型天然共享
- 一个仓库一份代码，避免 monorepo 维护负担
- Server Actions 减少前后端 API 模板代码

### 1.2 技术栈（已升级到 2026-07 最新稳定版）

| 层 | 选型 | 实际版本 | 备注 |
|---|---|---|---|
| 前端 + 后端 | Next.js (App Router + Turbopack) | **16.2.10** | 2026-07-01 发布，最新稳定版 |
| 运行时 | React | **19.2.4** | 配合 Next.js 16 |
| 业务逻辑入口 | Server Actions (默认) + Route Handlers (webhook/下载) | — | |
| UI 组件 | shadcn/ui + Tailwind CSS | **shadcn 4.12 + Tailwind v4** | Tailwind v4 CSS-first 配置 |
| 数据获取 | TanStack Query (客户端) + Server Components (服务端) | **5.101** | |
| 表单 | React Hook Form + Zod | **RHF 7.81 + Zod 4.4** | 与服务端共享 schema |
| ORM | Prisma | **7.8** | 类型安全 |
| 数据库 | PostgreSQL | **16** | JSONB 支持灵活字段 |
| 缓存/队列 | Redis + BullMQ | **Redis 7 + BullMQ 5.80** | |
| 认证 | Auth.js (NextAuth v5) | **beta.31** | 工作人员端 |
| 嘉宾端 Token | 有状态 token + HMAC + Redis | — | 可吊销 |
| 权限 | CASL.js | **7.0** | 前后端共享规则 |
| 导入导出 | exceljs | **4.4** | 流式处理大文件 |
| 日志 | Pino (结构化) | **10.3** | |
| 测试 | Vitest (单测) + Playwright (E2E) | **Vitest 4.1 + Playwright 1.61** | |
| 部署 | Docker Compose | — | 单组织不需要 K8s |
| 监控 | Sentry | — | |
| 包管理 | pnpm | **11.13** | |
| Node.js | LTS | **20+（实际 24.13）** | |
| TypeScript | strict mode | **5.9** | |

**版本选择理由**：
- Next.js 16（2025-10-21 发布）是当前 active 版本，Next.js 15 进入 Maintenance LTS（2026-10-21 EOL），更早版本已 EOL
- Tailwind v4（2025 发布）改用 CSS-first 配置（`@import "tailwindcss"` 替代 `@tailwind` 指令）
- 所有版本均选择 2026-07 已生产就绪的最新稳定版

---

### 1.2.x 与原始计划的偏离说明

原始设计（2026-07-15 brainstorming）基于惯性推荐了 Next.js 14 + Tailwind v3 + Prisma 5 + Zod 3，但实施时（Task 0.2-0.5）已升级到最新稳定版。偏离记录：

| 项 | 原计划 | 实际 | 原因 |
|---|---|---|---|
| Next.js | 14 | 16.2.10 | Next.js 14 已 EOL，16 是当前 active |
| React | 18 | 19.2.4 | 配合 Next.js 16 |
| Tailwind | v3 | v4 | v4 是 2025 年发布的新版本 |
| Prisma | 5 | 7.8 | 7 是 2025 年发布的新版 |
| Zod | 3 | 4 | v4 是最新稳定版 |
| ESLint Config | `.eslintrc.json` | `eslint.config.mjs` (flat) | ESLint 9 默认 flat config |
| shadcn | (未指定) | 4.12 | 4.13 与 Next.js 16 有兼容问题 |

### 1.3 目录结构

```
cmms/
├── app/
│   ├── (staff)/              # 工作人员路由组（需登录）
│   │   ├── dashboard/
│   │   ├── guests/
│   │   ├── meetings/
│   │   │   └── [meetingId]/
│   │   │       ├── agenda/
│   │   │       ├── reception/
│   │   │       ├── transport/
│   │   │       ├── lodging/
│   │   │       ├── catering/
│   │   │       └── gift/
│   │   └── settings/
│   ├── guest/                # 嘉宾/陪同端（扫码）
│   │   └── [token]/
│   ├── driver/               # 司机端（链接）
│   │   └── [token]/
│   ├── api/                  # Route Handlers (webhook)
│   └── actions/              # Server Actions (按领域分文件)
├── components/
│   ├── ui/                   # shadcn/ui 基础组件
│   ├── guests/
│   ├── meetings/
│   └── ...
├── lib/
│   ├── db/                   # Prisma client
│   ├── domain/               # 领域逻辑（按模块）
│   │   ├── guest/
│   │   │   ├── service.ts
│   │   │   ├── repository.ts
│   │   │   └── types.ts
│   │   ├── meeting/
│   │   ├── transport/
│   │   └── ...
│   ├── auth/                 # NextAuth 配置
│   ├── queue/                # BullMQ 配置
│   ├── shared/               # 共享 Zod schema / 枚举
│   └── utils/
├── worker/                   # 独立 worker 进程入口
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed/
├── docker/
│   ├── Dockerfile
│   └── docker-compose.yml
├── docs/
└── package.json
```

---

## 2. 领域模型

### 2.1 核心设计权衡：接待事务的建模

| 方案 | 评价 |
|---|---|
| 多态单表 (一张 service_orders + JSONB) | ❌ 失去外键约束、字段弱类型、报表难查 |
| 完全分表 (各自独立不关联) | ❌ 嘉宾 360 视图需 UNION |
| **🏆 混合模式** (资源/事务各自独立表 + 领域服务层聚合) | ✅ 完整约束+强类型+清晰边界 |

**采用混合模式**。接待事务种类有限稳定（接送/住宿/餐饮/礼品/陪同/费用 6 类），每种字段差异大，独立表维护成本可控。

### 2.2 实体关系图

```
                          ┌──── User (工作人员)
                          │     │
                          │     └─ (N) AuditLog
                          │
   ┌─────────────┐        │       ┌──────────────┐
   │   Guest     │◄───────┼───────│   Meeting    │
   │  (嘉宾库)   │        │       │  (会议)      │
   │  跨会议沉淀 │        │       │              │
   └──────┬──────┘        │       └──────┬───────┘
          │ (N)           │              │ (N)
   ┌──────▼──────┐        │       ┌──────▼───────┐
   │MeetingGuest │◄───────┼──────►│  AgendaItem  │
   │ (关联表)    │  (N:N) │       │  (议程项)    │
   │ RSVP/分组/  │        │       │  场地/时间   │
   │ 接待状态/   │        │       └──────────────┘
   │ 随行关系    │        │
   └──────┬──────┘        │
          │ (1)
          │
   ┌──────▼──────────────────────────────────────┐
   │     接待事务（各自独立表）                   │
   ├──────────────┬─────────────┬───────────────┤
   │TransportOrder│LodgingOrder │CateringOrder  │
   ├──────────────┼─────────────┼───────────────┤
   │GiftOrder     │CompanionAsg │FeeRecord      │
   └──────┬───────┴─────────────┴───────────────┘
          │ 关联到资源
          ▼
   ┌─────────────────────────────────────────────┐
   │     资源池（独立表）                         │
   ├──────────────┬─────────────┬───────────────┤
   │ Vehicle      │ HotelRoom   │ DiningTable   │
   │ Driver info  │ Hotel       │ Menu          │
   │ Companion    │ RoomType    │ Gift          │
   └─────────────────────────────────────────────┘
```

### 2.3 关键 Schema (Prisma 伪代码)

```prisma
// ============ 主实体 ============

model Guest {
  id          String   @id @default(cuid())
  name        String
  gender      Gender?
  phone       String?  @unique
  email       String?
  company     String?
  title       String?
  level       GuestLevel // VIP_A / VIP_B / A / B / C
  avatarUrl   String?
  idNumber    String?  // encrypted
  dietaryTags String[]
  notes       String?

  meetingGuests MeetingGuest[]
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}

model Meeting {
  id          String   @id @default(cuid())
  name        String
  code        String   @unique
  status      MeetingStatus // DRAFT / PLANNING / ONGOING / COMPLETED / CANCELED
  startAt     DateTime
  endAt       DateTime
  venue       String?
  description String?

  meetingGuests MeetingGuest[]
  agendaItems  AgendaItem[]
}

model MeetingGuest {
  id          String @id @default(cuid())
  meetingId   String
  guestId     String
  rsvpStatus  RsvpStatus // PENDING / CONFIRMED / DECLINED
  groupTags   String[] // SPEAKER / MEDIA / VIP / ATTENDEE
  receptionStage ReceptionStage // NOT_ARRIVED / CHECKED_IN / IN_HOUSE / DEPARTED / NO_SHOW

  // Entourage (随行关系，会议级)
  primaryMeetingGuestId String?
  entourageRole         EntourageRole? // PRIMARY / SECRETARY / SECURITY / INTERPRETER / FAMILY / AIDE / DRIVER

  // Reception spec inheritance
  levelOverride    GuestLevel?
  inheritLodging   Boolean @default(true)
  inheritTransport Boolean @default(true)

  meeting Meeting @relation(fields: [meetingId], references: [id])
  guest   Guest   @relation(fields: [guestId], references: [id])
  primary MeetingGuest? @relation("EntourageRelation", fields: [primaryMeetingGuestId], references: [id])
  subordinates MeetingGuest[] @relation("EntourageRelation")

  @@unique([meetingId, guestId])
}

// ============ Agenda ============

model AgendaItem {
  id          String @id @default(cuid())
  meetingId   String
  title       String
  type        AgendaType // KEYNOTE / PANEL / BREAK / MEAL / TOUR
  startAt     DateTime
  endAt       DateTime
  venue       String?
  speakerIds  String[] // MeetingGuest.id

  meeting Meeting @relation(fields: [meetingId], references: [id])
}

// ============ Transport ============

model Vehicle {
  id          String @id @default(cuid())
  plateNo     String @unique
  type        VehicleType // SEDAN / MPV / BUS
  capacity    Int
  driverName  String
  driverPhone String
  belongs     String?
}

model TransportOrder {
  id            String @id @default(cuid())
  meetingId     String
  meetingGuestId String
  vehicleId     String?
  pickupType    PickupType // AIRPORT / TRAINSTATION / HOTEL / VENUE
  pickupLocation String
  pickupTime    DateTime
  dropoffLocation String
  flightNo      String?
  status        TransportStatus // UNASSIGNED / ASSIGNED / EN_ROUTE / PICKED_UP / COMPLETED / REASSIGNED / CANCELED

  meetingGuest MeetingGuest @relation(fields: [meetingGuestId], references: [id])
  vehicle      Vehicle?     @relation(fields: [vehicleId], references: [id])

  @@index([meetingId, pickupTime])
}

// ============ Lodging ============

model Hotel {
  id        String @id @default(cuid())
  name      String
  address   String
  contactPhone String?
}

model HotelRoom {
  id          String @id @default(cuid())
  hotelId     String
  roomNumber  String
  roomType    RoomType // SINGLE / DOUBLE / SUITE
  status      RoomStatus // AVAILABLE / RESERVED / OCCUPIED

  hotel Hotel @relation(fields: [hotelId], references: [id])
  @@unique([hotelId, roomNumber])
}

model LodgingOrder {
  id              String @id @default(cuid())
  meetingId       String
  meetingGuestId  String
  hotelRoomId     String?
  checkInAt       DateTime
  checkOutAt      DateTime
  specialRequests String?
  status          LodgingStatus // UNASSIGNED / RESERVED / CHECKED_IN / CHECKED_OUT / CANCELED
  roommateIds     String[]

  meetingGuest MeetingGuest @relation(fields: [meetingGuestId], references: [id])
  hotelRoom    HotelRoom?   @relation(fields: [hotelRoomId], references: [id])
}

// ============ Catering ============

model DiningTable {
  id          String @id @default(cuid())
  meetingId   String
  name        String
  capacity    Int
  type        TableType // ROUND / SQUARE / BUFFET
}

model CateringOrder {
  id              String @id @default(cuid())
  meetingId       String
  meetingGuestId  String
  mealType        MealType // WELCOME_BANQUET / FAREWELL / LUNCH / DINNER
  mealTime        DateTime
  diningTableId   String?
  specialDietary  String[]

  diningTable DiningTable? @relation(fields: [diningTableId], references: [id])
}

// ============ Gift / Companion / Fee ============

model Gift {
  id        String @id @default(cuid())
  name      String
  stock     Int
  unitPrice Decimal?
}

model GiftOrder {
  id             String @id @default(cuid())
  meetingId      String
  meetingGuestId String
  giftId         String
  quantity       Int @default(1)
  deliveredAt    DateTime?
  status         GiftStatus // PENDING / DELIVERED
}

model Companion {
  id        String @id @default(cuid())
  name      String
  phone     String
  languages String[]
  role      String
}

model CompanionAssignment {
  id              String @id @default(cuid())
  meetingId       String
  meetingGuestId  String
  companionId     String
  assignmentScope String
}

model FeeRecord {
  id              String @id @default(cuid())
  meetingId       String
  meetingGuestId  String?
  category        FeeCategory // TRANSPORT / LODGING / MEAL / GIFT / OTHER
  amount          Decimal
  currency        String @default("CNY")
  incurredAt      DateTime
  notes           String?
}

// ============ System ============

model User {
  id        String @id @default(cuid())
  email     String @unique
  name      String
  passwordHash String
  role      SystemRole // SUPER_ADMIN / VIEWER
  createdAt DateTime @default(now())
}

model MeetingStaff { // 会议级工作人员分配
  id          String @id @default(cuid())
  meetingId   String
  userId      String
  meetingRole MeetingRole // OWNER / RECEPTION_LEAD / RECEPTION_STAFF / TRANSPORT_COORDINATOR / LODGING_COORDINATOR / CATERING_COORDINATOR
}

model GuestAccessToken {
  id              String   @id @default(cuid())
  meetingGuestId  String   @unique
  tokenHash       String   @unique
  issuedAt        DateTime @default(now())
  expiresAt       DateTime
  revokedAt       DateTime?
  revokedBy       String?
  lastAccessedAt  DateTime?
  accessCount     Int      @default(0)
}

model DriverAccessToken {
  id              String   @id @default(cuid())
  transportOrderId String  @unique
  tokenHash       String   @unique
  issuedAt        DateTime @default(now())
  expiresAt       DateTime
  revokedAt       DateTime?
}

model AuditLog {
  id          String   @id @default(cuid())
  actorType   ActorType // USER / GUEST_PORTAL / DRIVER_PORTAL / SYSTEM
  actorId     String?
  actorRole   String?
  action      String   // CREATE / UPDATE / DELETE / ASSIGN / CHECK_IN
  entityType  String
  entityId    String
  before      Json?
  after       Json?
  source      String?  // IP / User-Agent
  createdAt   DateTime @default(now())

  @@index([entityType, entityId])
  @@index([actorType, actorId])
}

// ============ Enums ============

enum Gender { MALE FEMALE OTHER }
enum GuestLevel { VIP_A VIP_B A B C }
enum MeetingStatus { DRAFT PLANNING ONGOING COMPLETED CANCELED }
enum RsvpStatus { PENDING CONFIRMED DECLINED }
enum ReceptionStage { NOT_ARRIVED CHECKED_IN IN_HOUSE DEPARTED NO_SHOW }
enum EntourageRole { PRIMARY SECRETARY SECURITY INTERPRETER FAMILY AIDE DRIVER }
enum AgendaType { KEYNOTE PANEL BREAK MEAL TOUR }
enum VehicleType { SEDAN MPV BUS }
enum PickupType { AIRPORT TRAINSTATION HOTEL VENUE }
enum TransportStatus { UNASSIGNED ASSIGNED EN_ROUTE PICKED_UP COMPLETED REASSIGNED CANCELED }
enum RoomType { SINGLE DOUBLE SUITE }
enum RoomStatus { AVAILABLE RESERVED OCCUPIED }
enum LodgingStatus { UNASSIGNED RESERVED CHECKED_IN CHECKED_OUT CANCELED }
enum TableType { ROUND SQUARE BUFFET }
enum MealType { WELCOME_BANQUET FAREWELL LUNCH DINNER BREAKFAST }
enum GiftStatus { PENDING DELIVERED }
enum FeeCategory { TRANSPORT LODGING MEAL GIFT OTHER }
enum SystemRole { SUPER_ADMIN VIEWER }
enum MeetingRole { OWNER RECEPTION_LEAD RECEPTION_STAFF TRANSPORT_COORDINATOR LODGING_COORDINATOR CATERING_COORDINATOR }
enum ActorType { USER GUEST_PORTAL DRIVER_PORTAL SYSTEM }
```

### 2.4 随行人员设计要点

- **关系维护在 MeetingGuest 层**（不是 Guest 层），支持同一人多重身份
- **接待规格继承**：随行人员默认与主嘉宾同规格，可通过 `levelOverride` 单独覆盖
- **批量调度**：调度时按 `primaryMeetingGuestId` 分组操作
- **报表去重**：贵宾接待报表按 `WHERE entourageRole = 'PRIMARY'` 过滤

### 2.5 关键设计决策

1. **Guest 跨会议沉淀**：Guest 表不绑定会议，通过 MeetingGuest 实现多对多
2. **MeetingGuest 是接待状态枢纽**：所有接待订单通过 meetingGuestId 关联
3. **资源可预占**：vehicleId/roomId 可空，冲突检测用 PostgreSQL 行锁 + 时间范围
4. **敏感字段加密**：idNumber、phone 通过 Prisma 中间件 AES-256-GCM 加密
5. **审计日志统一**：装饰器/中间件自动记录所有写操作
6. **软删除策略**：核心表软删除（deletedAt），事务表硬删除
7. **JSONB 谨慎使用**：仅用于真正灵活的字段（groupTags、dietaryTags）

---

## 3. 权限、工作流与状态机

### 3.1 RBAC 角色权限模型

| 角色 | 数据范围 | 典型用户 |
|---|---|---|
| SuperAdmin | 全部 | IT/总指挥 |
| MeetingOwner (per Meeting) | 本会议全部 | 单场会议总负责人 |
| ReceptionLead | 本会议接待任务（不含费用） | 接待组长 |
| ReceptionStaff | 本会议签到/状态（无敏感字段） | 现场签到员 |
| ResourceCoordinator | 仅自己负责的模块 | 车辆/住宿/餐饮调度员 |
| Viewer | 全部只读 | 领导查看 |

**资源-操作权限矩阵**：

| 操作 | SuperAdmin | Owner | Lead | Staff | Coordinator | Viewer |
|---|:-:|:-:|:-:|:-:|:-:|:-:|
| 创建/删除会议 | ✓ | — | — | — | — | — |
| 编辑会议 | ✓ | ✓ | — | — | — | — |
| 管理嘉宾库 | ✓ | ✓ | — | — | — | — |
| 导入嘉宾/资源 | ✓ | ✓ | — | — | — | — |
| 签到操作 | ✓ | ✓ | ✓ | ✓ | — | — |
| 分配接送/住宿/餐饮 | ✓ | ✓ | ✓ | — | ✓(仅本模块) | — |
| 查看VIP手机号/身份证 | ✓ | ✓ | ✓ | — | — | — |
| 查看/导出费用 | ✓ | ✓ | — | — | — | ✓(脱敏) |
| 查看审计日志 | ✓ | — | — | — | — | — |

**实现要点**：
- CASL.js 前后端共享权限规则
- Prisma 查询层字段级脱敏（根据角色动态打码）
- MeetingStaff 表关联 userId + meetingId + meetingRole

### 3.2 三个端的设计

#### 工作人员端
- 路由：`app/(staff)/*`
- 认证：NextAuth.js v5 (账号密码 / OAuth)
- 入口：登录页 → Dashboard
- 设备：PC 优先 + iPad/手机响应式

#### 嘉宾/陪同端
- 路由：`app/guest/[token]/*`
- 认证：有状态 token + HMAC + Redis
- 入口：短信链接（含一次性 PIN）
- 视图：根据 `MeetingGuest.entourageRole` 动态渲染
  - PRIMARY → 纯只读嘉宾端
  - SECRETARY/SECURITY/... → 陪同端（含操作权限）
  - null（独立嘉宾）→ 纯只读

#### 司机端
- 路由：`app/driver/[token]/*`
- 认证：有状态 token，绑定到 TransportOrder（非 MeetingGuest）
- 入口：调度员发送链接给外部司机
- 视图：仅显示自己被分配的接送任务

### 3.3 陪同端操作能力矩阵

| 操作 | PRIMARY | SECRETARY | SECURITY | DRIVER | INTERPRETER | FAMILY |
|---|:-:|:-:|:-:|:-:|:-:|:-:|
| 查看主嘉宾完整接待安排 | ✓ | ✓ | ✓ | 仅接送 | 仅议程 | 仅餐饮 |
| 查看主嘉宾联系方式 | — | ✓ | ✓ | ✓ | — | ✓ |
| 标记主嘉宾已上车 | — | ✓ | — | ✓ | — | — |
| 标记主嘉宾已签到 | — | ✓ | — | — | — | — |
| 提交行程变更请求 | — | ✓ | — | — | — | — |
| 查看其他随行成员 | — | ✓ | ✓ | — | — | — |
| 查看自己的任务 | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |

### 3.4 Token 安全机制

**有状态 Token**（GuestAccessToken / DriverAccessToken）：
- 仅存储 HMAC 哈希，数据库泄露无法复用
- 工作人员可一键吊销（嘉宾手机丢失场景）
- 有效期：会议开始前 3 天 ~ 会议结束后 2 天
- 短信链接包含一次性 PIN，点击后需输入手机后 4 位二次校验
- 同 token 高频访问告警
- 所有写操作通过 AuditLog 记录（含 token 来源）

### 3.5 关键工作流

#### 工作流 1：会议筹备

```
1. SuperAdmin 创建会议 (DRAFT)
2. 指定 MeetingOwner
3. Owner 通过 Excel 导入嘉宾
   - 系统按 phone/idNumber/name+company 去重
   - 已存在 Guest 自动关联，否则创建
4. 维护议程 (议程项 + 场地 + 演讲者)
5. 导入资源 (车辆/房间/餐桌)
6. 各 Coordinator 分配接待任务
7. 会议状态 → PLANNING
8. 系统发送邀请短信 (含嘉宾端链接)
```

#### 工作流 2：现场接待

```
嘉宾到达
  ↓
[签到台] 工作人员扫码/搜索嘉宾
  ↓
MeetingGuest.receptionStage: NOT_ARRIVED → CHECKED_IN
  ↓
系统弹出该嘉宾接待任务清单 (接送/房号/桌号/礼品/随行)
  ↓
各任务负责人更新状态
  ↓
嘉宾离会 → DEPARTED
```

**工作人员主界面 = 任务看板**（按 待签到/已签到未完成/进行中/已完成 分类）

#### 工作流 3：嘉宾扫码端

```
[短信] → 点击链接 (含 token + 一次性 PIN)
  ↓
[H5] 输入手机后 4 位二次校验
  ↓
根据 entourageRole 渲染视图
  ↓
嘉宾: 查看议程/接送/住宿/餐饮
陪同: 查看主嘉宾安排 + 执行操作
```

### 3.6 关键状态机

#### Meeting 状态机
```
DRAFT → PLANNING → ONGOING → COMPLETED
 任意阶段 → CANCELED
```

#### MeetingGuest 接待状态机
```
NOT_ARRIVED → CHECKED_IN → IN_HOUSE → DEPARTED
              ↓
              NO_SHOW
```

#### TransportOrder 状态机
```
UNASSIGNED → ASSIGNED → EN_ROUTE → PICKED_UP → COMPLETED
                ↓
            REASSIGNED
任意状态 → CANCELED
```

#### LodgingOrder 状态机
```
UNASSIGNED → RESERVED → CHECKED_IN → CHECKED_OUT
                ↓
            ROOM_CHANGED
```

### 3.7 核心业务规则

1. **资源冲突检测**：分配前 `SELECT ... FOR UPDATE`，检查时间重叠，冲突返回 409
2. **规格继承**：分配主嘉宾资源时，若 `inheritTransport=true`，自动校验随行人员总数
3. **VIP 软删除保护**：关联未结束会议时阻止删除
4. **状态回退限制**：仅向前推进，回退需 SuperAdmin + 必填原因
5. **并发控制**：关键操作用乐观锁（version 字段 + Prisma update where version = ?）
6. **导出脱敏**：根据导出者角色自动脱敏

---

## 4. 分阶段交付路线图

### 4.1 四阶段计划

```
阶段 1 (MVP 基座, ~3 周)
├── 工作人员登录 + 权限 (NextAuth + CASL)
├── 嘉宾信息库 (CRUD + Excel 导入)
├── 会议管理 + 议程排期
└── 嘉宾端只读 H5 (扫码)

阶段 2 (现场运营, ~3 周)
├── 签到接待 (核心痛点)
├── 接送车辆调度 + 司机任务端
└── 嘉宾/陪同端增强 (陪同可操作)

阶段 3 (深度接待, ~3 周)
├── 住宿与房间分配
├── 餐饮与桌位
├── 礼品/陪同/费用
└── 嘉宾 360° 视图

阶段 4 (运营优化, ~2 周)
├── 报表与统计
├── 通知中心 (短信/邮件)
├── 操作审计
└── 性能优化 + 上线
```

### 4.2 测试策略

| 层 | 工具 | 覆盖目标 |
|---|---|---|
| 单元测试 | Vitest | 70%+ (领域服务) |
| 集成测试 | Vitest + Testcontainers | 关键路径 |
| E2E 测试 | Playwright | 核心流程 |
| 类型测试 | TypeScript strict + Zod | 全量 |
| 性能测试 | k6 | 接送调度并发 |

**关键测试场景**（必须覆盖）：
1. 同车辆时间重叠 → 拒绝分配
2. 同房间日期重叠 → 拒绝
3. 随行规格继承 → 自动建议座位
4. Token 吊销 → 立即失效
5. 陪同端越权 → 拒绝
6. Excel 导入重复 → 提示合并
7. 状态机非法转换 → 拒绝
8. 乐观锁冲突 → 友好提示重试

### 4.3 部署架构

```yaml
# docker-compose.yml (生产)
services:
  web:                    # Next.js 全栈
    image: cmms:latest
    env_file: .env.production
    depends_on: [postgres, redis]
    healthcheck: /api/health

  worker:                 # BullMQ worker
    image: cmms:latest
    command: pnpm worker:start
    depends_on: [postgres, redis]

  postgres:
    image: postgres:16-alpine
    volumes: [pgdata:/var/lib/postgresql/data]

  redis:
    image: redis:7-alpine
    volumes: [redisdata:/data]

  nginx:
    image: nginx:alpine
    ports: ["443:443"]
```

**运维决策**：
1. 数据库备份：每日全量 + WAL 持续归档
2. 审计日志独立存储，3 年保留
3. 错误监控：Sentry
4. 健康检查：`/api/health`
5. 零停机部署：滚动更新
6. 回滚：保留前 3 个版本镜像

### 4.4 关键风险与对策

| 风险 | 影响 | 对策 |
|---|---|---|
| 现场网络差 | 签到失败 | PWA 缓存 + 离线队列 + 重连同步 |
| VIP 数据泄露 | 严重 | 字段加密 + 审计 + Token 吊销 |
| Excel 导入脏数据 | 报表失真 | 严格校验 + 预导入预览 + 错误报告 |
| 并发冲突 | 双人分配同资源 | 行锁 + 乐观锁 + 友好提示 |
| 现场变更频繁 | 状态混乱 | 状态机强制 + 回退需权限 + 审计 |
| 嘉宾手机丢失 | 链接泄露 | 一键吊销 + 重生成 Token |

### 4.5 非功能性需求

1. **性能**：嘉宾端首屏 ≤ 2s (4G)；列表查询 ≤ 500ms；Excel 导入 1000 行 ≤ 30s
2. **可用性**：99.5%
3. **国际化**：暂不实现，全中文
4. **响应式**：工作人员端 PC 优先 + 移动适配；嘉宾端 mobile-first
5. **无障碍**：基本合规（label/ARIA/键盘导航）

---

## 5. 第 0 步启动清单

1. [x] 设计文档已批准
2. [ ] 创建 Next.js 14 项目骨架 + Prisma + PostgreSQL Docker
3. [ ] 建立 Git 仓库 + GitHub Actions CI/CD
4. [ ] 实现第一个领域模块（Guest）作为参考
5. [ ] 阶段 1 正式开发

---

## 6. 附录：关键决策记录

| 决策 | 选择 | 理由 |
|---|---|---|
| 后端框架 | Next.js 全栈（非 NestJS） | 全栈 TS、DX 最佳、单仓库 |
| 仓库结构 | 单仓库（非 monorepo） | 减少维护负担 |
| 接待事务建模 | 混合模式（独立表） | 关系完整 + 强类型 |
| 随行人员 | MeetingGuest 层主从 | 同一人多重身份 |
| 嘉宾端 Token | 有状态 + HMAC + Redis | 可吊销 |
| 陪同端 | 与嘉宾端统一架构 | 按 entourageRole 渲染 |
| 司机端 | 独立入口 | 司机不一定是 Guest |
| 状态通信 | 轮询（非 WebSocket） | 简单可靠 |
| 部署 | Docker Compose（非 K8s） | 单组织内部 |
