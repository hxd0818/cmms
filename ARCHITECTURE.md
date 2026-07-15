# Architecture

> 一图读懂 CMMS 系统架构。详细设计见 [docs/plans/2026-07-15-cmms-design.md](./docs/plans/2026-07-15-cmms-design.md)。

## 1. 系统全景

```
┌──────────────────────────────────────────────────────────┐
│           Next.js 16 (App Router) 全栈单体                │
│                                                          │
│  ┌─────────────────┐  ┌──────────────────────────────┐   │
│  │ 工作人员端       │  │ 嘉宾/陪同端     司机端        │   │
│  │ PC + 移动响应式  │  │ (扫码 token)    (链接 token)  │   │
│  │ NextAuth 登录    │  │ 公开路由        公开路由      │   │
│  └────────┬────────┘  └───────────┬──────────────────┘   │
│           │                       │                      │
│           ▼                       ▼                      │
│  ┌────────────────────────────────────────────────────┐  │
│  │   Server Actions + Route Handlers                  │  │
│  │   (app/actions/*.actions.ts)                       │  │
│  └────────────────────┬───────────────────────────────┘  │
│                       │                                  │
│  ┌────────────────────▼───────────────────────────────┐  │
│  │   lib/auth/    CASL 权限 + NextAuth session         │  │
│  │   lib/actions/ utils.ts (auth + validation + error) │  │
│  └────────────────────┬───────────────────────────────┘  │
│                       │                                  │
│  ┌────────────────────▼───────────────────────────────┐  │
│  │   lib/domain/<module>/  8 个领域模块                │  │
│  │   guest | meeting | agenda | reception              │  │
│  │   transport | lodging | catering | gift             │  │
│  │   每个: types.ts + repository.ts + service.ts       │  │
│  └────────────────────┬───────────────────────────────┘  │
│                       │                                  │
│  ┌────────────────────▼───────────────────────────────┐  │
│  │   lib/db/  Prisma 7 client + AES-256-GCM 加密层    │  │
│  └────────────────────┬───────────────────────────────┘  │
└───────────────────────┼──────────────────────────────────┘
                        ▼
           ┌─────────────────────────┐
           │  PostgreSQL 16 (5434)   │
           │  Redis 7 (6381)         │
           └─────────────────────────┘

           ┌─────────────────────────┐
           │  BullMQ Worker (独立进程) │
           │  - Excel 批量导入        │
           │  - 通知批量发送 (Phase 4) │
           │  - 报表异步导出 (Phase 4) │
           └─────────────────────────┘
```

## 2. 核心架构决策

### 2.1 为什么是 Next.js 全栈单体（不是 NestJS 独立后端）

| 维度 | Next.js 全栈 | NestJS 独立后端 |
|---|---|---|
| 类型共享 | 天然共享（同一项目） | 需要 monorepo 或手动同步 |
| 部署复杂度 | 1 个 Node 进程 | 2 个服务 |
| Server Actions | 模板代码极少 | 必须 REST 端点 |
| 中等规模 CRUD 业务 | 完美匹配 | 过度工程 |

CMMS 是 CRUD + 调度型业务，无高并发、无复杂计算，Next.js 全栈是当前最现代、最高效的方案。

### 2.2 为什么是模块化分层（不是 monorepo）

- 单组织内部系统，无多端独立部署需求
- 共享 Zod schema 直接放 `lib/shared/` 即可，无需 monorepo packages
- 8 个领域模块按目录隔离（`lib/domain/<module>/`），架构清晰但不割裂

### 2.3 领域模型的核心：MeetingGuest 作为枢纽

所有接待订单（TransportOrder / LodgingOrder / CateringOrder / GiftOrder）都通过 `meetingGuestId` 关联，**不是** `guestId + meetingId`：

