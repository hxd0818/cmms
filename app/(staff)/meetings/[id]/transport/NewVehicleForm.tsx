'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select';
import { createVehicle } from '@/app/actions/vehicle.actions';
import { toast } from 'sonner';
import { dict } from '@/lib/shared/dictionary';

export function NewVehicleForm({ meetingId }: { meetingId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [plateNo, setPlateNo] = useState('');
  const [type, setType] = useState('SEDAN');
  const [capacity, setCapacity] = useState('4');
  const [driverName, setDriverName] = useState('');
  const [driverPhone, setDriverPhone] = useState('');
  const [belongs, setBelongs] = useState('');

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!plateNo || !driverName || !driverPhone) {
      toast.error('请填写车牌号、司机姓名和电话');
      return;
    }
    setSubmitting(true);
    const r = await createVehicle({
      meetingId,
      plateNo,
      type,
      capacity: Number(capacity),
      driverName,
      driverPhone,
      belongs: belongs || undefined,
    });
    setSubmitting(false);
    if (r.ok) {
      toast.success('车辆已添加');
      setOpen(false);
      setPlateNo('');
      setType('SEDAN');
      setCapacity('4');
      setDriverName('');
      setDriverPhone('');
      setBelongs('');
      router.refresh();
    } else {
      toast.error(r.error?.message ?? '添加失败');
    }
  }

  if (!open) {
    return (
      <Button onClick={() => setOpen(true)} variant="outline">
        新增车辆
      </Button>
    );
  }

  return (
    <form onSubmit={onSubmit} className="cmms-card p-4 space-y-3 max-w-3xl">
      <h2 className="text-lg font-semibold">新增车辆</h2>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="plateNo">车牌号 *</Label>
          <Input
            id="plateNo"
            value={plateNo}
            onChange={(e) => setPlateNo(e.target.value)}
            required
          />
        </div>
        <div>
          <Label>车型 *</Label>
          <Select value={type} onValueChange={(v) => setType(v ?? 'SEDAN')}>
            <SelectTrigger>
              <span className={type ? '' : 'text-stone-400'}>
                {type ? (dict.vehicleType[type] ?? type) : '选择车型'}
              </span>
            </SelectTrigger>
            <SelectContent>
              {Object.entries(dict.vehicleType).map(([v, l]) => (
                <SelectItem key={v} value={v}>
                  {l}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="capacity">座位数 *</Label>
          <Input
            id="capacity"
            type="number"
            min={1}
            max={60}
            value={capacity}
            onChange={(e) => setCapacity(e.target.value)}
            required
          />
        </div>
        <div>
          <Label htmlFor="driverName">司机姓名 *</Label>
          <Input
            id="driverName"
            value={driverName}
            onChange={(e) => setDriverName(e.target.value)}
            required
          />
        </div>
        <div>
          <Label htmlFor="driverPhone">司机电话 *</Label>
          <Input
            id="driverPhone"
            value={driverPhone}
            onChange={(e) => setDriverPhone(e.target.value)}
            placeholder="11 位手机号"
            required
          />
        </div>
        <div>
          <Label htmlFor="belongs">所属车队</Label>
          <Input id="belongs" value={belongs} onChange={(e) => setBelongs(e.target.value)} />
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
