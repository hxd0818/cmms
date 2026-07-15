'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface Props {
  orderId: string;
  status: string;
  token: string;
}

const NEXT_ACTIONS: Record<string, { status: string; label: string }[]> = {
  ASSIGNED: [{ status: 'EN_ROUTE', label: '出发接嘉宾' }],
  EN_ROUTE: [{ status: 'PICKED_UP', label: '已接到嘉宾' }],
  PICKED_UP: [{ status: 'COMPLETED', label: '已送达' }],
};

export function DriverActions({ orderId, status, token }: Props) {
  const [acting, setActing] = useState(false);
  const actions = NEXT_ACTIONS[status] ?? [];

  async function onUpdate(targetStatus: string) {
    setActing(true);
    try {
      const r = await fetch(`/api/driver/${token}/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, status: targetStatus }),
      });
      const result = await r.json();
      if (result.ok) {
        toast.success('状态已更新');
        window.location.reload();
      } else {
        toast.error(result.error?.message ?? '更新失败');
      }
    } finally {
      setActing(false);
    }
  }

  if (actions.length === 0) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
        <p className="text-green-700 font-medium">
          {status === 'COMPLETED' ? '任务已完成' : '当前状态无可用操作'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {actions.map((a) => (
        <Button
          key={a.status}
          className="w-full"
          size="lg"
          disabled={acting}
          onClick={() => onUpdate(a.status)}
        >
          {acting ? '更新中...' : a.label}
        </Button>
      ))}
    </div>
  );
}
