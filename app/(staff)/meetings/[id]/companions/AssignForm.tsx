'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select';
import { GuestSearchSelect } from '@/components/shared/GuestSearchSelect';
import { assignCompanion, createCompanion } from '@/app/actions/companion.actions';
import { dict } from '@/lib/shared/dictionary';
import { toast } from 'sonner';
import { UserPlus } from 'lucide-react';

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
  const [assignOpen, setAssignOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Assign form state
  const [meetingGuestId, setMeetingGuestId] = useState('');
  const [companionId, setCompanionId] = useState('');
  const [assignmentScope, setAssignmentScope] = useState('FULL');

  // Create form state
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newRole, setNewRole] = useState('翻译');
  const [newLanguages, setNewLanguages] = useState('');

  async function onAssign(e: React.FormEvent) {
    e.preventDefault();
    if (!meetingGuestId) {
      toast.error('请选择嘉宾');
      return;
    }
    if (!companionId) {
      toast.error('请选择接待人员');
      return;
    }
    setSubmitting(true);
    const r = await assignCompanion({ meetingId, meetingGuestId, companionId, assignmentScope });
    setSubmitting(false);
    if (r.ok) {
      toast.success('接待已分配');
      setAssignOpen(false);
      setMeetingGuestId('');
      setCompanionId('');
      setAssignmentScope('FULL');
      router.refresh();
    } else {
      toast.error(r.error?.message ?? '分配失败');
    }
  }

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newName) {
      toast.error('请输入姓名');
      return;
    }
    setSubmitting(true);
    const r = await createCompanion({
      name: newName,
      phone: newPhone || undefined,
      languages: newLanguages
        .split(',')
        .map((l) => l.trim())
        .filter(Boolean),
      role: newRole,
    });
    setSubmitting(false);
    if (r.ok) {
      toast.success('接待人员已添加');
      setCreateOpen(false);
      setNewName('');
      setNewPhone('');
      setNewRole('翻译');
      setNewLanguages('');
      router.refresh();
    } else {
      toast.error(r.error?.message ?? '添加失败');
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Button
          onClick={() => {
            setAssignOpen(!assignOpen);
            setCreateOpen(false);
          }}
          variant="outline"
        >
          分配接待
        </Button>
        <Button
          onClick={() => {
            setCreateOpen(!createOpen);
            setAssignOpen(false);
          }}
          variant="outline"
        >
          <UserPlus size={14} className="mr-1" /> 新增接待人员
        </Button>
      </div>

      {/* Create companion form */}
      {createOpen && (
        <form onSubmit={onCreate} className="cmms-card p-4 space-y-3 max-w-3xl">
          <h3 className="text-sm font-semibold text-stone-700">新增接待人员（全局可用）</h3>
          <div className="grid grid-cols-4 gap-3">
            <div>
              <Label className="text-xs text-stone-400">姓名 *</Label>
              <Input
                className="h-8 mt-1"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                required
              />
            </div>
            <div>
              <Label className="text-xs text-stone-400">手机</Label>
              <Input
                className="h-8 mt-1"
                value={newPhone}
                onChange={(e) => setNewPhone(e.target.value)}
                placeholder="11 位手机号"
              />
            </div>
            <div>
              <Label className="text-xs text-stone-400">职务</Label>
              <Input
                className="h-8 mt-1"
                value={newRole}
                onChange={(e) => setNewRole(e.target.value)}
                placeholder="翻译/接待/安保..."
              />
            </div>
            <div>
              <Label className="text-xs text-stone-400">语言能力</Label>
              <Input
                className="h-8 mt-1"
                value={newLanguages}
                onChange={(e) => setNewLanguages(e.target.value)}
                placeholder="英语, 日语"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button size="sm" type="submit" disabled={submitting}>
              {submitting ? '创建中...' : '创建'}
            </Button>
            <Button size="sm" type="button" variant="outline" onClick={() => setCreateOpen(false)}>
              取消
            </Button>
          </div>
        </form>
      )}

      {/* Assign companion form */}
      {assignOpen && (
        <form onSubmit={onAssign} className="cmms-card p-4 space-y-3 max-w-3xl">
          <h3 className="text-sm font-semibold text-stone-700">分配接待到嘉宾</h3>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="guest">嘉宾 *</Label>
              <GuestSearchSelect
                guests={guests}
                value={meetingGuestId}
                onChange={setMeetingGuestId}
              />
            </div>
            <div>
              <Label htmlFor="companion">接待人员 *</Label>
              <Select value={companionId} onValueChange={(v) => setCompanionId(v ?? '')}>
                <SelectTrigger>
                  <span className={companionId ? '' : 'text-stone-400'}>
                    {companionId
                      ? (() => {
                          const c = companions.find((cp) => cp.id === companionId);
                          return c ? c.name + ' (' + c.role + ')' : companionId;
                        })()
                      : '选择接待'}
                  </span>
                </SelectTrigger>
                <SelectContent>
                  {companions.length === 0 ? (
                    <SelectItem value="" disabled>
                      请先新增接待人员
                    </SelectItem>
                  ) : (
                    companions.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name} ({c.role})
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="scope">接待范围 *</Label>
              <Select
                value={assignmentScope}
                onValueChange={(v) => setAssignmentScope(v ?? 'FULL')}
              >
                <SelectTrigger>
                  <span>{dict.assignmentScope[assignmentScope] ?? assignmentScope}</span>
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
            <Button size="sm" type="submit" disabled={submitting}>
              {submitting ? '分配中...' : '确认分配'}
            </Button>
            <Button size="sm" type="button" variant="outline" onClick={() => setAssignOpen(false)}>
              取消
            </Button>
          </div>
          {companions.length === 0 && (
            <p className="text-xs text-amber-600">接待人员库为空，请先点击「新增接待人员」添加</p>
          )}
        </form>
      )}
    </div>
  );
}
