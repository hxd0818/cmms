'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type {
  CateringOrder,
  DiningTable,
  MeetingGuest,
  Guest,
} from '@/lib/generated/prisma/client';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { assignTable, deleteCateringOrder } from '@/app/actions/catering.actions';
import { toast } from 'sonner';
import { dict } from '@/lib/shared/dictionary';

type OrderWithRelations = CateringOrder & {
  meetingGuest: MeetingGuest & { guest: Guest };
  diningTable: DiningTable | null;
};

const STATUS_COLOR: Record<string, string> = {
  SCHEDULED: 'bg-blue-100 text-blue-800',
  SEATED: 'bg-green-100 text-green-800',
  FINISHED: 'bg-slate-100 text-slate-800',
  CANCELED: 'bg-red-100 text-red-800',
};

interface Props {
  meetingId: string;
  orders: OrderWithRelations[];
  tables: DiningTable[];
}

export function CateringList({ meetingId, orders, tables }: Props) {
  const router = useRouter();
  const [assignDialogFor, setAssignDialogFor] = useState<string | null>(null);
  const [selectedTable, setSelectedTable] = useState('');

  async function onAssign() {
    if (!assignDialogFor || !selectedTable) return;
    const r = await assignTable(assignDialogFor, selectedTable, meetingId);
    if (r.ok) {
      toast.success('已分配餐桌');
      setAssignDialogFor(null);
      setSelectedTable('');
      router.refresh();
    } else {
      toast.error(r.error?.message ?? '分配失败');
    }
  }

  async function onDelete(orderId: string) {
    if (!confirm('确认删除该餐饮订单？')) return;
    const r = await deleteCateringOrder(orderId, meetingId);
    if (r.ok) {
      toast.success('已删除');
      router.refresh();
    } else {
      toast.error(r.error?.message ?? '删除失败');
    }
  }

  return (
    <div className="cmms-card overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>嘉宾</TableHead>
            <TableHead>餐类</TableHead>
            <TableHead>用餐时间</TableHead>
            <TableHead>餐桌</TableHead>
            <TableHead>饮食禁忌</TableHead>
            <TableHead>状态</TableHead>
            <TableHead></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center text-slate-500 py-8">
                暂无餐饮订单
              </TableCell>
            </TableRow>
          ) : (
            orders.map((o) => (
              <TableRow key={o.id}>
                <TableCell className="font-medium">{o.meetingGuest.guest.name}</TableCell>
                <TableCell className="text-sm">{dict.mealType[o.mealType]}</TableCell>
                <TableCell className="text-sm">
                  {new Date(o.mealTime).toLocaleString('zh-CN')}
                </TableCell>
                <TableCell>
                  {o.diningTable ? (
                    <span className="text-sm">
                      {o.diningTable.name}
                      <span className="text-xs text-slate-500 ml-1">
                        ({o.diningTable.capacity}人)
                      </span>
                    </span>
                  ) : (
                    <Button size="sm" variant="outline" onClick={() => setAssignDialogFor(o.id)}>
                      分配餐桌
                    </Button>
                  )}
                </TableCell>
                <TableCell className="text-sm">
                  {o.specialDietary.length > 0 ? o.specialDietary.join(', ') : '-'}
                </TableCell>
                <TableCell>
                  <Badge className={STATUS_COLOR[o.status]} variant="secondary">
                    {dict.cateringStatus[o.status]}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Button size="sm" variant="ghost" onClick={() => onDelete(o.id)}>
                    删除
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      <Dialog open={!!assignDialogFor} onOpenChange={(o) => !o && setAssignDialogFor(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>分配餐桌</DialogTitle>
          </DialogHeader>
          <Select value={selectedTable} onValueChange={(v) => setSelectedTable(v ?? '')}>
            <SelectTrigger>
              <span className={selectedTable ? '' : 'text-stone-400'}>
                {selectedTable
                  ? (() => {
                      const t = tables.find((tb) => tb.id === selectedTable);
                      return t ? `${t.name} (${t.capacity}人)` : selectedTable;
                    })()
                  : '选择餐桌'}
              </span>
            </SelectTrigger>
            <SelectContent>
              {tables.map((t) => (
                <SelectItem key={t.id} value={t.id}>
                  {t.name} ({t.capacity}人 · {dict.tableType[t.type] ?? t.type})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignDialogFor(null)}>
              取消
            </Button>
            <Button onClick={onAssign} disabled={!selectedTable}>
              确认分配
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