```
Guest (跨会议沉淀) ──┐
                    │
Meeting ────────────┼── MeetingGuest (枢纽)
                    │     ├── TransportOrder
                    │     ├── LodgingOrder
                    │     ├── CateringOrder
                    │     ├── GiftOrder
                    │     └── 自引用随行关系
                    │
Venue / Vehicle / HotelRoom / DiningTable (资源池)
```

**优势**：
- 单一索引（vs 复合索引）
- 强制"嘉宾必须先注册到会议才能分配任务"
- Cascade 删除：删除会议清理所有相关订单
- `receptionStage` 状态在 MeetingGuest 上（每场会议独立）

### 2.4 随行人员：MeetingGuest 层自引用

```prisma
model MeetingGuest {
  primaryMeetingGuestId String?       // 主嘉宾的 MeetingGuest.id
  entourageRole         EntourageRole? // PRIMARY/SECRETARY/...
  levelOverride         GuestLevel?   // 为空则继承主嘉宾
  inheritLodging        Boolean       // 同住 / 邻房
  inheritTransport      Boolean       // 同车
  
  primary     MeetingGuest?  @relation("EntourageRelation", ...)
  subordinates MeetingGuest[] @relation("EntourageRelation", ...)
}
```

**支持的能力**：
- 同一人多身份：张三是 A 会议主讲，B 会议作为部长秘书陪同（两条 MeetingGuest 独立）
- 规格继承：随行人员默认与主嘉宾同等级别
- 批量调度：按主嘉宾分组操作
- 报表去重：`WHERE entourageRole = 'PRIMARY'`

### 2.5 三端 Token 系统（有状态，可吊销）

| 端 | 入口 | 用户 | Token 绑定 |
|---|---|---|---|
| 工作人员端 | NextAuth 登录 | 会务组 | NextAuth Session |
| 嘉宾/陪同端 | `/g/[token]` | 嘉宾 + 陪同 | `GuestAccessToken.meetingGuestId` |
| 司机端 | `/d/[token]` | 外部司机 | `DriverAccessToken.transportOrderId` |

**为什么不用 JWT**：JWT 无状态、不可吊销。嘉宾手机丢失场景下，链接泄露 → 永久泄露。有状态 Token + DB + Redis 可以一键吊销。

### 2.6 字段级加密（AES-256-GCM）

通过 Prisma `$extends` 拦截器：
- 写入时自动加密（`Guest.phone`, `Guest.idNumber`）
- 读取时自动解密
- 每行独立 IV，相同明文产生不同密文
- DB 泄露无法还原原值

## 3. 权限模型

### RBAC 角色

| 角色 | 数据范围 |
|---|---|
| SuperAdmin | 全部 |
| MeetingOwner | 本会议全部 |
| ReceptionLead | 本会议接待任务 |
| ReceptionStaff | 本会议签到（敏感字段脱敏）|
| ResourceCoordinator | 仅自己负责的模块 |
| Viewer | 全部只读 |

### 实现

- 前后端共享：CASL.js（`lib/auth/abilities.ts`）
- 字段级脱敏：Prisma 查询层根据角色动态打码（如 `138****5678`）
- 会议级角色：通过 `MeetingStaff` 表关联 userId + meetingId + role

## 4. 关键状态机

### Meeting
```
DRAFT → PLANNING → ONGOING → COMPLETED
任意阶段 → CANCELED
```

### MeetingGuest.receptionStage
```
NOT_ARRIVED → CHECKED_IN → IN_HOUSE → DEPARTED
              ↓
              NO_SHOW
```

### TransportOrder
```
UNASSIGNED → ASSIGNED → EN_ROUTE → PICKED_UP → COMPLETED
                ↓                              │
            REASSIGNED                         │
任意状态 ←─────────────────────────────────────┘
任意状态 → CANCELED
```

详细见 [docs/plans/2026-07-15-cmms-design.md](./docs/plans/2026-07-15-cmms-design.md) 第 3.6 节。

## 5. 部署拓扑

