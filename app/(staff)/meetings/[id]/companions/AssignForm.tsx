'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select';
import { assignCompanion } from '@/app/actions/companion.actions';
import { toast } from 'sonner';
import { dict } from '@/lib/shared/dictionary';

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
              <span className={meetingGuestId ? '' : 'text-stone-400'}>
                {meetingGuestId
                  ? (guests.find((g) => g.id === meetingGuestId)?.name ?? meetingGuestId)
                  : '选择会议嘉宾'}
              </span>
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
              <span className={companionId ? '' : 'text-stone-400'}>
                {companionId
                  ? (() => {
                      const c = companions.find((cp) => cp.id === companionId);
                      return c ? `${c.name} (${c.role})` : companionId;
                    })()
                  : '选择陪同'}
              </span>
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
              <span className={assignmentScope ? '' : 'text-stone-400'}>
                {assignmentScope
                  ? (dict.assignmentScope[assignmentScope] ?? assignmentScope)
                  : '选择范围'}
              </span>
            </SelectTrigger>
            <SelectContent>
              {Object.entries(dict.assignmentScope).map(([v, l]) => (
                <SelectItem key={v} value={v}>
                  {l}
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
