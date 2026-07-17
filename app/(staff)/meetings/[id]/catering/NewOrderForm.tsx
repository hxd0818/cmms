'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select';
import { createCateringOrder } from '@/app/actions/catering.actions';
import { toast } from 'sonner';
import { dict } from '@/lib/shared/dictionary';

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
  const [mealType, setMealType] = useState('LUNCH');
  const [mealTime, setMealTime] = useState('');
  const [notes, setNotes] = useState('');

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!meetingGuestId) {
      toast.error('请选择嘉宾');
      return;
    }
    if (!mealTime) {
      toast.error('请填写用餐时间');
      return;
    }
    setSubmitting(true);
    const r = await createCateringOrder({
      meetingId,
      meetingGuestId,
      mealType,
      mealTime,
      notes: notes || undefined,
    });
    setSubmitting(false);
    if (r.ok) {
      toast.success('餐饮订单已创建');
      setOpen(false);
      setMeetingGuestId('');
      setMealType('LUNCH');
      setMealTime('');
      setNotes('');
      router.refresh();
    } else {
      toast.error(r.error?.message ?? '创建失败');
    }
  }

  if (!open) {
    return (
      <Button onClick={() => setOpen(true)} variant="outline">
        新增餐饮订单
      </Button>
    );
  }

  return (
    <form onSubmit={onSubmit} className="cmms-card p-4 space-y-3 max-w-3xl">
      <h2 className="text-lg font-semibold">新增餐饮订单</h2>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="guest">嘉宾 *</Label>
          <Select value={meetingGuestId} onValueChange={(v) => setMeetingGuestId(v ?? '')}>
            <SelectTrigger>
              <span className={meetingGuestId ? '' : 'text-stone-400'}>
                {meetingGuestId
                  ? (guests.find((g) => g.id === meetingGuestId)?.name ?? meetingGuestId)
                  : '选择会议嘉宾'}
              </span>
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
          <Label htmlFor="mealType">餐类 *</Label>
          <Select value={mealType} onValueChange={(v) => setMealType(v ?? 'LUNCH')}>
            <SelectTrigger>
              <span className={mealType ? '' : 'text-stone-400'}>
                {mealType ? (dict.mealType[mealType] ?? mealType) : '选择餐类'}
              </span>
            </SelectTrigger>
            <SelectContent>
              {Object.entries(dict.mealType).map(([v, l]) => (
                <SelectItem key={v} value={v}>
                  {l}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="mealTime">用餐时间 *</Label>
          <Input
            id="mealTime"
            type="datetime-local"
            value={mealTime}
            onChange={(e) => setMealTime(e.target.value)}
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
