'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select';
import { dict } from '@/lib/shared/dictionary';
import { toast } from 'sonner';
import { UtensilsCrossed, Plus, Trash2 } from 'lucide-react';

interface Table {
  id: string;
  name: string;
  capacity: number;
  type: string;
}

export function DiningTableManager({
  meetingId,
  initialTables,
}: {
  meetingId: string;
  initialTables: Table[];
}) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [capacity, setCapacity] = useState('8');
  const [type, setType] = useState('ROUND');
  const [submitting, setSubmitting] = useState(false);

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const { createDiningTable } = await import('@/app/actions/catering.actions');
      const r = await createDiningTable({
        meetingId,
        name,
        capacity: Number(capacity),
        type: type as never,
      });
      if (r.ok) {
        toast.success('餐桌已添加');
        setShowForm(false);
        setName('');
        setCapacity('8');
        setType('ROUND');
        router.refresh();
      } else {
        toast.error(r.error?.message ?? '添加失败');
      }
    } catch {
      toast.error('操作失败');
    }
    setSubmitting(false);
  }

  async function onDelete(id: string, tableName: string) {
    if (!confirm('确认删除餐桌「' + tableName + '」？')) return;
    try {
      const { deleteDiningTable } = await import('@/app/actions/catering.actions');
      const r = await deleteDiningTable(id, meetingId);
      if (r.ok) {
        toast.success('已删除');
        router.refresh();
      }
    } catch {
      toast.error('删除失败');
    }
  }

  return (
    <div className="cmms-card overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b bg-stone-50">
        <div className="flex items-center gap-2">
          <UtensilsCrossed size={16} className="text-stone-500" />
          <h2 className="text-sm font-semibold text-stone-700">餐桌安排</h2>
          <Badge variant="secondary">{initialTables.length}</Badge>
        </div>
        <Button size="sm" variant="outline" onClick={() => setShowForm(!showForm)}>
          <Plus size={14} className="mr-1" /> 添加餐桌
        </Button>
      </div>

      {showForm && (
        <form
          onSubmit={onCreate}
          className="px-4 py-3 border-b bg-stone-50 flex items-center gap-2"
        >
          <Input
            className="h-7 w-32 text-xs"
            placeholder="桌名（如：主桌）"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <Input
            className="h-7 w-20 text-xs"
            type="number"
            min={1}
            placeholder="容量"
            value={capacity}
            onChange={(e) => setCapacity(e.target.value)}
          />
          <Select value={type} onValueChange={(v) => setType(v ?? 'ROUND')}>
            <SelectTrigger className="h-7 w-28 text-xs">
              <span>{dict.tableType[type] ?? type}</span>
            </SelectTrigger>
            <SelectContent>
              {Object.entries(dict.tableType).map(([v, l]) => (
                <SelectItem key={v} value={v}>
                  {l}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button size="sm" type="submit" disabled={submitting}>
            确认
          </Button>
          <Button size="sm" type="button" variant="outline" onClick={() => setShowForm(false)}>
            取消
          </Button>
        </form>
      )}

      <div className="divide-y divide-stone-100">
        {initialTables.length === 0 ? (
          <p className="text-sm text-stone-400 text-center py-8">暂无餐桌，点击右上角添加</p>
        ) : (
          initialTables.map((t) => (
            <div
              key={t.id}
              className="flex items-center justify-between px-4 py-3 hover:bg-stone-50"
            >
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium">{t.name}</span>
                <Badge variant="outline" className="text-xs">
                  {dict.tableType[t.type] ?? t.type}
                </Badge>
                <span className="text-xs text-stone-400">{t.capacity} 人</span>
              </div>
              <button
                onClick={() => onDelete(t.id, t.name)}
                className="text-stone-300 hover:text-red-500 p-1"
              >
                <Trash2 size={13} />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
