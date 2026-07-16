'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { MeetingGuest, Guest } from '@/lib/generated/prisma/client';
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
import { deleteFeeRecord } from '@/app/actions/fee.actions';
import { toast } from 'sonner';

type FeeRecordWithGuest = {
  id: string;
  meetingId: string;
  meetingGuestId: string | null;
  category: string;
  amount: unknown;
  currency: string;
  incurredAt: Date;
  notes: string | null;
  createdBy: string;
  createdAt: Date;
  meetingGuest: (MeetingGuest & { guest: Guest }) | null;
};

const CATEGORY_LABEL: Record<string, string> = {
  TRANSPORT: '交通',
  LODGING: '住宿',
  MEAL: '餐饮',
  GIFT: '礼品',
  OTHER: '其他',
};

const CATEGORY_COLOR: Record<string, string> = {
  TRANSPORT: 'bg-blue-100 text-blue-800',
  LODGING: 'bg-purple-100 text-purple-800',
  MEAL: 'bg-orange-100 text-orange-800',
  GIFT: 'bg-pink-100 text-pink-800',
  OTHER: 'bg-slate-100 text-slate-800',
};

interface Props {
  meetingId: string;
  records: FeeRecordWithGuest[];
}

export function FeeList({ meetingId, records }: Props) {
  const router = useRouter();
  const [deleting, setDeleting] = useState<string | null>(null);

  async function onDelete(recordId: string) {
    if (!confirm('确认删除该费用记录？')) return;
    setDeleting(recordId);
    const r = await deleteFeeRecord(recordId, meetingId);
    setDeleting(null);
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
            <TableHead>类别</TableHead>
            <TableHead>金额</TableHead>
            <TableHead>日期</TableHead>
            <TableHead>备注</TableHead>
            <TableHead></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {records.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-slate-500 py-8">
                暂无费用记录
              </TableCell>
            </TableRow>
          ) : (
            records.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="font-medium">{r.meetingGuest?.guest.name ?? '-'}</TableCell>
                <TableCell>
                  <Badge className={CATEGORY_COLOR[r.category]} variant="secondary">
                    {CATEGORY_LABEL[r.category] ?? r.category}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm font-mono">
                  {Number(r.amount).toLocaleString('zh-CN', {
                    style: 'currency',
                    currency: 'CNY',
                  })}
                </TableCell>
                <TableCell className="text-sm">
                  {new Date(r.incurredAt).toLocaleDateString('zh-CN')}
                </TableCell>
                <TableCell className="text-sm">{r.notes ?? '-'}</TableCell>
                <TableCell>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onDelete(r.id)}
                    disabled={deleting === r.id}
                  >
                    {deleting === r.id ? '删除中...' : '删除'}
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
