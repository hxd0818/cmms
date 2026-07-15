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
import { createCateringOrder } from '@/app/actions/catering.actions';
import { toast } from 'sonner';

const MEAL_TYPES = [
  { value: 'WELCOME_BANQUET', label: '欢迎宴' },
  { value: 'FAREWELL', label: '欢送宴' },
  { value: 'LUNCH', label: '午餐' },
  { value: 'DINNER', label: '晚餐' },
  { value: 'BREAKFAST', label: '早餐' },
];

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
    <form onSubmit={onSubmit} className="bg-white rounded-md border p-4 space-y-3 max-w-3xl">
      <h2 className="text-lg font-semibold">新增餐饮订单</h2>
      <div className="grid grid-cols-2 gap-4">
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
          <Label htmlFor="mealType">餐类 *</Label>
          <Select value={mealType} onValueChange={(v) => setMealType(v ?? 'LUNCH')}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MEAL_TYPES.map((t) => (
                <SelectItem key={t.value} value={t.value}>
                  {t.label}
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
