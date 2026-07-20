'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
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
import { updateTicketStatus, deleteTicket } from '@/app/actions/ticket.actions';
import { toast } from 'sonner';
import { dict } from '@/lib/shared/dictionary';
import { getBadgeStyle } from '@/lib/shared/badge-colors';
import type { TicketType, TicketStatus, PaymentMethod } from '@/lib/generated/prisma/enums';

export interface TicketListItem {
  id: string;
  guestName: string;
  ticketType: TicketType;
  tripNo: string;
  departureCity: string;
  arrivalCity: string;
  departureAt: string;
  arrivalAt: string;
  cabinClass: string | null;
  price: number | null;
  paymentMethod: PaymentMethod;
  status: TicketStatus;
  notes: string | null;
  transportOrderId: string | null;
}

const PAYMENT_BADGE_STYLE: Record<PaymentMethod, string> = {
  COMPANY: 'bg-stone-100 text-stone-600',
  SELF: 'bg-amber-50 text-amber-700',
};

const NEXT_STATUSES: Record<TicketStatus, TicketStatus[]> = {
  PENDING: ['BOOKED', 'CANCELED'],
  BOOKED: ['CONFIRMED', 'CANCELED'],
  CONFIRMED: ['TICKETED', 'CANCELED'],
  TICKETED: ['CANCELED'],
  CANCELED: [],
};

interface Props {
  meetingId: string;
  tickets: TicketListItem[];
}

export function TicketList({ meetingId, tickets }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);

  async function onStatusChange(ticketId: string, status: TicketStatus) {
    setBusy(ticketId);
    const r = await updateTicketStatus(ticketId, status, meetingId);
    setBusy(null);
    if (r.ok) {
      toast.success(`状态已切换: ${dict.ticketStatus[status]}`);
      router.refresh();
    } else {
      toast.error(r.error?.message ?? '状态切换失败');
    }
  }

  async function onDelete(ticketId: string) {
    if (!confirm('确认删除该票务订单？关联的接送任务不会被删除。')) return;
    setBusy(ticketId);
    const r = await deleteTicket(ticketId, meetingId);
    setBusy(null);
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
            <TableHead>类型</TableHead>
            <TableHead>航班/车次</TableHead>
            <TableHead>出发 → 到达</TableHead>
            <TableHead>时间</TableHead>
            <TableHead>舱位/席别</TableHead>
            <TableHead>票价</TableHead>
            <TableHead>付费</TableHead>
            <TableHead>状态</TableHead>
            <TableHead>关联接送</TableHead>
            <TableHead></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tickets.length === 0 ? (
            <TableRow>
              <TableCell colSpan={11} className="text-center text-stone-500 py-8">
                暂无票务订单
              </TableCell>
            </TableRow>
          ) : (
            tickets.map((t) => (
              <TableRow key={t.id}>
                <TableCell className="font-medium">{t.guestName}</TableCell>
                <TableCell className="text-sm">{dict.ticketType[t.ticketType]}</TableCell>
                <TableCell className="text-sm font-mono">{t.tripNo}</TableCell>
                <TableCell className="text-sm">
                  {t.departureCity} → {t.arrivalCity}
                </TableCell>
                <TableCell className="text-xs text-stone-600">
                  <div>出发: {new Date(t.departureAt).toLocaleString('zh-CN')}</div>
                  <div>到达: {new Date(t.arrivalAt).toLocaleString('zh-CN')}</div>
                </TableCell>
                <TableCell className="text-sm">{t.cabinClass ?? '-'}</TableCell>
                <TableCell className="text-sm">
                  {t.price != null ? `¥${t.price.toFixed(2)}` : '-'}
                </TableCell>
                <TableCell>
                  <Badge className={PAYMENT_BADGE_STYLE[t.paymentMethod]} variant="secondary">
                    {dict.paymentMethod[t.paymentMethod]}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge className={getBadgeStyle(t.status)} variant="secondary">
                    {dict.ticketStatus[t.status]}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm">
                  {t.transportOrderId ? (
                    <Link
                      href={`/meetings/${meetingId}/transport`}
                      className="text-stone-600 hover:text-stone-900 underline-offset-2 hover:underline"
                    >
                      查看
                    </Link>
                  ) : (
                    <span className="text-stone-400">-</span>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    {(NEXT_STATUSES[t.status] ?? []).length > 0 && (
                      <Select
                        value=""
                        onValueChange={(v) => v && onStatusChange(t.id, v as TicketStatus)}
                        disabled={busy === t.id}
                      >
                        <SelectTrigger className="h-7 w-24 text-xs">
                          <span className="text-stone-400">切换</span>
                        </SelectTrigger>
                        <SelectContent>
                          {(NEXT_STATUSES[t.status] ?? []).map((s) => (
                            <SelectItem key={s} value={s}>
                              {dict.ticketStatus[s]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onDelete(t.id)}
                      disabled={busy === t.id}
                    >
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
