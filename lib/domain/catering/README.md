# Catering Domain Module

## Responsibility

- 餐饮订单管理（CateringOrder）
- 餐桌资源池（DiningTable）
- 桌位分配与容量检测
- 特殊饮食标签（从 Guest.dietaryTags 同步）

## Structure

- `service.ts` - Business logic
- `repository.ts` - Data access
- `types.ts` - Types

## Dependencies

- meeting-guest module
- dining-table resource module
