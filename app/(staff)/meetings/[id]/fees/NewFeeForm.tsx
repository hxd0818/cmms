'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { createFeeRecord } from '@/app/actions/fee.actions';
import { toast } from 'sonner';

const CATEGORIES = [
  { value: 'TRANSPORT', label: '交通' },
  { value: 'LODGING', label: '住宿' },
  { value: 'MEAL', label: '餐饮' },
  { value: 'GIFT', label: '礼品' },
  { value: 'OTHER', label: '其他' },
];

export function NewFeeForm({
  meetingId,
  guests,
}: {
  meetingId: string;
  guests: Array<{ id: string; name: string }>;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [meetingGuestId, setMeetingGuestId] = useState('');
  const [category, setCategory] = useState('OTHER');
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!amount || parseFloat(amount) < 0) {
      toast.error('请输入有效金额');
      return;
    }
    setSubmitting(true);
    const r = await createFeeRecord({
      meetingId,
      meetingGuestId: meetingGuestId || undefined,
      category,
      amount: parseFloat(amount),
      notes: notes || undefined,
    });
    setSubmitting(false);
    if (r.ok) {
      toast.success('费用记录已创建');
      setOpen(false);
      setMeetingGuestId('');
      setCategory('OTHER');
      setAmount('');
      setNotes('');
      router.refresh();
    } else {
      toast.error(r.error?.message ?? '创建失败');
    }
  }

  if (!open) {
    return (
      <Button onClick={() => setOpen(true)} variant="outline">
        新增费用
      </Button>
    );
  }

  return (
    <form onSubmit={onSubmit} className="cmms-card p-4 space-y-3 max-w-3xl">
      <h2 className="text-lg font-semibold">新增费用</h2>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="guest">关联嘉宾</Label>
          <Select value={meetingGuestId} onValueChange={(v) => setMeetingGuestId(v ?? '')}>
            <SelectTrigger>
              <SelectValue placeholder="可选" />
            </SelectTrigger>
            <SelectContent>
              {guests.map((g) => (
                <SelectItem key={g.id} value={g.id}>
                  {g.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="category">费用类别 *</Label>
          <Select value={category} onValueChange={(v) => setCategory(v ?? 'OTHER')}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((c) => (
                <SelectItem key={c.value} value={c.value}>
                  {c.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="amount">金额 (元) *</Label>
          <Input
            id="amount"
            type="number"
            min="0"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
          />
        </div>
        <div className="col-span-2">
          <Label htmlFor="notes">备注</Label>
          <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
        </div>
      </div>
      <div className="flex gap-2">
        <Button type="submit" disabled={submitting}>
          {submitting ? '创建中...' : '创建'}
        </Button>
        <Button type="button" variant="outline" onClick={() => setOpen(false)}>
          取消
        </Button>
      </div>
    </form>
  );
}
