'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { createGiftOrder } from '@/app/actions/gift.actions';
import { toast } from 'sonner';

export function NewOrderForm({
  meetingId,
  guests,
  gifts,
}: {
  meetingId: string;
  guests: Array<{ id: string; name: string }>;
  gifts: Array<{ id: string; name: string; stock: number }>;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [meetingGuestId, setMeetingGuestId] = useState('');
  const [giftId, setGiftId] = useState('');
  const [quantity, setQuantity] = useState('1');

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!meetingGuestId) {
      toast.error('请选择嘉宾');
      return;
    }
    if (!giftId) {
      toast.error('请选择礼品');
      return;
    }
    setSubmitting(true);
    const r = await createGiftOrder({
      meetingId,
      meetingGuestId,
      giftId,
      quantity: parseInt(quantity, 10) || 1,
    });
    setSubmitting(false);
    if (r.ok) {
      toast.success('礼品订单已创建');
      setOpen(false);
      setMeetingGuestId('');
      setGiftId('');
      setQuantity('1');
      router.refresh();
    } else {
      toast.error(r.error?.message ?? '创建失败');
    }
  }

  if (!open) {
    return (
      <Button onClick={() => setOpen(true)} variant="outline">
        新增礼品订单
      </Button>
    );
  }

  return (
    <form onSubmit={onSubmit} className="cmms-card p-4 space-y-3 max-w-3xl">
      <h2 className="text-lg font-semibold">新增礼品订单</h2>
      <div className="grid grid-cols-3 gap-4">
        <div>
          <Label htmlFor="guest">嘉宾 *</Label>
          <Select value={meetingGuestId} onValueChange={(v) => setMeetingGuestId(v ?? '')}>
            <SelectTrigger>
              <SelectValue placeholder="选择会议嘉宾" />
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
          <Label htmlFor="gift">礼品 *</Label>
          <Select value={giftId} onValueChange={(v) => setGiftId(v ?? '')}>
            <SelectTrigger>
              <SelectValue placeholder="选择礼品" />
            </SelectTrigger>
            <SelectContent>
              {gifts.map((g) => (
                <SelectItem key={g.id} value={g.id}>
                  {g.name} (库存 {g.stock})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="quantity">数量 *</Label>
          <Input
            id="quantity"
            type="number"
            min="1"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            required
          />
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
