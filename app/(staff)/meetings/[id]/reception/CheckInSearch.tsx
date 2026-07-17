'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { checkIn, markNoShow } from '@/app/actions/reception.actions';
import { toast } from 'sonner';
import { dict } from '@/lib/shared/dictionary';

interface PendingGuest {
  id: string;
  name: string;
  company: string | null;
  level: string;
}

export function CheckInSearch({ pending }: { pending: PendingGuest[] }) {
  const [query, setQuery] = useState('');
  const [acting, setActing] = useState<string | null>(null);
  const router = useRouter();

  const filtered = query
    ? pending.filter((g) => g.name.includes(query) || (g.company ?? '').includes(query))
    : pending;

  async function onCheckIn(id: string, name: string) {
    setActing(id);
    const r = await checkIn(id);
    setActing(null);
    if (r.ok) {
      toast.success(`已签到: ${name}`);
      router.refresh();
    } else {
      toast.error(r.error?.message ?? '签到失败');
    }
  }

  async function onNoShow(id: string, name: string) {
    if (!confirm(`标记「${name}」未到？`)) return;
    setActing(id);
    const r = await markNoShow(id);
    setActing(null);
    if (r.ok) {
      toast.success(`已标记未到: ${name}`);
      router.refresh();
    } else {
      toast.error(r.error?.message ?? '操作失败');
    }
  }

  return (
    <div className="cmms-card p-4">
      <h2 className="text-lg font-semibold mb-3">搜索嘉宾签到</h2>
      <Input
        placeholder="输入姓名或单位搜索"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="mb-3"
      />
      {filtered.length === 0 ? (
        <p className="text-sm text-slate-500 text-center py-4">
          {query ? '无匹配结果' : '全部已签到'}
        </p>
      ) : (
        <div className="max-h-80 overflow-auto space-y-2">
          {filtered.slice(0, 20).map((g) => (
            <div
              key={g.id}
              className="flex items-center justify-between p-2 rounded border hover:bg-slate-50"
            >
              <div className="flex items-center gap-2">
                <span className="font-medium">{g.name}</span>
                <Badge variant="outline">{dict.guestLevel[g.level] ?? g.level}</Badge>
                {g.company && <span className="text-xs text-slate-500">{g.company}</span>}
              </div>
              <div className="flex gap-1">
                <Button
                  size="sm"
                  onClick={() => onCheckIn(g.id, g.name)}
                  disabled={acting === g.id}
                >
                  签到
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onNoShow(g.id, g.name)}
                  disabled={acting === g.id}
                >
                  未到
                </Button>
              </div>
            </div>
          ))}
          {filtered.length > 20 && (
            <p className="text-xs text-slate-500 text-center pt-2">仅显示前 20 位，请细化搜索</p>
          )}
        </div>
      )}
    </div>
  );
}
