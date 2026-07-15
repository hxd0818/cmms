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
import { createTransportOrder } from '@/app/actions/transport.actions';
import { toast } from 'sonner';

const PICKUP_TYPES = [
  { value: 'AIRPORT', label: '机场' },
  { value: 'TRAINSTATION', label: '火车站' },
  { value: 'HOTEL', label: '酒店' },
  { value: 'VENUE', label: '会议场地' },
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
  const [pickupType, setPickupType] = useState('AIRPORT');
  const [pickupLocation, setPickupLocation] = useState('');
  const [pickupTime, setPickupTime] = useState('');
  const [dropoffLocation, setDropoffLocation] = useState('');
  const [flightNo, setFlightNo] = useState('');

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!meetingGuestId) {
      toast.error('请选择嘉宾');
      return;
    }
    setSubmitting(true);
    const r = await createTransportOrder({
      meetingId,
      meetingGuestId,
      pickupType,
      pickupLocation,
      pickupTime,
      dropoffLocation,
      flightNo: flightNo || undefined,
    });
    setSubmitting(false);
    if (r.ok) {
      toast.success('接送任务已创建');
      setOpen(false);
      setPickupLocation('');
      setPickupTime('');
      setDropoffLocation('');
      setFlightNo('');
      setMeetingGuestId('');
      router.refresh();
    } else {
      toast.error(r.error?.message ?? '创建失败');
    }
  }

  if (!open) {
    return (
      <Button onClick={() => setOpen(true)} variant="outline">
        新增接送任务
      </Button>
    );
  }

  return (
    <form onSubmit={onSubmit} className="bg-white rounded-md border p-4 space-y-3 max-w-3xl">
      <h2 className="text-lg font-semibold">新增接送任务</h2>
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
          <Label htmlFor="pickupType">接送类型 *</Label>
          <Select value={pickupType} onValueChange={(v) => setPickupType(v ?? 'AIRPORT')}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PICKUP_TYPES.map((t) => (
                <SelectItem key={t.value} value={t.value}>
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="pickupLocation">上车地点 *</Label>
          <Input
            id="pickupLocation"
            value={pickupLocation}
            onChange={(e) => setPickupLocation(e.target.value)}
            required
          />
        </div>
        <div>
          <Label htmlFor="pickupTime">接送时间 *</Label>
          <Input
            id="pickupTime"
            type="datetime-local"
            value={pickupTime}
            onChange={(e) => setPickupTime(e.target.value)}
            required
          />
        </div>
        <div>
          <Label htmlFor="dropoffLocation">下车地点 *</Label>
          <Input
            id="dropoffLocation"
            value={dropoffLocation}
            onChange={(e) => setDropoffLocation(e.target.value)}
            required
          />
        </div>
        <div>
          <Label htmlFor="flightNo">航班 / 车次</Label>
          <Input
            id="flightNo"
            value={flightNo}
            onChange={(e) => setFlightNo(e.target.value)}
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
