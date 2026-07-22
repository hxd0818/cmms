'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select';
import { addStaff, removeStaff, updateStaffRole } from '@/app/actions/meeting-staff.actions';
import { issueManagerToken, revokeManagerToken, regenerateManagerToken } from '@/app/actions/guest-manager.actions';
import { createCompanion, deleteCompanion, updateCompanion } from '@/app/actions/companion.actions';
import { copyToClipboard } from '@/lib/utils/clipboard';
import { dict } from '@/lib/shared/dictionary';
import { toast } from 'sonner';
import { UserPlus, Trash2, Link2, Share2, Pencil, Plus, LayoutGrid, Check, X, Copy } from 'lucide-react';

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
interface ManagerItem {
  id: string;
  name: string;
  phone: string;
  scope: string;
  revokedAt: string | null;
  accessCount: number;
}
interface CompanionItem {
  id: string;
  name: string;
  role: string;
  phone: string | null;
  languages: string[];
  assigned: boolean;
  count: number;
}
interface Props {
  meetingId: string;
  staff: StaffItem[];
  users: UserOption[];
  managers: ManagerItem[];
  companions: CompanionItem[];
}

export function StaffManager({ meetingId, staff, users, managers, companions }: Props) {
  const router = useRouter();

  // Staff state
  const [showAddStaff, setShowAddStaff] = useState(false);

  // Manager token state
  const [showMgrForm, setShowMgrForm] = useState(false);
  const [mgrName, setMgrName] = useState('');
  const [mgrPhone, setMgrPhone] = useState('');
  const [mgrScope, setMgrScope] = useState('ASSIGNED');
  const [mgrLoading, setMgrLoading] = useState(false);

  // Companion state
  const [showAddCompanion, setShowAddCompanion] = useState(false);
  const [editingCompanion, setEditingCompanion] = useState<string | null>(null);
  const [compName, setCompName] = useState('');
  const [compRole, setCompRole] = useState('');
  const [compPhone, setCompPhone] = useState('');
  const [compLanguages, setCompLanguages] = useState('');

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
      await copyToClipboard(window.location.origin + r.data.url);
      toast.success('链接已复制');
      setShowMgrForm(false);
      setMgrName('');
      setMgrPhone('');
      setMgrScope('ASSIGNED');
      router.refresh();
    } else {
      toast.error(r.error?.message ?? '生成失败');
    }
  }

  async function onCreateCompanion() {
    if (!compName.trim()) {
      toast.error('请输入姓名');
      return;
    }
    const r = await createCompanion({
      name: compName.trim(),
      phone: compPhone.trim() || undefined,
      languages: compLanguages
        .split(',')
        .map((l) => l.trim())
        .filter(Boolean),
      role: compRole.trim() || '接待',
    });
    if (r.ok) {
      toast.success('已添加');
      setShowAddCompanion(false);
      setCompName('');
      setCompRole('');
      setCompPhone('');
      setCompLanguages('');
      router.refresh();
    } else {
      toast.error('添加失败');
    }
  }

  return (
    <div className="space-y-4">
      {/* === Section 1: System Users === */}
      <div className="cmms-card overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2.5 bg-stone-50 border-b">
          <h3 className="text-sm font-semibold text-stone-700">系统用户</h3>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setShowAddStaff(!showAddStaff);
              setShowMgrForm(false);
              setShowAddCompanion(false);
            }}
          >
            <UserPlus size={14} className="mr-1" /> 添加
          </Button>
        </div>
        {showAddStaff && (
          <AddStaffForm
            meetingId={meetingId}
            users={users}
            existingUserIds={new Set(staff.map((s) => s.user.id))}
            onDone={() => {
              setShowAddStaff(false);
              router.refresh();
            }}
            onCancel={() => setShowAddStaff(false)}
          />
        )}
        <div className="divide-y divide-stone-100">
          {staff.length === 0 ? (
            <p className="text-sm text-stone-400 text-center py-6">暂无系统用户</p>
          ) : (
            staff.map((s) => (
              <StaffRow
                key={s.id}
                staff={s}
                meetingId={meetingId}
                onRemove={(id, name) => {
                  if (!confirm('确认移除「' + name + '」？')) return;
                  removeStaff(meetingId, id).then((r) => {
                    if (r.ok) {
                      toast.success('已移除');
                      router.refresh();
                    }
                  });
                }}
                onRoleChanged={() => router.refresh()}
              />
            ))
          )}
        </div>
      </div>

      {/* === Section 2: Guest Managers === */}
      <div className="cmms-card overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2.5 bg-stone-50 border-b">
          <h3 className="text-sm font-semibold text-stone-700">嘉宾维护人员</h3>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setShowMgrForm(!showMgrForm);
              setShowAddStaff(false);
              setShowAddCompanion(false);
            }}
          >
            <Link2 size={14} className="mr-1" /> 生成链接
          </Button>
        </div>
        {showMgrForm && (
          <div className="px-4 py-3 border-b bg-stone-50 space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs text-stone-400">姓名 *</Label>
                <Input
                  className="h-8 mt-0.5 text-xs"
                  value={mgrName}
                  onChange={(e) => setMgrName(e.target.value)}
                />
              </div>
              <div>
                <Label className="text-xs text-stone-400">手机 *</Label>
                <Input
                  className="h-8 mt-0.5 text-xs"
                  type="tel"
                  value={mgrPhone}
                  onChange={(e) => setMgrPhone(e.target.value)}
                  placeholder="11 位"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Label className="text-xs text-stone-400">权限</Label>
              <Select value={mgrScope} onValueChange={(v) => setMgrScope(v ?? 'ASSIGNED')}>
                <SelectTrigger className="h-7 w-40 text-xs">
                  <span>{mgrScope === 'ALL' ? '查看全部嘉宾' : '仅自己添加的'}</span>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ASSIGNED">仅自己添加的</SelectItem>
                  <SelectItem value="ALL">查看全部嘉宾</SelectItem>
                </SelectContent>
              </Select>
              <Button
                size="sm"
                onClick={onIssueManagerLink}
                disabled={mgrLoading}
                className="ml-auto"
              >
                {mgrLoading ? '...' : '生成'}
              </Button>
              <Button size="sm" variant="outline" onClick={() => setShowMgrForm(false)}>
                取消
              </Button>
            </div>
          </div>
        )}
        <div className="divide-y divide-stone-100">
          {managers.length === 0 ? (
            <p className="text-sm text-stone-400 text-center py-6">暂无维护人员</p>
          ) : (
            managers.map((m) => (
              <div key={m.id} className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center text-xs font-bold text-stone-500">
                    {m.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-medium">
                      {m.name}
                      {m.revokedAt && <span className="text-xs text-red-400 ml-1">已吊销</span>}
                    </p>
                    <p className="text-xs text-stone-400">
                      {m.phone} · {m.scope === 'ALL' ? '全权限' : '受限'}
                      {m.accessCount > 0 && ' · 访问 ' + m.accessCount + ' 次'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={async () => {
                      if (!confirm('为「' + m.name + '」重新生成链接？旧链接将失效。')) return;
                      const r = await regenerateManagerToken(m.id, meetingId);
                      if (r.ok && r.data) {
                        await copyToClipboard(window.location.origin + r.data.url);
                        toast.success('新链接已复制');
                        router.refresh();
                      } else {
                        toast.error('生成失败');
                      }
                    }}
                    className="text-stone-400 hover:text-stone-600 p-1.5 rounded hover:bg-stone-100"
                    title="重新生成链接"
                  >
                    <Copy size={14} />
                  </button>
                  {!m.revokedAt && (
                    <button
                      onClick={async () => {
                        if (!confirm('吊销「' + m.name + '」的链接？')) return;
                        const r = await revokeManagerToken(m.id, meetingId);
                        if (r.ok) {
                          toast.success('已吊销');
                          router.refresh();
                        }
                      }}
                      className="text-xs text-red-400 hover:text-red-600 px-2 py-1 rounded hover:bg-red-50"
                    >
                      吊销
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* === Section 3: Companions === */}
      <div className="cmms-card overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2.5 bg-stone-50 border-b">
          <h3 className="text-sm font-semibold text-stone-700">接待人员</h3>
          <div className="flex items-center gap-2">
            <Link
              href={'/meetings/' + meetingId + '/companions?view=board'}
              className="text-xs text-stone-400 hover:text-stone-600 flex items-center gap-1"
            >
              <LayoutGrid size={13} /> 看板
            </Link>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setShowAddCompanion(!showAddCompanion);
                setShowAddStaff(false);
                setShowMgrForm(false);
              }}
            >
              <Plus size={14} className="mr-1" /> 新增
            </Button>
          </div>
        </div>
        {showAddCompanion && (
          <div className="px-4 py-3 border-b bg-stone-50 grid grid-cols-4 gap-2">
            <div>
              <Label className="text-xs text-stone-400">姓名 *</Label>
              <Input
                className="h-8 mt-0.5 text-xs"
                value={compName}
                onChange={(e) => setCompName(e.target.value)}
              />
            </div>
            <div>
              <Label className="text-xs text-stone-400">职务</Label>
              <Input
                className="h-8 mt-0.5 text-xs"
                value={compRole}
                onChange={(e) => setCompRole(e.target.value)}
                placeholder="翻译/接待"
              />
            </div>
            <div>
              <Label className="text-xs text-stone-400">手机</Label>
              <Input
                className="h-8 mt-0.5 text-xs"
                value={compPhone}
                onChange={(e) => setCompPhone(e.target.value)}
              />
            </div>
            <div>
              <Label className="text-xs text-stone-400">语言</Label>
              <Input
                className="h-8 mt-0.5 text-xs"
                value={compLanguages}
                onChange={(e) => setCompLanguages(e.target.value)}
                placeholder="英语"
              />
            </div>
            <div className="col-span-4 flex gap-2">
              <Button size="sm" onClick={onCreateCompanion}>
                添加
              </Button>
              <Button size="sm" variant="outline" onClick={() => setShowAddCompanion(false)}>
                取消
              </Button>
            </div>
          </div>
        )}
        <div className="divide-y divide-stone-100">
          {companions.length === 0 ? (
            <p className="text-sm text-stone-400 text-center py-6">暂无接待人员</p>
          ) : (
            companions.map((c) => (
              <CompanionRow
                key={c.id}
                companion={c}
                editing={editingCompanion === c.id}
                onEdit={() => setEditingCompanion(c.id)}
                onEditCancel={() => setEditingCompanion(null)}
                onSaved={() => {
                  setEditingCompanion(null);
                  router.refresh();
                }}
                onShare={async () => {
                  await copyToClipboard(window.location.origin + '/companion/' + c.id);
                  toast.success('已复制接待链接');
                }}
                onDelete={async () => {
                  if (c.assigned) {
                    toast.error('已分配嘉宾，不可删除');
                    return;
                  }
                  if (!confirm('删除「' + c.name + '」？')) return;
                  const r = await deleteCompanion(c.id);
                  if (r.ok) {
                    toast.success('已删除');
                    router.refresh();
                  }
                }}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// ============ Staff Row ============
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
  async function onRoleChange(newRole: string) {
    const prev = role;
    setRole(newRole);
    const r = await updateStaffRole({ meetingId, userId: staff.user.id, role: newRole });
    if (r.ok) {
      toast.success('角色已更新');
      onRoleChanged();
    } else {
      setRole(prev);
      toast.error('更新失败');
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
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
}

// ============ Add Staff Form ============
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
  const available = users.filter((u) => !existingUserIds.has(u.id));

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
      toast.success('已添加');
      onDone();
    } else {
      toast.error('添加失败');
    }
  }

  return (
    <form onSubmit={onSubmit} className="px-4 py-3 border-b bg-stone-50 grid grid-cols-2 gap-3">
      <div>
        <Label className="text-xs text-stone-400">用户 *</Label>
        <Select value={userId} onValueChange={(v) => setUserId(v ?? '')}>
          <SelectTrigger className="h-8 mt-1">
            <span className={userId ? '' : 'text-stone-400'}>
              {userId ? (users.find((u) => u.id === userId)?.name ?? userId) : '选择用户'}
            </span>
          </SelectTrigger>
          <SelectContent>
            {available.length === 0 ? (
              <div className="px-2 py-1.5 text-xs text-stone-400">无可添加用户</div>
            ) : (
              available.map((u) => (
                <SelectItem key={u.id} value={u.id}>
                  {u.name} ({u.email})
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label className="text-xs text-stone-400">角色 *</Label>
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
      <div className="col-span-2 flex gap-2">
        <Button size="sm" type="submit" disabled={submitting}>
          {submitting ? '...' : '添加'}
        </Button>
        <Button size="sm" type="button" variant="outline" onClick={onCancel}>
          取消
        </Button>
      </div>
    </form>
  );
}

// ============ Companion Row ============
function CompanionRow({
  companion,
  editing,
  onEdit,
  onEditCancel,
  onSaved,
  onShare,
  onDelete,
}: {
  companion: CompanionItem;
  editing: boolean;
  onEdit: () => void;
  onEditCancel: () => void;
  onSaved: () => void;
  onShare: () => void;
  onDelete: () => void;
}) {
  const [name, setName] = useState(companion.name);
  const [role, setRole] = useState(companion.role);
  const [phone, setPhone] = useState(companion.phone ?? '');
  const [languages, setLanguages] = useState(companion.languages.join(', '));
  const [saving, setSaving] = useState(false);

  if (editing) {
    return (
      <div className="px-4 py-3 bg-stone-50 space-y-2">
        <div className="grid grid-cols-4 gap-2">
          <div>
            <Label className="text-xs text-stone-400">姓名</Label>
            <Input
              className="h-7 mt-0.5 text-xs"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div>
            <Label className="text-xs text-stone-400">职务</Label>
            <Input
              className="h-7 mt-0.5 text-xs"
              value={role}
              onChange={(e) => setRole(e.target.value)}
            />
          </div>
          <div>
            <Label className="text-xs text-stone-400">手机</Label>
            <Input
              className="h-7 mt-0.5 text-xs"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
          <div>
            <Label className="text-xs text-stone-400">语言</Label>
            <Input
              className="h-7 mt-0.5 text-xs"
              value={languages}
              onChange={(e) => setLanguages(e.target.value)}
            />
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            onClick={async () => {
              setSaving(true);
              const r = await updateCompanion(companion.id, {
                name,
                phone: phone || undefined,
                role,
                languages: languages
                  .split(',')
                  .map((l) => l.trim())
                  .filter(Boolean),
              });
              setSaving(false);
              if (r.ok) {
                toast.success('已保存');
                onSaved();
              } else toast.error('保存失败');
            }}
            disabled={saving}
          >
            <Check size={13} className="mr-1" />
            {saving ? '...' : '保存'}
          </Button>
          <Button size="sm" variant="outline" onClick={onEditCancel}>
            <X size={13} className="mr-1" />
            取消
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between px-4 py-3 hover:bg-stone-50">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center text-xs font-bold text-stone-500">
          {companion.name.charAt(0)}
        </div>
        <div>
          <p className="text-sm font-medium">{companion.name}</p>
          <p className="text-xs text-stone-400">
            {companion.role}
            {companion.languages.length > 0 && ' · ' + companion.languages.join(', ')}
            {companion.phone && ' · ' + companion.phone}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-1">
        {companion.assigned ? (
          <Badge variant="secondary">{companion.count} 位嘉宾</Badge>
        ) : (
          <span className="text-xs text-stone-300 mr-2">未分配</span>
        )}
        <button
          onClick={onShare}
          className="text-stone-400 hover:text-stone-600 p-1.5 rounded hover:bg-stone-100"
          title="分享"
        >
          <Share2 size={14} />
        </button>
        <button
          onClick={onEdit}
          className="text-stone-400 hover:text-stone-600 p-1.5 rounded hover:bg-stone-100"
          title="编辑"
        >
          <Pencil size={14} />
        </button>
        {!companion.assigned && (
          <button
            onClick={onDelete}
            className="text-stone-300 hover:text-red-500 p-1.5 rounded hover:bg-stone-100"
            title="删除"
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>
    </div>
  );
}
