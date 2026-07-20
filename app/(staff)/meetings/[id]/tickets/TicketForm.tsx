'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select';
import { GuestSearchSelect } from '@/components/shared/GuestSearchSelect';
import { createTicket } from '@/app/actions/ticket.actions';
import { toast } from 'sonner';
import { dict } from '@/lib/shared/dictionary';

interface Props {
  meetingId: string;
  guests: Array<{ id: string; name: string }>;
}

export function TicketForm({ meetingId, guests }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [meetingGuestId, setMeetingGuestId] = useState('');
  const [ticketType, setTicketType] = useState<'FLIGHT' | 'TRAIN'>('FLIGHT');
  const [tripNo, setTripNo] = useState('');
  const [departureCity, setDepartureCity] = useState('');
  const [arrivalCity, setArrivalCity] = useState('');
  const [departureAt, setDepartureAt] = useState('');
  const [arrivalAt, setArrivalAt] = useState('');
  const [cabinClass, setCabinClass] = useState('');
  const [price, setPrice] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'COMPANY' | 'SELF'>('COMPANY');
  const [notes, setNotes] = useState('');

  function reset() {
    setMeetingGuestId('');
    setTicketType('FLIGHT');
    setTripNo('');
    setDepartureCity('');
    setArrivalCity('');
    setDepartureAt('');
    setArrivalAt('');
    setCabinClass('');
    setPrice('');
    setPaymentMethod('COMPANY');
    setNotes('');
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!meetingGuestId) {
      toast.error('请选择嘉宾');
      return;
    }
    if (!tripNo || !departureCity || !arrivalCity || !departureAt || !arrivalAt) {
      toast.error('请填写完整的票务信息');
      return;
    }
    setSubmitting(true);
    const r = await createTicket({
      meetingId,
      meetingGuestId,
      ticketType,
      tripNo,
      departureCity,
      arrivalCity,
      departureAt,
      arrivalAt,
      cabinClass: cabinClass || undefined,
      price: price || undefined,
      paymentMethod,
      notes: notes || undefined,
    });
    setSubmitting(false);
    if (r.ok) {
      toast.success('票务订单已创建，已自动生成到达接送任务');
      setOpen(false);
      reset();
      router.refresh();
    } else {
      toast.error(r.error?.message ?? '创建失败');
    }
  }

  if (!open) {
    return (
      <Button onClick={() => setOpen(true)} variant="outline">
        新增票务订单
      </Button>
    );
  }

  const tripNoLabel = ticketType === 'FLIGHT' ? '航班号' : '车次号';

  return (
    <form onSubmit={onSubmit} className="cmms-card p-4 space-y-3 max-w-3xl">
      <h2 className="text-lg font-semibold">新增票务订单</h2>
      <p className="text-xs text-stone-500">
        创建后将自动在「接送」标签页生成一条到达接送任务（
        {ticketType === 'FLIGHT' ? '机场' : '火车站'}接送）。
      </p>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="guest">嘉宾 *</Label>
          <GuestSearchSelect guests={guests} value={meetingGuestId} onChange={setMeetingGuestId} />
        </div>
        <div>
          <Label htmlFor="ticketType">类型 *</Label>
          <Select
            value={ticketType}
            onValueChange={(v) => setTicketType((v as 'FLIGHT' | 'TRAIN') ?? 'FLIGHT')}
          >
            <SelectTrigger>
              <span>{dict.ticketType[ticketType] ?? ticketType}</span>
            </SelectTrigger>
            <SelectContent>
              {Object.entries(dict.ticketType).map(([v, l]) => (
                <SelectItem key={v} value={v}>
                  {l}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="tripNo">{tripNoLabel} *</Label>
          <Input
            id="tripNo"
            value={tripNo}
            onChange={(e) => setTripNo(e.target.value)}
            placeholder={ticketType === 'FLIGHT' ? '如 CA1234' : '如 G123'}
            required
          />
        </div>
        <div>
          <Label htmlFor="departureCity">出发城市 *</Label>
          <Input
            id="departureCity"
            value={departureCity}
            onChange={(e) => setDepartureCity(e.target.value)}
            placeholder="如 北京"
            required
          />
        </div>
        <div>
          <Label htmlFor="arrivalCity">到达城市 *</Label>
          <Input
            id="arrivalCity"
            value={arrivalCity}
            onChange={(e) => setArrivalCity(e.target.value)}
            placeholder="如 上海"
            required
          />
        </div>
        <div>
          <Label htmlFor="departureAt">出发时间 *</Label>
          <Input
            id="departureAt"
            type="datetime-local"
            value={departureAt}
            onChange={(e) => setDepartureAt(e.target.value)}
            required
          />
        </div>
        <div>
          <Label htmlFor="arrivalAt">到达时间 *</Label>
          <Input
            id="arrivalAt"
            type="datetime-local"
            value={arrivalAt}
            onChange={(e) => setArrivalAt(e.target.value)}
            required
          />
        </div>
        <div>
          <Label htmlFor="cabinClass">舱位/席别</Label>
          <Input
            id="cabinClass"
            value={cabinClass}
            onChange={(e) => setCabinClass(e.target.value)}
            placeholder={ticketType === 'FLIGHT' ? '如 经济舱' : '如 二等座'}
          />
        </div>
        <div>
          <Label htmlFor="price">票价 (CNY)</Label>
          <Input
            id="price"
            type="number"
            min="0"
            step="0.01"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="如 1200.00"
          />
        </div>
        <div>
          <Label htmlFor="paymentMethod">付费方式 *</Label>
          <Select
            value={paymentMethod}
            onValueChange={(v) => setPaymentMethod((v as 'COMPANY' | 'SELF') ?? 'COMPANY')}
          >
            <SelectTrigger>
              <span>{dict.paymentMethod[paymentMethod] ?? paymentMethod}</span>
            </SelectTrigger>
            <SelectContent>
              {Object.entries(dict.paymentMethod).map(([v, l]) => (
                <SelectItem key={v} value={v}>
                  {l}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            setOpen(false);
            reset();
          }}
        >
          取消
        </Button>
      </div>
    </form>
  );
}
