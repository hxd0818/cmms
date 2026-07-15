'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
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
import { guestCreateSchema } from '@/lib/shared/guest';
import { createGuest, updateGuest } from '@/app/actions/guest.actions';
import { toast } from 'sonner';

type FormValues = {
  name: string;
  gender?: string;
  phone?: string;
  email?: string;
  company?: string;
  title?: string;
  level: string;
  avatarUrl?: string;
  idNumber?: string;
  dietaryTags: string[];
  notes?: string;
};

interface Props {
  mode: 'create' | 'edit';
  guestId?: string;
  defaultValues?: Partial<FormValues>;
}

export function GuestForm({ mode, guestId, defaultValues }: Props) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(guestCreateSchema) as never,
    defaultValues: {
      level: 'C',
      dietaryTags: [],
      ...defaultValues,
    } as FormValues,
  });

  const level = watch('level');
  const gender = watch('gender');

  async function onSubmit(data: FormValues) {
    setSubmitting(true);
    try {
      const payload = data as unknown as Record<string, unknown>;
      const result =
        mode === 'create'
          ? await createGuest(payload)
          : await updateGuest(guestId!, payload);

      if (!result.ok) {
        toast.error(result.error?.message ?? '保存失败');
        return;
      }
      toast.success(mode === 'create' ? '创建成功' : '保存成功');
      router.push(`/guests/${result.data!.id}`);
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-w-2xl">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name">姓名 *</Label>
          <Input id="name" {...register('name')} />
          {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
        </div>
        <div>
          <Label htmlFor="gender">性别</Label>
          <Select
            value={gender ?? ''}
            onValueChange={(v) => setValue('gender', v ?? undefined)}
          >
            <SelectTrigger>
              <SelectValue placeholder="请选择" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="MALE">男</SelectItem>
              <SelectItem value="FEMALE">女</SelectItem>
              <SelectItem value="OTHER">其他</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="phone">手机</Label>
          <Input id="phone" {...register('phone')} />
          {errors.phone && <p className="text-xs text-red-500">{errors.phone.message}</p>}
        </div>
        <div>
          <Label htmlFor="email">邮箱</Label>
          <Input id="email" type="email" {...register('email')} />
          {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
        </div>
        <div>
          <Label htmlFor="company">单位</Label>
          <Input id="company" {...register('company')} />
        </div>
        <div>
          <Label htmlFor="title">职务</Label>
          <Input id="title" {...register('title')} />
        </div>
        <div>
          <Label htmlFor="level">等级</Label>
          <Select value={level} onValueChange={(v) => setValue('level', v ?? 'C')}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="VIP_A">VIP-A</SelectItem>
              <SelectItem value="VIP_B">VIP-B</SelectItem>
              <SelectItem value="A">A</SelectItem>
              <SelectItem value="B">B</SelectItem>
              <SelectItem value="C">C</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="idNumber">身份证号</Label>
          <Input id="idNumber" {...register('idNumber')} />
          {errors.idNumber && (
            <p className="text-xs text-red-500">{errors.idNumber.message}</p>
          )}
        </div>
      </div>

      <div>
        <Label htmlFor="notes">备注</Label>
        <Textarea id="notes" {...register('notes')} rows={3} />
      </div>

      <div className="flex gap-2">
        <Button type="submit" disabled={submitting}>
          {submitting ? '保存中...' : mode === 'create' ? '创建' : '保存'}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          取消
        </Button>
      </div>
    </form>
  );
}
