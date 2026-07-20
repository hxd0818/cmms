'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { GuestSearchSelect } from '@/components/shared/GuestSearchSelect';
import { createLodgingOrder } from '@/app/actions/lodging.actions';
import { toast } from 'sonner';

export function NewOrderForm({
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
  const [checkInAt, setCheckInAt] = useState('');
  const [checkOutAt, setCheckOutAt] = useState('');
  const [specialRequests, setSpecialRequests] = useState('');

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!meetingGuestId) {
      toast.error('请选择嘉宾');
      return;
    }
    if (!checkInAt || !checkOutAt) {
      toast.error('请填写入住和退房时间');
      return;
    }
    setSubmitting(true);
    const r = await createLodgingOrder({
      meetingId,
      meetingGuestId,
      checkInAt,
      checkOutAt,
      specialRequests: specialRequests || undefined,
    });
    setSubmitting(false);
    if (r.ok) {
      toast.success('住宿订单已创建');
      setOpen(false);
      setMeetingGuestId('');
      setCheckInAt('');
      setCheckOutAt('');
      setSpecialRequests('');
      router.refresh();
    } else {
      toast.error(r.error?.message ?? '创建失败');
    }
  }

  if (!open) {
    return (
      <Button onClick={() => setOpen(true)} variant="outline">
        新增住宿订单
      </Button>
    );
  }

  return (
    <form onSubmit={onSubmit} className="cmms-card p-4 space-y-3 max-w-3xl">
      <h2 className="text-lg font-semibold">新增住宿订单</h2>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="guest">嘉宾 *</Label>
          <GuestSearchSelect guests={guests} value={meetingGuestId} onChange={setMeetingGuestId} />
        </div>
        <div>
          <Label htmlFor="checkInAt">入住时间 *</Label>
          <Input
            id="checkInAt"
            type="datetime-local"
            value={checkInAt}
            onChange={(e) => setCheckInAt(e.target.value)}
            required
          />
        </div>
        <div>
          <Label htmlFor="checkOutAt">退房时间 *</Label>
          <Input
            id="checkOutAt"
            type="datetime-local"
            value={checkOutAt}
            onChange={(e) => setCheckOutAt(e.target.value)}
            required
          />
        </div>
        <div className="col-span-2">
          <Label htmlFor="specialRequests">特殊需求</Label>
          <Textarea
            id="specialRequests"
            value={specialRequests}
            onChange={(e) => setSpecialRequests(e.target.value)}
            rows={2}
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
