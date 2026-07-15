# Lodging Domain Module

## Responsibility

- 住宿订单管理（LodgingOrder）
- 酒店与房间资源池（Hotel, HotelRoom）
- 房间冲突检测（同一房间日期重叠）
- 状态机：UNASSIGNED → RESERVED → CHECKED_IN → CHECKED_OUT
- 同住人匹配

## Structure

- `service.ts` - Business logic
- `repository.ts` - Data access
- `types.ts` - Types

## Dependencies

- meeting-guest module
- hotel/room resource module
