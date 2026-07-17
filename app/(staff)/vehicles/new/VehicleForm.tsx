'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select';
import { vehicleCreateSchema } from '@/lib/shared/transport';
import { createVehicle } from '@/app/actions/vehicle.actions';
import { toast } from 'sonner';
import { dict } from '@/lib/shared/dictionary';

type FormValues = {
  plateNo: string;
  type: string;
  capacity: number;
  driverName: string;
  driverPhone: string;
  belongs?: string;
};

export function VehicleForm() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(vehicleCreateSchema) as never,
    defaultValues: { type: 'SEDAN', capacity: 4 },
  });

  const type = watch('type');

  async function onSubmit(data: FormValues) {
    setSubmitting(true);
    try {
      const r = await createVehicle({
        ...data,
        capacity: Number(data.capacity),
      });
      if (!r.ok) {
        toast.error(r.error?.message ?? '保存失败');
        return;
      }
      toast.success('车辆已创建');
      router.push('/vehicles');
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-w-2xl">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="plateNo">车牌号 *</Label>
          <Input id="plateNo" placeholder="如 京A12345" {...register('plateNo')} />
          {errors.plateNo && <p className="text-xs text-red-500">{errors.plateNo.message}</p>}
        </div>
        <div>
          <Label htmlFor="type">车辆类型 *</Label>
          <Select value={type} onValueChange={(v) => setValue('type', v ?? 'OTHER')}>
            <SelectTrigger>
              <span className={type ? '' : 'text-stone-400'}>
                {type ? (dict.vehicleType[type] ?? type) : '选择类型'}
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
          <Label htmlFor="capacity">容量（座位数）*</Label>
          <Input
            id="capacity"
            type="number"
            min={1}
            max={60}
            {...register('capacity', { valueAsNumber: true })}
          />
          {errors.capacity && <p className="text-xs text-red-500">{errors.capacity.message}</p>}
        </div>
        <div>
          <Label htmlFor="belongs">所属车队</Label>
          <Input id="belongs" {...register('belongs')} />
        </div>
        <div>
          <Label htmlFor="driverName">司机姓名 *</Label>
          <Input id="driverName" {...register('driverName')} />
          {errors.driverName && <p className="text-xs text-red-500">{errors.driverName.message}</p>}
        </div>
        <div>
          <Label htmlFor="driverPhone">司机手机 *</Label>
          <Input id="driverPhone" {...register('driverPhone')} />
          {errors.driverPhone && (
            <p className="text-xs text-red-500">{errors.driverPhone.message}</p>
          )}
        </div>
      </div>
      <div className="flex gap-2">
        <Button type="submit" disabled={submitting}>
          {submitting ? '保存中...' : '创建'}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          取消
        </Button>
      </div>
    </form>
  );
}