```
┌──────────────────────────────────────────────────┐
│             Docker Compose (单机)                 │
│                                                  │
│  ┌─────────────┐  ┌─────────────┐  ┌──────────┐ │
│  │ Next.js Web │  │   Worker    │  │  Nginx   │ │
│  │  (port      │  │  (BullMQ)   │  │ (HTTPS)  │ │
│  │   3000 内网)│  │             │  │          │ │
│  └──────┬──────┘  └──────┬──────┘  └──────────┘ │
│         │                │                       │
│  ┌──────▼────────────────▼──────────────────┐    │
│  │  PostgreSQL 16  +  Redis 7               │    │
│  └──────────────────────────────────────────┘    │
└──────────────────────────────────────────────────┘

备份：每日全量 + WAL 持续归档（pg_basebackup + pg_receivewal）
监控：Sentry（错误）+ Pino 结构化日志（应用）
```

**为什么不用 K8s**：单组织内部系统，无弹性扩展需求。Docker Compose 已足够，部署运维简单。

## 6. 数据流示例

### 工作人员创建嘉宾

```
[Form 提交] 
  → Server Action createGuest (app/actions/guest.actions.ts)
  → getContext() 获取 session + ability
  → assertAuthorized(ability, 'create', 'Guest')
  → guestCreateSchema.parse(input) Zod 校验
  → guestService.create(data) 业务规则
    → guestRepository.findByPhone 去重检查
    → guestRepository.create (Prisma $extends 触发加密)
  → revalidatePath('/guests') 重新生成列表
  → 返回 { ok, data: { id } }
  → toast.success + router.push
```

### 嘉宾扫码查看

```
[嘉宾收到短信含 https://cmms.example.com/g/abc123]
  → 浏览器请求 /g/abc123
  → proxy.ts 放行（PUBLIC_PATHS）
  → app/guest/[token]/layout.tsx
    → verifyGuestToken('abc123') HMAC + DB 查询
    → 加载 MeetingGuest + 关联 Guest
    → 根据 entourageRole 渲染不同视图
  → 返回 HTML
```

详细数据流图见设计文档第 3 节。

## 7. 扩展性考虑

### 加新领域模块

按 Guest 模块（Phase 1 参考实现）的范式：
1. `prisma/schema.prisma` 加 model + enum + migration
2. `lib/shared/<module>.ts` 写 Zod schema
3. `lib/domain/<module>/{types,repository,service}.ts` 写三层
4. `lib/auth/abilities.ts` 加 AppSubject
5. `app/actions/<module>.actions.ts` 写 Server Actions
6. `app/(staff)/<module>/` 写 UI
7. `tests/unit/<module>/` + `tests/e2e/<module>.spec.ts` 写测试

### 加新加密字段

在 `lib/db/prisma-extensions.ts` 的 `ENCRYPTED_FIELDS` map 添加即可，无需改其他代码。

### 加新接待任务类型

接待事务用**独立表**（混合模式），不是多态单表。新增类型（如"翻译服务"）就加新表，业务清晰。

## 8. 性能与限制

| 指标 | 目标 | 当前 |
|---|---|---|
| 嘉宾端首屏 | ≤ 2s（4G） | 待测 |
| 工作人员端列表 | ≤ 500ms（1000 嘉宾） | 待测 |
| Excel 导入 1000 行 | ≤ 30s | 已实现（BullMQ 异步） |
| 并发签到 | 100 并发无冲突 | 待测（行锁保证） |
| 可用性 | 99.5% | 单组织内部可接受计划停机 |

## 9. 不做的事情（YAGNI）

- ❌ 不做 monorepo（单仓库足够）
- ❌ 不做微服务（单组织内部用不上）
- ❌ 不做多态单表（接待事务种类有限且稳定）
- ❌ 不做 WebSocket（用 TanStack Query 轮询替代）
- ❌ 不做 GraphQL（REST + Server Actions 足够）
- ❌ 不做 SSR 流式渲染（管理后台不需要 SEO）
- ❌ 不做国际化（暂只支持中文）
- ❌ 不做主题切换（暗色模式等可选，不在 MVP）
