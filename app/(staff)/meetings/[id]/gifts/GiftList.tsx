'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { GiftOrder, Gift, MeetingGuest, Guest } from '@/lib/generated/prisma/client';
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
import { deliverGiftOrder, deleteGiftOrder } from '@/app/actions/gift.actions';
import { toast } from 'sonner';
import { dict } from '@/lib/shared/dictionary';

type OrderWithRelations = Omit<GiftOrder, 'gift'> & {
  gift: Omit<Gift, 'unitPrice'> & { unitPrice: number | null };
  meetingGuest: MeetingGuest & { guest: Guest };
};

const STATUS_COLOR: Record<string, string> = {
  PENDING: 'bg-amber-100 text-amber-800',
  DELIVERED: 'bg-green-100 text-green-800',
  CANCELED: 'bg-red-100 text-red-800',
};

interface Props {
  meetingId: string;
  orders: OrderWithRelations[];
}

export function GiftList({ meetingId, orders }: Props) {
  const router = useRouter();
  const [delivering, setDelivering] = useState<string | null>(null);

  async function onDeliver(orderId: string) {
    if (!confirm('确认发放该礼品？发放后库存将减少。')) return;
    setDelivering(orderId);
    const r = await deliverGiftOrder(orderId, meetingId);
    setDelivering(null);
    if (r.ok) {
      toast.success('礼品已发放');
      router.refresh();
    } else {
      toast.error(r.error?.message ?? '发放失败');
    }
  }

  async function onDelete(orderId: string) {
    if (!confirm('确认删除该礼品订单？')) return;
    const r = await deleteGiftOrder(orderId, meetingId);
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
            <TableHead>礼品</TableHead>
            <TableHead>数量</TableHead>
            <TableHead>状态</TableHead>
            <TableHead>发放时间</TableHead>
            <TableHead></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-slate-500 py-8">
                暂无礼品订单
              </TableCell>
            </TableRow>
          ) : (
            orders.map((o) => (
              <TableRow key={o.id}>
                <TableCell className="font-medium">{o.meetingGuest.guest.name}</TableCell>
                <TableCell className="text-sm">{o.gift.name}</TableCell>
                <TableCell className="text-sm">{o.quantity}</TableCell>
                <TableCell>
                  <Badge className={STATUS_COLOR[o.status]} variant="secondary">
                    {dict.giftStatus[o.status]}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm">
                  {o.deliveredAt ? new Date(o.deliveredAt).toLocaleString('zh-CN') : '-'}
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    {o.status === 'PENDING' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onDeliver(o.id)}
                        disabled={delivering === o.id}
                      >
                        {delivering === o.id ? '发放中...' : '发放'}
                      </Button>
                    )}
                    <Button size="sm" variant="ghost" onClick={() => onDelete(o.id)}>
                      删除
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
