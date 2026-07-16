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
import { assignCompanion } from '@/app/actions/companion.actions';
import { toast } from 'sonner';

const SCOPES = [
  { value: 'FULL', label: '全程陪同' },
  { value: 'MEETING', label: '会议期间' },
  { value: 'DINING', label: '用餐期间' },
  { value: 'TRANSPORT', label: '接送期间' },
  { value: 'LODGING', label: '住宿期间' },
];

export function AssignForm({
  meetingId,
  guests,
  companions,
}: {
  meetingId: string;
  guests: Array<{ id: string; name: string }>;
  companions: Array<{ id: string; name: string; role: string }>;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [meetingGuestId, setMeetingGuestId] = useState('');
  const [companionId, setCompanionId] = useState('');
  const [assignmentScope, setAssignmentScope] = useState('FULL');

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!meetingGuestId) {
      toast.error('请选择嘉宾');
      return;
    }
    if (!companionId) {
      toast.error('请选择陪同人员');
      return;
    }
    setSubmitting(true);
    const r = await assignCompanion({
      meetingId,
      meetingGuestId,
      companionId,
      assignmentScope,
    });
    setSubmitting(false);
    if (r.ok) {
      toast.success('陪同已分配');
      setOpen(false);
      setMeetingGuestId('');
      setCompanionId('');
      setAssignmentScope('FULL');
      router.refresh();
    } else {
      toast.error(r.error?.message ?? '分配失败');
    }
  }

  if (!open) {
    return (
      <Button onClick={() => setOpen(true)} variant="outline">
        分配陪同
      </Button>
    );
  }

  return (
    <form onSubmit={onSubmit} className="cmms-card p-4 space-y-3 max-w-3xl">
      <h2 className="text-lg font-semibold">分配陪同</h2>
      <div className="grid grid-cols-3 gap-4">
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
          <Label htmlFor="companion">陪同人员 *</Label>
          <Select value={companionId} onValueChange={(v) => setCompanionId(v ?? '')}>
            <SelectTrigger>
              <SelectValue placeholder="选择陪同" />
            </SelectTrigger>
            <SelectContent>
              {companions.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name} ({c.role})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="scope">陪同范围 *</Label>
          <Select value={assignmentScope} onValueChange={(v) => setAssignmentScope(v ?? 'FULL')}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SCOPES.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="flex gap-2">
        <Button type="submit" disabled={submitting}>
          {submitting ? '分配中...' : '确认分配'}
        </Button>
        <Button type="button" variant="outline" onClick={() => setOpen(false)}>
          取消
        </Button>
      </div>
    </form>
  );
}
