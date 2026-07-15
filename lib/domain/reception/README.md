# Reception Domain Module

## Responsibility
- 现场签到（MeetingGuest.receptionStage 状态机）
- 接待任务清单展示
- 嘉宾 360° 视图聚合（嘉宾全部接待任务一览）
- 任务看板（按未完成/进行中/完成分组）

## Structure
- `service.ts` - Business logic
- `repository.ts` - Data access
- `types.ts` - Types

## Dependencies
- meeting-guest module
- transport / lodging / catering / gift modules (for 360 view)
