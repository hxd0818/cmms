# Guest Domain Module

## Responsibility
- 嘉宾信息库 CRUD
- 跨会议沉淀的嘉宾档案
- 敏感字段加密（手机号、身份证）
- Excel 批量导入

## Structure
- `service.ts` - Business logic
- `repository.ts` - Data access
- `types.ts` - Types
- `schema.ts` - Zod schemas

## Dependencies
- prisma client (`lib/db/client`)
- field encryption (`lib/db/field-encryption`)
