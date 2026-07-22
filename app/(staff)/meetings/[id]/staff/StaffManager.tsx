'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select';
import { addStaff, removeStaff, updateStaffRole } from '@/app/actions/meeting-staff.actions';
import { issueManagerToken } from '@/app/actions/guest-manager.actions';
import { copyToClipboard } from '@/lib/utils/clipboard';
import { dict } from '@/lib/shared/dictionary';
import { toast } from 'sonner';
import { UserPlus, Trash2, Link2 } from 'lucide-react';

interface StaffItem {
  id: string;
  role: string;
  createdAt: string;
  user: { id: string; name: string; email: string; role: string };
}

interface UserOption {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface Props {
  meetingId: string;
  staff: StaffItem[];
  users: UserOption[];
}

export function StaffManager({ meetingId, staff, users }: Props) {
  const router = useRouter();
  const [showAdd, setShowAdd] = useState(false);
  const [showManager, setShowManager] = useState(false);
  const [mgrName, setMgrName] = useState('');
  const [mgrPhone, setMgrPhone] = useState('');
  const [mgrScope, setMgrScope] = useState('ASSIGNED');
  const [mgrLoading, setMgrLoading] = useState(false);

  async function onIssueManagerLink() {
    if (!mgrName.trim() || !mgrPhone.trim()) {
      toast.error('请填写姓名和手机号');
      return;
    }
    setMgrLoading(true);
    const r = await issueManagerToken({
      meetingId,
      name: mgrName.trim(),
      phone: mgrPhone.trim(),
      scope: mgrScope,
    });
    setMgrLoading(false);
    if (r.ok && r.data) {
      const url = window.location.origin + r.data.url;
      await copyToClipboard(url);
      toast.success('链接已复制，发给维护人员');
      setShowManager(false);
      setMgrName('');
      setMgrPhone('');
      setMgrScope('ASSIGNED');
    } else {
      toast.error(r.error?.message ?? '生成失败');
    }
  }

  async function onRemove(userId: string, name: string) {
    if (!confirm('确认移除「' + name + '」的工作人员身份？')) return;
    const r = await removeStaff(meetingId, userId);
    if (r.ok) {
      toast.success('已移除');
      router.refresh();
    } else {
      toast.error(r.error?.message ?? '移除失败');
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            setShowManager(!showManager);
            setShowAdd(false);
          }}
        >
          <Link2 size={14} className="mr-1" /> 嘉宾维护链接
        </Button>
        <Button
          size="sm"
          onClick={() => {
            setShowAdd(!showAdd);
            setShowManager(false);
          }}
        >
          <UserPlus size={14} className="mr-1" /> 添加工作人员
        </Button>
      </div>

      {showManager && (
        <div className="cmms-card p-4 space-y-3 max-w-lg">
          <h3 className="text-sm font-semibold">生成嘉宾维护链接</h3>
          <p className="text-xs text-stone-400">维护人员通过链接在手机端录入嘉宾信息，无需登录</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-stone-400">姓名 *</Label>
              <Input
                className="h-8 mt-1"
                value={mgrName}
                onChange={(e) => setMgrName(e.target.value)}
              />
            </div>
            <div>
              <Label className="text-xs text-stone-400">手机号 *</Label>
              <Input
                className="h-8 mt-1"
                type="tel"
                value={mgrPhone}
                onChange={(e) => setMgrPhone(e.target.value)}
                placeholder="11 位"
              />
            </div>
          </div>
          <div>
            <Label className="text-xs text-stone-400">权限范围</Label>
            <Select value={mgrScope} onValueChange={(v) => setMgrScope(v ?? 'ASSIGNED')}>
              <SelectTrigger className="h-8 mt-1 w-48">
                <span>{mgrScope === 'ALL' ? '查看全部嘉宾' : '只看自己添加的'}</span>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ASSIGNED">只看自己添加的</SelectItem>
                <SelectItem value="ALL">查看全部嘉宾</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={onIssueManagerLink} disabled={mgrLoading}>
              {mgrLoading ? '生成中...' : '生成并复制链接'}
            </Button>
            <Button size="sm" variant="outline" onClick={() => setShowManager(false)}>
              取消
            </Button>
          </div>
        </div>
      )}

      {showAdd && (
        <AddStaffForm
          meetingId={meetingId}
          users={users}
          existingUserIds={new Set(staff.map((s) => s.user.id))}
          onDone={() => {
            setShowAdd(false);
            router.refresh();
          }}
          onCancel={() => setShowAdd(false)}
        />
      )}

      <div className="cmms-card overflow-hidden">
        <div className="divide-y divide-stone-100">
          {staff.length === 0 ? (
            <p className="text-sm text-stone-400 text-center py-8">暂无工作人员，点击右上角添加</p>
          ) : (
            staff.map((s) => (
              <StaffRow
                key={s.id}
                staff={s}
                meetingId={meetingId}
                onRemove={onRemove}
                onRoleChanged={() => router.refresh()}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function StaffRow({
  staff,
  meetingId,
  onRemove,
  onRoleChanged,
}: {
  staff: StaffItem;
  meetingId: string;
  onRemove: (userId: string, name: string) => void;
  onRoleChanged: () => void;
}) {
  const [role, setRole] = useState(staff.role);
  const [saving, setSaving] = useState(false);

  async function onRoleChange(newRole: string) {
    const prev = role;
    setRole(newRole);
    setSaving(true);
    const r = await updateStaffRole({
      meetingId,
      userId: staff.user.id,
      role: newRole,
    });
    setSaving(false);
    if (r.ok) {
      toast.success('角色已更新');
      onRoleChanged();
    } else {
      setRole(prev);
      toast.error(r.error?.message ?? '更新失败');
    }
  }

  return (
    <div className="flex items-center justify-between px-4 py-3 hover:bg-stone-50">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center text-xs font-bold text-stone-500">
          {staff.user.name.charAt(0)}
        </div>
        <div>
          <p className="text-sm font-medium">{staff.user.name}</p>
          <p className="text-xs text-stone-400">{staff.user.email}</p>
        </div>
        <Badge variant="outline" className="text-xs text-stone-400">
          {dict.systemRole[staff.user.role] ?? staff.user.role}
        </Badge>
      </div>
      <div className="flex items-center gap-2">
        <Select value={role} onValueChange={(v) => v && onRoleChange(v)}>
          <SelectTrigger className="h-8 w-32 text-xs">
            <span>{dict.meetingRole[role] ?? role}</span>
          </SelectTrigger>
          <SelectContent>
            {Object.entries(dict.meetingRole).map(([v, l]) => (
              <SelectItem key={v} value={v}>
                {l}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <button
          onClick={() => onRemove(staff.user.id, staff.user.name)}
          className="text-stone-300 hover:text-red-500 p-1"
          disabled={saving}
        >
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  );
}

function AddStaffForm({
  meetingId,
  users,
  existingUserIds,
  onDone,
  onCancel,
}: {
  meetingId: string;
  users: UserOption[];
  existingUserIds: Set<string>;
  onDone: () => void;
  onCancel: () => void;
}) {
  const [userId, setUserId] = useState('');
  const [role, setRole] = useState('STAFF');
  const [submitting, setSubmitting] = useState(false);

  const availableUsers = users.filter((u) => !existingUserIds.has(u.id));

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!userId) {
      toast.error('请选择用户');
      return;
    }
    setSubmitting(true);
    const r = await addStaff({ meetingId, userId, role });
    setSubmitting(false);
    if (r.ok) {
      toast.success('已添加工作人员');
      onDone();
    } else {
      toast.error(r.error?.message ?? '添加失败');
    }
  }

  return (
    <form onSubmit={onSubmit} className="cmms-card p-4 space-y-3 max-w-2xl">
      <h3 className="text-sm font-semibold">添加工作人员</h3>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label className="text-xs text-stone-400">用户 *</Label>
          <Select value={userId} onValueChange={(v) => setUserId(v ?? '')}>
            <SelectTrigger className="h-8 mt-1">
              <span className={userId ? '' : 'text-stone-400'}>
                {userId
                  ? (() => {
                      const u = users.find((x) => x.id === userId);
                      return u ? `${u.name} (${u.email})` : userId;
                    })()
                  : '选择用户'}
              </span>
            </SelectTrigger>
            <SelectContent>
              {availableUsers.length === 0 ? (
                <div className="px-2 py-1.5 text-xs text-stone-400">无可添加用户</div>
              ) : (
                availableUsers.map((u) => (
                  <SelectItem key={u.id} value={u.id}>
                    {u.name} ({u.email})
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs text-stone-400">会议角色 *</Label>
          <Select value={role} onValueChange={(v) => setRole(v ?? 'STAFF')}>
            <SelectTrigger className="h-8 mt-1">
              <span>{dict.meetingRole[role] ?? role}</span>
            </SelectTrigger>
            <SelectContent>
              {Object.entries(dict.meetingRole).map(([v, l]) => (
                <SelectItem key={v} value={v}>
                  {l}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="flex gap-2">
        <Button size="sm" type="submit" disabled={submitting || !userId}>
          {submitting ? '添加中...' : '确认添加'}
        </Button>
        <Button size="sm" type="button" variant="outline" onClick={onCancel}>
          取消
        </Button>
      </div>
    </form>
  );
}
