'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { meetingCreateSchema } from '@/lib/shared/meeting';
import { createMeeting, updateMeeting } from '@/app/actions/meeting.actions';
import { toast } from 'sonner';

type FormValues = {
  name: string;
  code: string;
  startAt: string;
  endAt: string;
  venue?: string;
  description?: string;
};

interface Props {
  mode: 'create' | 'edit';
  meetingId?: string;
  defaultValues?: Partial<FormValues>;
}

export function MeetingForm({ mode, meetingId, defaultValues }: Props) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(meetingCreateSchema) as never,
    defaultValues: {
      name: '',
      code: '',
      ...defaultValues,
    },
  });

  async function onSubmit(data: FormValues) {
    setSubmitting(true);
    try {
      const result =
        mode === 'create'
          ? await createMeeting(data as Record<string, unknown>)
          : await updateMeeting(meetingId!, data as Record<string, unknown>);

      if (!result.ok) {
        toast.error(result.error?.message ?? '保存失败');
        return;
      }
      toast.success(mode === 'create' ? '创建成功' : '保存成功');
      router.push(`/meetings/${result.data!.id}`);
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-w-2xl">
      <div>
        <Label htmlFor="name">会议名称 *</Label>
        <Input id="name" {...register('name')} />
        {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
      </div>
      <div>
        <Label htmlFor="code">会议编号 *（仅大写字母、数字、连字符）</Label>
        <Input id="code" placeholder="如 XX-2026" {...register('code')} />
        {errors.code && <p className="text-xs text-red-500">{errors.code.message}</p>}
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="startAt">开始时间 *</Label>
          <Input id="startAt" type="datetime-local" {...register('startAt')} />
          {errors.startAt && <p className="text-xs text-red-500">{errors.startAt.message}</p>}
        </div>
        <div>
          <Label htmlFor="endAt">结束时间 *</Label>
          <Input id="endAt" type="datetime-local" {...register('endAt')} />
          {errors.endAt && <p className="text-xs text-red-500">{errors.endAt.message}</p>}
        </div>
      </div>
      <div>
        <Label htmlFor="venue">场地</Label>
        <Input id="venue" {...register('venue')} />
      </div>
      <div>
        <Label htmlFor="description">会议说明</Label>
        <Textarea id="description" rows={3} {...register('description')} />
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
