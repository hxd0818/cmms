'use client';

import { useRouter } from 'next/navigation';
import { AssignmentBoard, type BoardItem } from '@/components/shared/AssignmentBoard';
import { assignVehicle } from '@/app/actions/transport.actions';
import { dict } from '@/lib/shared/dictionary';
import { getBadgeStyle } from '@/lib/shared/badge-colors';
import { toast } from 'sonner';

interface OrderData {
  id: string;
  guestName: string;
  level: string;
  pickupType: string;
  pickupLocation: string;
  dropoffLocation: string;
  pickupTime: string;
}

interface VehicleData {
  id: string;
  plateNo: string;
  type: string;
  capacity: number;
  driverName: string;
  driverPhone: string;
  belongs: string | null;
}

export function TransportBoard({
  meetingId,
  orders,
  vehicles,
}: {
  meetingId: string;
  orders: OrderData[];
  vehicles: VehicleData[];
}) {
  const router = useRouter();

  const leftItems: BoardItem[] = orders.map((o) => ({
    id: o.id,
    title: o.guestName,
    subtitle: o.pickupLocation + ' -> ' + o.dropoffLocation,
    meta: new Date(o.pickupTime).toLocaleString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
    badge: { text: o.level, className: getBadgeStyle(o.level) },
  }));

  const rightItems: BoardItem[] = vehicles.map((v) => ({
    id: v.id,
    title: v.plateNo,
    subtitle: v.driverName + ' ' + v.driverPhone + (v.belongs ? ' · ' + v.belongs : ''),
    badge: { text: dict.vehicleType[v.type] ?? v.type, className: 'bg-stone-100 text-stone-500' },
    meta: v.capacity + ' 座',
  }));

  async function onAssign(orderIds: string[], vehicleId: string) {
    let ok = 0;
    let fail = 0;
    for (const id of orderIds) {
      const r = await assignVehicle(id, vehicleId, meetingId);
      if (r.ok) ok++;
      else fail++;
    }
    if (fail > 0 && ok > 0) {
      toast.success('已分配 ' + ok + ' 项，' + fail + ' 项失败（可能座位不足）');
      return { ok: true };
    }
    if (fail > 0 && ok === 0) {
      return { ok: false, error: '分配失败（座位不足或其他错误）' };
    }
    return { ok: true };
  }

  return (
    <AssignmentBoard
      leftTitle="待分配订单"
      leftItems={leftItems}
      rightTitle="可用车辆"
      rightItems={rightItems}
      leftSearchPlaceholder="搜索嘉宾..."
      rightSearchPlaceholder="搜索车牌/司机..."
      onAssign={onAssign}
    />
  );
}
