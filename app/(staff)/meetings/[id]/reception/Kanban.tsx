'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect, useCallback } from 'react';
import type { MeetingGuest, Guest } from '@/lib/generated/prisma/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { markDeparted, promoteToInHouse, batchCheckIn } from '@/app/actions/reception.actions';
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

export function Kanban({ meetingId, initial }: Props) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [batching, setBatching] = useState(false);

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function onBatchCheckIn() {
    if (selected.size === 0) return;
    setBatching(true);
    const r = await batchCheckIn(Array.from(selected), meetingId);
    setBatching(false);
    if (r.ok) {
      toast.success(`批量签到 ${r.data?.count} 位嘉宾`);
      setSelected(new Set());
      router.refresh();
    } else {
      toast.error(r.error?.message ?? '批量签到失败');
    }
  }

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
    {
      title: dict.receptionStage.NOT_ARRIVED ?? 'NOT_ARRIVED',
      color: 'bg-stone-50',
      items: initial.notArrived,
    },
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
    {
      title: (dict.receptionStage.DEPARTED ?? '') + ' / ' + (dict.receptionStage.NO_SHOW ?? ''),
      color: 'bg-stone-50',
      items: initial.departed,
    },
  ];

  return (
    <div className="space-y-3">
      {/* Batch bar */}
      {selected.size > 0 && (
        <div className="flex items-center gap-3 px-4 py-2 rounded-lg bg-stone-800 text-white">
          <span className="text-sm">已选 {selected.size} 位嘉宾</span>
          <Button size="sm" onClick={onBatchCheckIn} disabled={batching} className="ml-auto">
            {batching ? '签到中...' : '批量签到'}
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setSelected(new Set())} className="text-white/70">
            取消
          </Button>
        </div>
      )}
      <div className="grid grid-cols-4 gap-4">
        {columns.map((col, colIdx) => (
          <div key={col.title} className={`rounded-md ${col.color} p-3`}>
            <h3 className="text-sm font-semibold mb-3 text-slate-700">
              {col.title} ({col.items.length})
            </h3>
            <div className="space-y-2">
              {col.items.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-4">暂无</p>
              ) : (
                col.items.map((mg) => {
                  const isNotArrived = colIdx === 0;
                  const isSelected = selected.has(mg.id);
                  return (
                    <div
                      key={mg.id}
                      className={`bg-white rounded p-2 shadow-sm ${isSelected ? 'ring-2 ring-stone-800' : ''}`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-1.5">
                          {isNotArrived && (
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleSelect(mg.id)}
                              className="rounded"
                            />
                          )}
                          <span className="font-medium text-sm">{mg.guest.name}</span>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {dict.guestLevel[mg.levelOverride ?? mg.guest.level] ?? (mg.levelOverride ?? mg.guest.level)}
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
                  );
                })
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
