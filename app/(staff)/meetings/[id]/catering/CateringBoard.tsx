'use client';

import { useRouter } from 'next/navigation';
import { AssignmentBoard, type BoardItem } from '@/components/shared/AssignmentBoard';
import { assignTable } from '@/app/actions/catering.actions';
import { dict } from '@/lib/shared/dictionary';
import { toast } from 'sonner';

interface OrderData {
  id: string;
  guestName: string;
  mealType: string;
  mealTime: string;
  dietaryTags: string[];
}

interface TableData {
  id: string;
  name: string;
  capacity: number;
  type: string;
  occupiedCount: number;
}

export function CateringBoard({
  meetingId,
  orders,
  tables,
}: {
  meetingId: string;
  orders: OrderData[];
  tables: TableData[];
}) {
  const router = useRouter();

  const leftItems: BoardItem[] = orders.map((o) => ({
    id: o.id,
    title: o.guestName,
    subtitle: o.dietaryTags.length > 0 ? '禁忌: ' + o.dietaryTags.join(', ') : undefined,
    meta: formatMealTime(o.mealTime),
    badge: {
      text: dict.mealType[o.mealType] ?? o.mealType,
      className: 'bg-stone-100 text-stone-500',
    },
  }));

  const rightItems: BoardItem[] = tables.map((t) => {
    const full = t.occupiedCount >= t.capacity;
    return {
      id: t.id,
      title: t.name,
      subtitle: dict.tableType[t.type] ?? t.type,
      badge: {
        text: t.capacity + ' 人桌',
        className: 'bg-stone-100 text-stone-500',
      },
      meta: full
        ? '已满 ' + t.occupiedCount + '/' + t.capacity
        : t.occupiedCount + '/' + t.capacity,
      disabled: full,
    };
  });

  async function onAssign(orderIds: string[], tableId: string) {
    let ok = 0;
    let fail = 0;
    for (const id of orderIds) {
      const r = await assignTable(id, tableId, meetingId);
      if (r.ok) ok++;
      else fail++;
    }
    if (fail > 0 && ok > 0) {
      toast.success('已分配 ' + ok + ' 项，' + fail + ' 项失败（可能超出容量）');
      return { ok: true };
    }
    if (fail > 0 && ok === 0) {
      return { ok: false, error: '分配失败（餐桌容量不足或其他错误）' };
    }
    return { ok: true };
  }

  return (
    <AssignmentBoard
      leftTitle="待分配订单"
      leftItems={leftItems}
      rightTitle="可用餐桌"
      rightItems={rightItems}
      leftSearchPlaceholder="搜索嘉宾..."
      rightSearchPlaceholder="搜索桌名..."
      onAssign={onAssign}
    />
  );
}

function formatMealTime(d: string): string {
  return new Date(d).toLocaleString('zh-CN', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
