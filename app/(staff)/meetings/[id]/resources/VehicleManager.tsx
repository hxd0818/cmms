'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select';
import { createVehicle, deleteVehicle } from '@/app/actions/vehicle.actions';
import { dict } from '@/lib/shared/dictionary';
import { toast } from 'sonner';
import { Car, Plus, Trash2 } from 'lucide-react';
import type { Vehicle } from '@/lib/generated/prisma/client';

export function VehicleManager({
  meetingId,
  initialVehicles,
}: {
  meetingId: string;
  initialVehicles: Vehicle[];
}) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);

  async function onDelete(id: string, plateNo: string) {
    if (!confirm('确认删除车辆「' + plateNo + '」？')) return;
    const r = await deleteVehicle(id, meetingId);
    if (r.ok) {
      toast.success('已删除');
      router.refresh();
    } else {
      toast.error(r.error?.message ?? '删除失败');
    }
  }

  return (
    <div className="cmms-card overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b bg-stone-50">
        <div className="flex items-center gap-2">
          <Car size={16} className="text-stone-500" />
          <h2 className="text-sm font-semibold text-stone-700">车辆资源</h2>
          <Badge variant="secondary">{initialVehicles.length}</Badge>
        </div>
        <Button size="sm" variant="outline" onClick={() => setShowForm(!showForm)}>
          <Plus size={14} className="mr-1" /> 添加车辆
        </Button>
      </div>

      {showForm && <VehicleForm meetingId={meetingId} onDone={() => setShowForm(false)} />}

      <div className="divide-y divide-stone-100">
        {initialVehicles.length === 0 ? (
          <p className="text-sm text-stone-400 text-center py-8">暂无车辆，点击右上角添加</p>
        ) : (
          initialVehicles.map((v) => (
            <div
              key={v.id}
              className="flex items-center justify-between px-4 py-3 hover:bg-stone-50"
            >
              <div className="flex items-center gap-3">
                <span className="font-mono font-bold text-sm">{v.plateNo}</span>
                <Badge variant="outline" className="text-xs">
                  {dict.vehicleType[v.type]}
                </Badge>
                <span className="text-xs text-stone-400">{v.capacity} 座</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-stone-500">{v.driverName}</span>
                <span className="text-xs text-stone-400 font-mono">{v.driverPhone}</span>
                <button
                  onClick={() => onDelete(v.id, v.plateNo)}
                  className="text-stone-300 hover:text-red-500 p-1"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function VehicleForm({ meetingId, onDone }: { meetingId: string; onDone: () => void }) {
  const router = useRouter();
  const [plateNo, setPlateNo] = useState('');
  const [type, setType] = useState('SEDAN');
  const [capacity, setCapacity] = useState('4');
  const [driverName, setDriverName] = useState('');
  const [driverPhone, setDriverPhone] = useState('');
  const [belongs, setBelongs] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
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
      onDone();
      router.refresh();
    } else {
      toast.error(r.error?.message ?? '添加失败');
    }
  }

  return (
    <form onSubmit={onSubmit} className="px-4 py-4 border-b bg-stone-50 space-y-3">
      <div className="grid grid-cols-3 gap-3">
        <div>
          <Label className="text-xs text-stone-400">车牌号 *</Label>
          <Input
            className="h-8 mt-1"
            value={plateNo}
            onChange={(e) => setPlateNo(e.target.value)}
            required
          />
        </div>
        <div>
          <Label className="text-xs text-stone-400">车型</Label>
          <Select value={type} onValueChange={(v) => setType(v ?? 'SEDAN')}>
            <SelectTrigger className="h-8 mt-1">
              <span>{dict.vehicleType[type] ?? type}</span>
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
          <Label className="text-xs text-stone-400">座位数</Label>
          <Input
            className="h-8 mt-1"
            type="number"
            min={1}
            value={capacity}
            onChange={(e) => setCapacity(e.target.value)}
          />
        </div>
        <div>
          <Label className="text-xs text-stone-400">司机姓名 *</Label>
          <Input
            className="h-8 mt-1"
            value={driverName}
            onChange={(e) => setDriverName(e.target.value)}
            required
          />
        </div>
        <div>
          <Label className="text-xs text-stone-400">司机电话 *</Label>
          <Input
            className="h-8 mt-1"
            value={driverPhone}
            onChange={(e) => setDriverPhone(e.target.value)}
            required
          />
        </div>
        <div>
          <Label className="text-xs text-stone-400">所属车队</Label>
          <Input
            className="h-8 mt-1"
            value={belongs}
            onChange={(e) => setBelongs(e.target.value)}
          />
        </div>
      </div>
      <div className="flex gap-2">
        <Button size="sm" type="submit" disabled={submitting}>
          {submitting ? '创建中...' : '创建'}
        </Button>
        <Button size="sm" type="button" variant="outline" onClick={onDone}>
          取消
        </Button>
      </div>
    </form>
  );
}
