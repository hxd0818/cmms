# Gift Domain Module

## Responsibility
- 礼品发放记录（GiftOrder）
- 礼品库存管理（Gift）
- 陪同人员分配（CompanionAssignment）
- 费用记录（FeeRecord，跨模块）

## Structure
- `service.ts` - Business logic
- `repository.ts` - Data access
- `types.ts` - Types

## Dependencies
- meeting-guest module
- gift/companion resource modules
