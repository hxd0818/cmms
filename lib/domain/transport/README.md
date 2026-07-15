# Transport Domain Module

## Responsibility

- 接送订单管理（TransportOrder）
- 车辆资源池（Vehicle）
- 司机任务端（含一次性 token 访问）
- 资源冲突检测（同一车辆时间重叠）
- 状态机：UNASSIGNED → ASSIGNED → EN_ROUTE → PICKED_UP → COMPLETED

## Structure

- `service.ts` - Business logic (含冲突检测)
- `repository.ts` - Data access
- `types.ts` - Types

## Dependencies

- meeting-guest module
- vehicle resource module
