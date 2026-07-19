'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { updateCompanion, deleteCompanion } from '@/app/actions/companion.actions';
import { toast } from 'sonner';
import { Share2, Pencil, Trash2, Check, X } from 'lucide-react';

interface RosterItem {
  id: string;
  name: string;
  role: string;
  languages: string[];
  phone: string | null;
  count: number;
  assigned: boolean;
}

export function CompanionRoster({ companions }: { companions: RosterItem[] }) {
  const router = useRouter();
  const [editingId, setEditingId] = useState<string | null>(null);

  if (companions.length === 0) {
    return (
      <div className="cmms-card p-8 text-center">
        <p className="text-sm text-stone-400">暂无接待人员，请先新增</p>
      </div>
    );
  }

  return (
    <div className="cmms-card overflow-hidden">
      <div className="px-4 py-2.5 bg-stone-50 border-b">
        <h3 className="text-sm font-semibold text-stone-700">接待人员名册</h3>
      </div>
      <div className="divide-y divide-stone-100">
        {companions.map((c) =>
          editingId === c.id ? (
            <EditRow
              key={c.id}
              item={c}
              onDone={() => {
                setEditingId(null);
                router.refresh();
              }}
              onCancel={() => setEditingId(null)}
            />
          ) : (
            <div
              key={c.id}
              className="flex items-center justify-between px-4 py-3 hover:bg-stone-50"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center text-xs font-bold text-stone-500">
                  {c.name.charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-medium">{c.name}</p>
                  <p className="text-xs text-stone-400">
                    {c.role}
                    {c.languages.length > 0 && ' · ' + c.languages.join(', ')}
                    {c.phone && ' · ' + c.phone}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {c.assigned ? (
                  <Badge variant="secondary">{c.count} 位嘉宾</Badge>
                ) : (
                  <span className="text-xs text-stone-300 mr-2">未分配</span>
                )}
                <button
                  onClick={async () => {
                    await navigator.clipboard.writeText(
                      window.location.origin + '/companion/' + c.id,
                    );
                    toast.success('已复制接待链接');
                  }}
                  className="text-stone-400 hover:text-stone-600 p-1.5 rounded hover:bg-stone-100"
                  title="分享"
                >
                  <Share2 size={14} />
                </button>
                <button
                  onClick={() => setEditingId(c.id)}
                  className="text-stone-400 hover:text-stone-600 p-1.5 rounded hover:bg-stone-100"
                  title="编辑"
                >
                  <Pencil size={14} />
                </button>
                {!c.assigned && (
                  <button
                    onClick={async () => {
                      if (!confirm('确认删除「' + c.name + '」？')) return;
                      const r = await deleteCompanion(c.id);
                      if (r.ok) {
                        toast.success('已删除');
                        router.refresh();
                      } else toast.error('删除失败');
                    }}
                    className="text-stone-300 hover:text-red-500 p-1.5 rounded hover:bg-stone-100"
                    title="删除"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            </div>
          ),
        )}
      </div>
    </div>
  );
}

function EditRow({
  item,
  onDone,
  onCancel,
}: {
  item: RosterItem;
  onDone: () => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(item.name);
  const [phone, setPhone] = useState(item.phone ?? '');
  const [role, setRole] = useState(item.role);
  const [languages, setLanguages] = useState(item.languages.join(', '));
  const [saving, setSaving] = useState(false);

  async function onSave() {
    setSaving(true);
    const r = await updateCompanion(item.id, {
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
      onDone();
    } else toast.error('保存失败');
  }

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
            placeholder="英语, 日语"
          />
        </div>
      </div>
      <div className="flex gap-2">
        <Button size="sm" onClick={onSave} disabled={saving}>
          <Check size={13} className="mr-1" />
          {saving ? '保存中...' : '保存'}
        </Button>
        <Button size="sm" variant="outline" onClick={onCancel}>
          <X size={13} className="mr-1" />
          取消
        </Button>
      </div>
    </div>
  );
}
