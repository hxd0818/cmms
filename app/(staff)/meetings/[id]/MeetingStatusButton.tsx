'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { updateMeetingStatus } from '@/app/actions/meeting.actions';
import { toast } from 'sonner';
import type { MeetingStatus } from '@/lib/generated/prisma/enums';

const VALID_TRANSITIONS: Record<string, string[]> = {
  DRAFT: ['PLANNING', 'CANCELED'],
  PLANNING: ['ONGOING', 'CANCELED'],
  ONGOING: ['COMPLETED', 'CANCELED'],
  COMPLETED: [],
  CANCELED: [],
};

const STATUS_LABEL: Record<string, string> = {
  DRAFT: '草稿',
  PLANNING: '筹备中',
  ONGOING: '进行中',
  COMPLETED: '已结束',
  CANCELED: '已取消',
};

export function MeetingStatusButton({
  meetingId,
  currentStatus,
}: {
  meetingId: string;
  currentStatus: string;
}) {
  const router = useRouter();
  const [target, setTarget] = useState<string>('');
  const [updating, setUpdating] = useState(false);

  const allowedTargets = VALID_TRANSITIONS[currentStatus] ?? [];

  async function onTransition() {
    if (!target) return;
    setUpdating(true);
    const result = await updateMeetingStatus(meetingId, target as MeetingStatus);
    setUpdating(false);
    if (result.ok) {
      toast.success(`已切换到「${STATUS_LABEL[target]}」`);
      setTarget('');
      router.refresh();
    } else {
      toast.error(result.error?.message ?? '状态切换失败');
    }
  }

  if (allowedTargets.length === 0) {
    return (
      <Button variant="outline" disabled title="无可切换状态">
        当前状态不可变更
      </Button>
    );
  }

  return (
    <div className="flex gap-2 items-center">
      <Select value={target} onValueChange={(v) => setTarget(v ?? '')}>
        <SelectTrigger className="w-32">
          <SelectValue placeholder="切换状态" />
        </SelectTrigger>
        <SelectContent>
          {allowedTargets.map((s) => (
            <SelectItem key={s} value={s}>
              {STATUS_LABEL[s]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button onClick={onTransition} disabled={!target || updating}>
        {updating ? '处理中...' : '应用'}
      </Button>
    </div>
  );
}
