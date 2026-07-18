# Task Plan: 补充审计缺失内容

## Goal

根据审计报告，系统性补充 CMMS 项目中所有设计但未实现的功能。

## Current State

- 核心 10 个领域模块全部实现（Guest/Meeting/Agenda/Reception/Transport/Lodging/Catering/Gift/Companion/Fee）
- 字典系统、导航标签页、嘉宾端门户、资源管理、用户管理已完成
- 审计发现 17 个功能缺失/不连通

## Phases

### Phase 1: 核心业务逻辑修复 (HIGH)

- [ ] **1.1 审计日志自动记录** — 在所有 Server Action 的 create/update/delete 操作中调用 logAction()
  - Files: app/actions/*.actions.ts (10 files)
  - Pattern: import logAction, call after successful mutation
  - Est: 1 hour

- [ ] **1.2 费用自动生成钩子** — 任务完成时自动创建 FeeRecord
  - TransportOrder -> COMPLETED: auto fee
  - LodgingOrder -> CHECKED_OUT: auto fee
  - CateringOrder -> FINISHED: auto fee
  - GiftOrder -> DELIVERED: auto fee (unitPrice * qty)
  - Files: lib/domain/{transport,lodging,catering,gift}/service.ts
  - Est: 2 hours

- [ ] **1.3 任务分配 + 我的任务** — 工作人员查看个人任务
  - Add assigneeId to TransportOrder/LodgingOrder/CateringOrder/GiftOrder (Prisma migration)
  - Add "分配给" dropdown in task list UI
  - New page: /my-tasks — 当前用户被分配的所有任务
  - Files: prisma/schema.prisma, app/(staff)/my-tasks/page.tsx, task list components
  - Est: 3 hours

### Phase 2: 重要功能增强 (MEDIUM)

- [ ] **2.1 MeetingStaff 会议角色** — 每场会议分配工作人员角色
  - New model: MeetingStaff (meetingId, userId, role)
  - New enum: MeetingRole (OWNER, RECEPTION_LEAD, RECEPTION_STAFF, TRANSPORT_LEAD, TRANSPORT_STAFF, LODGING_LEAD, CATERING_LEAD, GIFT_LEAD, FINANCE)
  - UI: 会议详情页加"工作人员"标签
  - Files: prisma/schema.prisma, app/(staff)/meetings/[id]/staff/page.tsx
  - Est: 2 hours

- [ ] **2.2 批量操作** — 签到台批量签到 + 接送批量分配
  - Batch check-in: select multiple guests -> check in all
  - Batch transport assign: select multiple orders -> assign same vehicle
  - Files: app/(staff)/meetings/[id]/reception/, transport/
  - Est: 2 hours

- [ ] **2.3 报表导出** — Excel 导出
  - Meeting summary export (guests, tasks, fees)
  - Guest list export
  - Fee report export
  - Files: app/api/reports/export/route.ts, lib/domain/report/exporter.ts
  - Est: 2 hours

- [ ] **2.4 RSVP 管理** — 嘉宾确认/拒绝参会
  - Guest portal: add RSVP confirm/decline buttons
  - Staff UI: show RSVP status in guest list, allow manual update
  - Files: app/guest/[token]/, app/actions/meeting-guest.actions.ts
  - Est: 1 hour

- [ ] **2.5 室友分配 UI** — 住宿管理中分配室友
  - LodgingList: add roommate selector
  - Files: app/(staff)/meetings/[id]/lodging/LodgingList.tsx
  - Est: 1 hour

- [ ] **2.6 司机端日程列表** — 显示当日全部任务
  - Files: app/driver/[token]/page.tsx
  - Est: 1 hour

### Phase 3: 运维安全加固 (LOW)

- [ ] **3.1 字段级脱敏** — VIEWER 看不到完整手机/身份证
  - Prisma extension: mask Guest.phone/idNumber for VIEWER role
  - Files: lib/db/prisma-extensions.ts
  - Est: 1 hour

- [ ] **3.2 速率限制** — 登录防爆破
  - Redis sliding window on /api/auth/callbacks/credentials
  - Files: lib/auth/rate-limit.ts, app/api/auth/
  - Est: 1 hour

- [ ] **3.3 通知系统基础** — 通知模板 + 队列
  - New models: NotificationTemplate, NotificationLog
  - BullMQ notification queue
  - SMS gateway stub (interface only, no real provider)
  - Files: prisma/schema.prisma, lib/notifications/, worker/
  - Est: 3 hours

- [ ] **3.4 备份恢复脚本** — PostgreSQL 备份
  - scripts/backup.sh, scripts/restore.sh
  - docker-compose.prod.yml with hardening
  - Files: scripts/, docker/
  - Est: 1 hour

### Phase 4: 文档同步

- [ ] **4.1 更新所有文档** — CLAUDE.md, README.md, CHANGELOG.md, ARCHITECTURE.md
  - Est: 30 min

## Constraints

- 禁止 WebSocket（用轮询）
- 禁止 emoji
- 禁止渐变 UI
- 禁止 fetch/axios 直调（用 Server Actions）
- 禁止 SelectValue（用手动 span 映射）
- 所有枚举标签走 dict 字典系统

## Decisions

| # | Decision | Rationale |
|---|----------|-----------|
| 1 | 先做 Phase 1（审计+费用+任务分配） | 核心业务逻辑缺陷，影响数据完整性 |
| 2 | MeetingStaff 简化版（不做完整 RBAC） | 先满足"谁负责什么"的基础需求 |
| 3 | 通知系统只做模板+队列（不做真实 SMS） | SMS 网关需要外部签约，先预留接口 |
| 4 | 速率限制用 Redis（已有基础设施） | 不引入新依赖 |

## Errors Encountered

(none yet)
