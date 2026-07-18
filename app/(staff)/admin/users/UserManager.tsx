'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select';
import { createUser, updateUser, deleteUser } from '@/app/actions/user.actions';
import { dict } from '@/lib/shared/dictionary';
import { toast } from 'sonner';
import { UserPlus, Trash2, Pencil } from 'lucide-react';

interface UserItem {
  id: string;
  email: string;
  name: string;
  role: string;
  createdAt: string;
}

export function UserManager({ users }: { users: UserItem[] }) {
  const router = useRouter();
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button size="sm" onClick={() => setShowAdd(!showAdd)}>
          <UserPlus size={14} className="mr-1" /> 新增用户
        </Button>
      </div>

      {showAdd && (
        <AddUserForm
          onDone={() => {
            setShowAdd(false);
            router.refresh();
          }}
        />
      )}

      <div className="cmms-card overflow-hidden">
        <div className="divide-y divide-stone-100">
          {users.map((u) => (
            <div key={u.id}>
              {editingId === u.id ? (
                <EditUserRow
                  user={u}
                  onDone={() => {
                    setEditingId(null);
                    router.refresh();
                  }}
                  onCancel={() => setEditingId(null)}
                />
              ) : (
                <div className="flex items-center justify-between px-4 py-3 hover:bg-stone-50">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center text-xs font-bold text-stone-500">
                      {u.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{u.name}</p>
                      <p className="text-xs text-stone-400">{u.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge
                      variant="secondary"
                      className={
                        u.role === 'SUPER_ADMIN'
                          ? 'bg-stone-800 text-white'
                          : 'bg-stone-100 text-stone-500'
                      }
                    >
                      {dict.systemRole[u.role] ?? u.role}
                    </Badge>
                    <button
                      onClick={() => setEditingId(u.id)}
                      className="text-stone-400 hover:text-stone-600 p-1"
                    >
                      <Pencil size={13} />
                    </button>
                    <button
                      onClick={async () => {
                        if (!confirm('确认删除用户「' + u.name + '」？')) return;
                        const r = await deleteUser(u.id);
                        if (r.ok) {
                          toast.success('已删除');
                          router.refresh();
                        } else {
                          toast.error(r.error?.message ?? '删除失败');
                        }
                      }}
                      className="text-stone-300 hover:text-red-500 p-1"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function AddUserForm({ onDone }: { onDone: () => void }) {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('VIEWER');
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    const r = await createUser({ email, name, password, role });
    setSubmitting(false);
    if (r.ok) {
      toast.success('用户已创建');
      onDone();
    } else {
      toast.error(r.error?.message ?? '创建失败');
    }
  }

  return (
    <form onSubmit={onSubmit} className="cmms-card p-4 space-y-3">
      <h3 className="text-sm font-semibold">新增用户</h3>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-xs text-stone-400">姓名 *</Label>
          <Input
            className="h-8 mt-1"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        <div>
          <Label className="text-xs text-stone-400">邮箱 *</Label>
          <Input
            className="h-8 mt-1"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div>
          <Label className="text-xs text-stone-400">初始密码 *</Label>
          <Input
            className="h-8 mt-1"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <div>
          <Label className="text-xs text-stone-400">角色</Label>
          <Select value={role} onValueChange={(v) => setRole(v ?? 'VIEWER')}>
            <SelectTrigger className="h-8 mt-1">
              <span>{dict.systemRole[role] ?? role}</span>
            </SelectTrigger>
            <SelectContent>
              {Object.entries(dict.systemRole).map(([v, l]) => (
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
          {submitting ? '创建中...' : '创建'}
        </Button>
        <Button size="sm" type="button" variant="outline" onClick={onDone}>
          取消
        </Button>
      </div>
    </form>
  );
}

function EditUserRow({
  user,
  onDone,
  onCancel,
}: {
  user: UserItem;
  onDone: () => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(user.name);
  const [role, setRole] = useState(user.role);
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function onSave() {
    setSubmitting(true);
    const r = await updateUser(user.id, {
      name,
      role,
      password: password || undefined,
    });
    setSubmitting(false);
    if (r.ok) {
      toast.success('已保存');
      onDone();
    } else {
      toast.error(r.error?.message ?? '保存失败');
    }
  }

  return (
    <div className="px-4 py-3 bg-stone-50 space-y-2">
      <div className="grid grid-cols-3 gap-3">
        <div>
          <Label className="text-xs text-stone-400">姓名</Label>
          <Input className="h-8 mt-1" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div>
          <Label className="text-xs text-stone-400">角色</Label>
          <Select value={role} onValueChange={(v) => setRole(v ?? 'VIEWER')}>
            <SelectTrigger className="h-8 mt-1">
              <span>{dict.systemRole[role] ?? role}</span>
            </SelectTrigger>
            <SelectContent>
              {Object.entries(dict.systemRole).map(([v, l]) => (
                <SelectItem key={v} value={v}>
                  {l}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs text-stone-400">重置密码（留空不修改）</Label>
          <Input
            className="h-8 mt-1"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••"
          />
        </div>
      </div>
      <div className="flex gap-2">
        <Button size="sm" onClick={onSave} disabled={submitting}>
          {submitting ? '保存中...' : '保存'}
        </Button>
        <Button size="sm" variant="outline" onClick={onCancel}>
          取消
        </Button>
      </div>
    </div>
  );
}
