'use client';

import { useRouter } from 'next/navigation';
import { AssignmentBoard, type BoardItem } from '@/components/shared/AssignmentBoard';
import { assignRoom } from '@/app/actions/lodging.actions';
import { dict } from '@/lib/shared/dictionary';
import { getBadgeStyle } from '@/lib/shared/badge-colors';
import { toast } from 'sonner';

interface OrderData {
  id: string;
  guestName: string;
  level: string;
  checkInAt: string;
  checkOutAt: string;
}

interface RoomData {
  id: string;
  hotelName: string;
  roomNumber: string;
  roomType: string;
  status: string;
}

export function LodgingBoard({
  meetingId,
  orders,
  rooms,
}: {
  meetingId: string;
  orders: OrderData[];
  rooms: RoomData[];
}) {
  const router = useRouter();

  const leftItems: BoardItem[] = orders.map((o) => ({
    id: o.id,
    title: o.guestName,
    subtitle: formatStayRange(o.checkInAt, o.checkOutAt),
    badge: { text: o.level, className: getBadgeStyle(o.level) },
  }));

  // Only AVAILABLE or RESERVED rooms can receive new assignments.
  // OCCUPIED and MAINTENANCE rooms are shown disabled for context.
  const rightItems: BoardItem[] = rooms.map((r) => {
    const unavailable = r.status !== 'AVAILABLE' && r.status !== 'RESERVED';
    return {
      id: r.id,
      title: r.roomNumber,
      subtitle: r.hotelName,
      badge: {
        text: dict.roomType[r.roomType] ?? r.roomType,
        className: 'bg-stone-100 text-stone-500',
      },
      meta: dict.roomStatus[r.status] ?? r.status,
      disabled: unavailable,
    };
  });

  async function onAssign(orderIds: string[], roomId: string) {
    let ok = 0;
    let fail = 0;
    for (const id of orderIds) {
      const r = await assignRoom(id, roomId, meetingId);
      if (r.ok) ok++;
      else fail++;
    }
    if (fail > 0 && ok > 0) {
      toast.success('已分配 ' + ok + ' 项，' + fail + ' 项失败');
      return { ok: true };
    }
    if (fail > 0 && ok === 0) {
      return { ok: false, error: '分配失败（房间可能已被占用）' };
    }
    return { ok: true };
  }

  return (
    <AssignmentBoard
      leftTitle="待分配订单"
      leftItems={leftItems}
      rightTitle="可用房间"
      rightItems={rightItems}
      leftSearchPlaceholder="搜索嘉宾..."
      rightSearchPlaceholder="搜索酒店/房号..."
      onAssign={onAssign}
      selectMode="single"
    />
  );
}

function formatStayRange(checkIn: string, checkOut: string): string {
  const fmt = (d: string) =>
    new Date(d).toLocaleString('zh-CN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  return fmt(checkIn) + ' -> ' + fmt(checkOut);
}
