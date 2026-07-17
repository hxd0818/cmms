'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select';
import { agendaFormSchema } from '@/lib/shared/agenda';
import { createAgendaItem } from '@/app/actions/agenda.actions';
import { dict } from '@/lib/shared/dictionary';
import { toast } from 'sonner';

type FormValues = {
  title: string;
  type: string;
  startAt: string;
  endAt: string;
  venue?: string;
  notes?: string;
};

interface Props {
  meetingId: string;
  speakerOptions: Array<{ id: string; label: string }>;
}

export function AgendaForm({ meetingId, speakerOptions: _ }: Props) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(agendaFormSchema) as never,
    defaultValues: { type: 'KEYNOTE', title: '', startAt: '', endAt: '' },
  });

  const type = watch('type');

  async function onSubmit(data: FormValues) {
    setSubmitting(true);
    try {
      const result = await createAgendaItem({
        meetingId,
        title: data.title,
        type: data.type,
        startAt: data.startAt,
        endAt: data.endAt,
        venue: data.venue,
        notes: data.notes,
        speakerIds: [],
      });
      if (!result.ok) {
        toast.error(result.error?.message ?? '保存失败');
        return;
      }
      toast.success('议程已创建');
      reset({ title: '', type: 'KEYNOTE', startAt: '', endAt: '' });
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 cmms-card p-4 max-w-3xl">
      <h2 className="text-lg font-semibold">新增议程</h2>
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <Label htmlFor="title">议程标题 *</Label>
          <Input id="title" {...register('title')} />
          {errors.title && <p className="text-xs text-red-500">{errors.title.message}</p>}
        </div>
        <div>
          <Label htmlFor="type">类型 *</Label>
          <Select value={type} onValueChange={(v) => setValue('type', v ?? 'OTHER')}>
            <SelectTrigger>
              <span className={type ? '' : 'text-stone-400'}>
                {type ? (dict.agendaType[type] ?? type) : '选择类型'}
              </span>
            </SelectTrigger>
            <SelectContent>
              {Object.entries(dict.agendaType).map(([v, l]) => (
                <SelectItem key={v} value={v}>
                  {l}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="venue">场地</Label>
          <Input id="venue" {...register('venue')} />
        </div>
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
        <div className="col-span-2">
          <Label htmlFor="notes">备注</Label>
          <Textarea id="notes" rows={2} {...register('notes')} />
        </div>
      </div>
      <Button type="submit" disabled={submitting}>
        {submitting ? '保存中...' : '创建议程'}
      </Button>
    </form>
  );
}
