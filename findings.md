# Findings: 审计结果

## Audit Summary (2026-07-18)

Agent 全面对比了设计文档与实际代码，发现 17 个缺失项。

## High Severity (核心业务逻辑缺陷)

### 1. 审计日志空转

- **问题**: `lib/audit/logger.ts` 的 `logAction()` 函数存在但从未被任何 Server Action 调用
- **影响**: 审计日志表永远为空，无法追溯操作
- **修复**: 在 app/actions/ 下所有 create/update/delete 操作成功后调用 logAction()

### 2. 费用不自动生成

- **问题**: 设计要求 TransportOrder->COMPLETED / LodgingOrder->CHECKED_OUT / CateringOrder->FINISHED / GiftOrder->DELIVERED 时自动创建 FeeRecord
- **现状**: 费用只能手动录入，任务完成后不会自动产生费用记录
- **影响**: 费用统计不完整，需要人工补录
- **修复**: 在各 service 的状态机转换方法中加 feeService.create() 调用

### 3. 无任务分配机制

- **问题**: TransportOrder/LodgingOrder/CateringOrder/GiftOrder 没有 assigneeId 字段
- **影响**: 工作人员无法查看"我负责哪些任务"
- **修复**: 加 assigneeId + 建 /my-tasks 页面

## Medium Severity (重要功能缺失)

### 4. MeetingStaff 未建

- 模型不存在，会议级角色（OWNER/RECEPTION_LEAD 等）无法分配
- abilities.ts 引用了 'MeetingStaff' subject 但无对应 model

### 5. 通知系统完全缺失

- 无 NotificationTemplate / NotificationLog 模型
- 无 SMS 网关、无通知队列、无通知管理 UI

### 6. 报表导出缺失

- 有 report service（统计数据）但无 Excel 导出
- 无 /reports 页面

### 7. 批量操作缺失

- 签到逐个操作，无批量签到
- 接送逐个分配，无批量分配

### 8. 嘉宾端无写操作

- 嘉宾端纯只读，不能确认 RSVP
- 无 app/guest/[token]/actions.ts

### 9. RSVP 状态不可用

- 字段在 schema 里但无 UI / Action 修改

### 10. 室友分配无 UI

- roommateIds 字段存在但无入口

### 11. 司机端只显示单任务

- 设计要求显示当日全部任务列表

### 12. 陪同端门户缺失

- 设计有三端（嘉宾/陪同/司机），陪同端未建

## Low Severity (运维/安全)

### 13. 字段级脱敏未实现

- VIEWER 可看到完整手机/身份证（解密后无脱敏）

### 14. 速率限制未实现

- 无登录防爆破、无 API 限流

### 15. 备份恢复脚本缺失

- 无 backup.sh / restore.sh

### 16. Sentry 监控未集成

- 无错误上报

### 17. Docker Compose prod 未配置

- 只有 dev 版，无生产硬化版

## What IS Solidly Implemented

- Guest 模块（完整，含 Excel 导入）
- Meeting 模块（状态机、CRUD）
- MeetingGuest（随行层级、规格继承）
- Agenda（演讲嘉宾冲突检测，12 种类型）
- Reception（签到、Kanban 5s 轮询）
- Transport（拼车容量检测，7 态状态机）
- Lodging（日期重叠检测，6 态状态机）
- Catering（餐桌容量检测）
- Gift（库存事务）
- Token 系统（HMAC、可吊销、审计）
- 嘉宾端只读门户
- 司机端单任务门户
- 字典系统（DB 可配置）
- 用户管理
- 资源管理（per-meeting）
- 导航标签页
- Dashboard
- 字段加密 AES-256-GCM
