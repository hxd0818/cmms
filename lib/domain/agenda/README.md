# Agenda Domain Module

## Responsibility
- 议程项 CRUD
- 场地与时间排期
- 议程冲突检测（同一演讲嘉宾时间重叠）
- 演讲嘉宾关联

## Structure
- `service.ts` - Business logic
- `repository.ts` - Data access
- `types.ts` - Types

## Dependencies
- meeting module
- meeting-guest module
