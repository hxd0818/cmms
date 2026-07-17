'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useCallback } from 'react';
import type { MeetingGuest, Guest } from '@/lib/generated/prisma/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { markDeparted, promoteToInHouse } from '@/app/actions/reception.actions';
import { dict } from '@/lib/shared/dictionary';
import { toast } from 'sonner';

type MG = MeetingGuest & { guest: Guest };

interface KanbanData {
  notArrived: MG[];
  checkedIn: MG[];
  inHouse: MG[];
  departed: MG[];
}

interface Props {
  meetingId: string;
  initial: KanbanData;
}

export function Kanban({ initial }: Props) {
  const router = useRouter();

  // Poll every 5 seconds for live updates (no WebSocket per project rules)
  const refresh = useCallback(() => {
    router.refresh();
  }, [router]);

  useEffect(() => {
    const id = setInterval(refresh, 5000);
    return () => clearInterval(id);
  }, [refresh]);

  async function onAction(action: 'promote' | 'depart', id: string, name: string) {
    const fn = action === 'promote' ? promoteToInHouse : markDeparted;
    const r = await fn(id);
    if (r.ok) {
      toast.success(`${action === 'promote' ? '已入场' : '已离场'}: ${name}`);
      refresh();
    } else {
      toast.error(r.error?.message ?? '操作失败');
    }
  }

  const columns: Array<{
    title: string;
    color: string;
    items: MG[];
    action?: { type: 'promote' | 'depart'; label: string };
  }> = [
    { title: dict.receptionStage.NOT_ARRIVED ?? 'NOT_ARRIVED', color: 'bg-stone-50', items: initial.notArrived },
    {
      title: dict.receptionStage.CHECKED_IN ?? 'CHECKED_IN',
      color: 'bg-teal-50',
      items: initial.checkedIn,
      action: { type: 'promote', label: '入场' },
    },
    {
      title: dict.receptionStage.IN_HOUSE ?? 'IN_HOUSE',
      color: 'bg-green-50',
      items: initial.inHouse,
      action: { type: 'depart', label: '离场' },
    },
    { title: (dict.receptionStage.DEPARTED ?? '') + ' / ' + (dict.receptionStage.NO_SHOW ?? ''), color: 'bg-stone-50', items: initial.departed },
  ];

  return (
    <div className="grid grid-cols-4 gap-4">
      {columns.map((col) => (
        <div key={col.title} className={`rounded-md ${col.color} p-3`}>
          <h3 className="text-sm font-semibold mb-3 text-slate-700">
            {col.title} ({col.items.length})
          </h3>
          <div className="space-y-2">
            {col.items.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-4">暂无</p>
            ) : (
              col.items.map((mg) => (
                <div key={mg.id} className="bg-white rounded p-2 shadow-sm">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-sm">{mg.guest.name}</span>
                    <Badge variant="outline" className="text-xs">
                      {mg.levelOverride ?? mg.guest.level}
                    </Badge>
                  </div>
                  {mg.guest.company && <p className="text-xs text-slate-500">{mg.guest.company}</p>}
                  {col.action && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="mt-2 w-full"
                      onClick={() => onAction(col.action!.type, mg.id, mg.guest.name)}
                    >
                      {col.action.label}
                    </Button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
