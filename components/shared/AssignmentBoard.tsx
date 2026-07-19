'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Search, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface BoardItem {
  id: string;
  title: string;
  subtitle?: string;
  badge?: { text: string; className?: string };
  meta?: string;
  disabled?: boolean;
  meta2?: string;
}

interface Props {
  leftTitle: string;
  leftItems: BoardItem[];
  rightTitle: string;
  rightItems: BoardItem[];
  leftSearchPlaceholder?: string;
  rightSearchPlaceholder?: string;
  onAssign: (selectedIds: string[], resourceId: string) => Promise<{ ok: boolean; error?: string }>;
  selectMode?: 'single' | 'multi';
}

export function AssignmentBoard({
  leftTitle,
  leftItems,
  rightTitle,
  rightItems,
  leftSearchPlaceholder = '搜索...',
  rightSearchPlaceholder = '搜索...',
  onAssign,
  selectMode = 'multi',
}: Props) {
  const router = useRouter();
  const [leftSearch, setLeftSearch] = useState('');
  const [rightSearch, setRightSearch] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [assigning, setAssigning] = useState(false);

  const filteredLeft = useMemo(() => {
    if (!leftSearch.trim()) return leftItems;
    const q = leftSearch.toLowerCase();
    return leftItems.filter(
      (i) => i.title.toLowerCase().includes(q) || (i.subtitle ?? '').toLowerCase().includes(q),
    );
  }, [leftItems, leftSearch]);

  const filteredRight = useMemo(() => {
    if (!rightSearch.trim()) return rightItems;
    const q = rightSearch.toLowerCase();
    return rightItems.filter(
      (i) => i.title.toLowerCase().includes(q) || (i.subtitle ?? '').toLowerCase().includes(q),
    );
  }, [rightItems, rightSearch]);

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else {
        if (selectMode === 'single') next.clear();
        next.add(id);
      }
      return next;
    });
  }

  async function onResourceClick(resourceId: string, disabled?: boolean) {
    if (disabled) return;
    if (selected.size === 0) {
      toast.error('请先选择待分配项');
      return;
    }
    setAssigning(true);
    const ids = Array.from(selected);
    const r = await onAssign(ids, resourceId);
    setAssigning(false);
    if (r.ok) {
      toast.success('已分配 ' + ids.length + ' 项');
      setSelected(new Set());
      router.refresh();
    } else {
      toast.error(r.error ?? '分配失败');
    }
  }

  return (
    <div className="grid grid-cols-2 gap-4 min-h-[400px]">
      {/* Left panel — unassigned orders */}
      <div className="cmms-card overflow-hidden flex flex-col">
        <div className="px-3 py-2 bg-stone-50 border-b flex items-center justify-between">
          <span className="text-sm font-semibold text-stone-700">
            {leftTitle} ({leftItems.length})
          </span>
          {selected.size > 0 && (
            <Badge className="bg-stone-800 text-white">已选 {selected.size}</Badge>
          )}
        </div>
        <div className="p-2 border-b">
          <div className="relative">
            <Search
              size={13}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-300"
            />
            <Input
              className="h-8 pl-8 text-xs"
              placeholder={leftSearchPlaceholder}
              value={leftSearch}
              onChange={(e) => setLeftSearch(e.target.value)}
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto max-h-[500px] divide-y divide-stone-100">
          {filteredLeft.length === 0 ? (
            <p className="text-xs text-stone-400 text-center py-8">
              {leftSearch ? '无匹配结果' : '全部已分配'}
            </p>
          ) : (
            filteredLeft.map((item) => {
              const isSelected = selected.has(item.id);
              return (
                <button
                  key={item.id}
                  onClick={() => toggleSelect(item.id)}
                  className={cn(
                    'w-full flex items-center gap-2 px-3 py-2.5 text-left transition-colors',
                    isSelected ? 'bg-stone-100' : 'hover:bg-stone-50',
                  )}
                >
                  <div
                    className={cn(
                      'w-4 h-4 rounded border flex items-center justify-center shrink-0',
                      isSelected ? 'bg-stone-800 border-stone-800' : 'border-stone-300',
                    )}
                  >
                    {isSelected && <CheckCircle2 size={12} className="text-white" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium truncate">{item.title}</span>
                      {item.badge && (
                        <span
                          className={cn(
                            'text-xs px-1.5 py-0.5 rounded shrink-0',
                            item.badge.className,
                          )}
                        >
                          {item.badge.text}
                        </span>
                      )}
                    </div>
                    {item.subtitle && (
                      <p className="text-xs text-stone-400 truncate">{item.subtitle}</p>
                    )}
                    {item.meta && <p className="text-xs text-stone-300">{item.meta}</p>}
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Right panel — available resources */}
      <div className="cmms-card overflow-hidden flex flex-col">
        <div className="px-3 py-2 bg-stone-50 border-b">
          <span className="text-sm font-semibold text-stone-700">
            {rightTitle} ({rightItems.length})
          </span>
        </div>
        <div className="p-2 border-b">
          <div className="relative">
            <Search
              size={13}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-300"
            />
            <Input
              className="h-8 pl-8 text-xs"
              placeholder={rightSearchPlaceholder}
              value={rightSearch}
              onChange={(e) => setRightSearch(e.target.value)}
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto max-h-[500px] divide-y divide-stone-100">
          {filteredRight.length === 0 ? (
            <p className="text-xs text-stone-400 text-center py-8">
              {rightSearch ? '无匹配结果' : '暂无资源'}
            </p>
          ) : (
            filteredRight.map((item) => (
              <button
                key={item.id}
                onClick={() => onResourceClick(item.id, item.disabled || assigning)}
                disabled={item.disabled || assigning || selected.size === 0}
                className={cn(
                  'w-full flex items-center justify-between px-3 py-2.5 text-left transition-colors',
                  item.disabled
                    ? 'opacity-40 cursor-not-allowed'
                    : selected.size > 0
                      ? 'hover:bg-blue-50 cursor-pointer'
                      : 'cursor-default',
                )}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium truncate">{item.title}</span>
                    {item.badge && (
                      <span
                        className={cn(
                          'text-xs px-1.5 py-0.5 rounded shrink-0',
                          item.badge.className,
                        )}
                      >
                        {item.badge.text}
                      </span>
                    )}
                  </div>
                  {item.subtitle && (
                    <p className="text-xs text-stone-400 truncate">{item.subtitle}</p>
                  )}
                </div>
                {item.meta && (
                  <span
                    className={cn(
                      'text-xs shrink-0 ml-2',
                      item.disabled ? 'text-red-400' : 'text-stone-500',
                    )}
                  >
                    {item.meta}
                  </span>
                )}
              </button>
            ))
          )}
        </div>
        {selected.size === 0 && (
          <div className="px-3 py-2 bg-amber-50 border-t text-xs text-amber-600 text-center">
            请先在左侧选择待分配项
          </div>
        )}
      </div>
    </div>
  );
}
