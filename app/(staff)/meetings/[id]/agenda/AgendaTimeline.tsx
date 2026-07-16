'use client';

import { useRouter } from 'next/navigation';
import type { AgendaItem } from '@/lib/generated/prisma/client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { deleteAgendaItem } from '@/app/actions/agenda.actions';
import { toast } from 'sonner';

interface Props {
  items: AgendaItem[];
  meetingId: string;
  speakerOptions: Array<{ id: string; label: string }>;
}

const TYPE_LABEL: Record<string, string> = {
  KEYNOTE: '主旨演讲',
  PANEL: '座谈',
  BREAK: '茶歇',
  MEAL: '用餐',
  TOUR: '参观',
  OTHER: '其他',
};

const TYPE_COLOR: Record<string, string> = {
  KEYNOTE: 'bg-red-100 text-red-800',
  PANEL: 'bg-blue-100 text-blue-800',
  BREAK: 'bg-amber-100 text-amber-800',
  MEAL: 'bg-green-100 text-green-800',
  TOUR: 'bg-purple-100 text-purple-800',
  OTHER: 'bg-slate-100 text-slate-700',
};

export function AgendaTimeline({ items, meetingId }: Props) {
  const router = useRouter();

  async function onDelete(id: string, title: string) {
    if (!confirm(`确认删除议程「${title}」？`)) return;
    const result = await deleteAgendaItem(id, meetingId);
    if (result.ok) {
      toast.success('已删除');
      router.refresh();
    } else {
      toast.error(result.error?.message ?? '删除失败');
    }
  }

  if (items.length === 0) {
    return (
      <div className="cmms-card p-8 text-center text-slate-500">暂无议程，请使用上方表单添加</div>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div key={item.id} className="cmms-card p-4 flex items-start gap-4">
          <div className="flex flex-col items-center text-xs text-slate-500 min-w-20">
            <span className="font-mono">
              {new Date(item.startAt).toLocaleTimeString('zh-CN', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
            <span className="text-slate-300">|</span>
            <span className="font-mono">
              {new Date(item.endAt).toLocaleTimeString('zh-CN', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-medium">{item.title}</h3>
              <Badge className={TYPE_COLOR[item.type]} variant="secondary">
                {TYPE_LABEL[item.type]}
              </Badge>
            </div>
            <div className="text-sm text-slate-500">
              {item.venue && <span>{item.venue} · </span>}
              演讲嘉宾 {item.speakerIds.length} 位{item.notes && <span> · {item.notes}</span>}
            </div>
          </div>
          <Button size="sm" variant="ghost" onClick={() => onDelete(item.id, item.title)}>
            删除
          </Button>
        </div>
      ))}
    </div>
  );
}
