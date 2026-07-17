'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  updateDictionaryLabel,
  toggleDictionaryVisibility,
} from '@/app/actions/dictionary.actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Check, Eye, EyeOff } from 'lucide-react';

interface Entry {
  id: string;
  key: string;
  label: string;
  sortOrder: number;
  isVisible: boolean;
}

interface Category {
  category: string;
  entries: Entry[];
}

export function DictionaryEditor({ categories }: { categories: Category[] }) {
  return (
    <div className="space-y-6">
      {categories.map((cat) => (
        <CategorySection key={cat.category} category={cat} />
      ))}
    </div>
  );
}

const CATEGORY_LABELS: Record<string, string> = {
  gender: '性别',
  guestLevel: '嘉宾等级',
  systemRole: '系统角色',
  meetingStatus: '会议状态',
  rsvpStatus: 'RSVP 状态',
  receptionStage: '签到状态',
  entourageRole: '随行角色',
  agendaType: '议程类型',
  vehicleType: '车辆类型',
  pickupType: '接送类型',
  transportStatus: '接送状态',
  roomType: '房间类型',
  roomStatus: '房间状态',
  lodgingStatus: '住宿状态',
  tableType: '餐桌类型',
  mealType: '餐类',
  cateringStatus: '餐饮状态',
  giftStatus: '礼品状态',
  feeCategory: '费用类别',
};

function CategorySection({ category }: { category: Category }) {
  return (
    <div className="cmms-card overflow-hidden">
      <div className="px-4 py-2.5 bg-stone-50 border-b">
        <h3 className="text-sm font-semibold text-stone-700">
          {CATEGORY_LABELS[category.category] ?? category.category}
          <span className="ml-2 text-xs font-normal text-stone-400 font-mono">
            {category.category}
          </span>
        </h3>
      </div>
      <div className="divide-y divide-stone-100">
        {category.entries.map((entry) => (
          <EntryRow key={entry.id} entry={entry} />
        ))}
      </div>
    </div>
  );
}

function EntryRow({ entry }: { entry: Entry }) {
  const router = useRouter();
  const [label, setLabel] = useState(entry.label);
  const [saving, setSaving] = useState(false);
  const [visible, setVisible] = useState(entry.isVisible);
  const dirty = label !== entry.label;

  async function onSave() {
    setSaving(true);
    const r = await updateDictionaryLabel(entry.id, label);
    setSaving(false);
    if (r.ok) {
      toast.success('已保存');
      router.refresh();
    } else {
      toast.error(r.error?.message ?? '保存失败');
      setLabel(entry.label);
    }
  }

  async function onToggle() {
    const r = await toggleDictionaryVisibility(entry.id);
    if (r.ok) {
      setVisible(!visible);
      toast.success(visible ? '已隐藏' : '已显示');
      router.refresh();
    }
  }

  return (
    <div className="flex items-center gap-3 px-4 py-2">
      <code className="text-xs text-stone-400 w-32 shrink-0 font-mono">{entry.key}</code>
      <Input
        value={label}
        onChange={(e) => setLabel(e.target.value)}
        className="h-7 flex-1 text-sm"
        disabled={saving}
      />
      <Button
        size="sm"
        variant={dirty ? 'default' : 'ghost'}
        className="h-7 px-2"
        onClick={onSave}
        disabled={!dirty || saving}
      >
        <Check size={13} />
      </Button>
      <button
        onClick={onToggle}
        className="text-stone-400 hover:text-stone-600 p-1"
        title={visible ? '点击隐藏' : '点击显示'}
      >
        {visible ? <Eye size={14} /> : <EyeOff size={14} />}
      </button>
    </div>
  );
}
