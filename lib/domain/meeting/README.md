# Meeting Domain Module

## Responsibility
- 会议 CRUD（DRAFT/PLANNING/ONGOING/COMPLETED/CANCELED 状态机）
- 会议-嘉宾关联（MeetingGuest 多对多）
- 议程项管理（AgendaItem）
- 工作人员分配（MeetingStaff）

## Structure
- `service.ts` - Business logic
- `repository.ts` - Data access
- `types.ts` - Types

## Dependencies
- guest module
- prisma client
