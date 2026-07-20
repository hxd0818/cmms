'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { getBadgeStyle } from '@/lib/shared/badge-colors';
import { Search, ChevronDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface GuestOption {
  id: string;
  name: string;
  level?: string;
  company?: string | null;
}

export function GuestSearchSelect({
  guests,
  value,
  onChange,
  placeholder = '搜索嘉宾...',
}: {
  guests: GuestOption[];
  value: string;
  onChange: (id: string) => void;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  const selected = guests.find((g) => g.id === value);

  const filtered = useMemo(() => {
    if (!search.trim()) return guests;
    const q = search.toLowerCase();
    return guests.filter(
      (g) =>
        g.name.toLowerCase().includes(q) ||
        (g.company ?? '').toLowerCase().includes(q) ||
        (g.level ?? '').toLowerCase().includes(q),
    );
  }, [guests, search]);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch('');
      }
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(
          'flex w-full items-center justify-between rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm transition-colors hover:border-stone-300',
          open && 'border-stone-400',
        )}
      >
        <span className={selected ? '' : 'text-stone-400'}>
          {selected ? (
            <span className="flex items-center gap-2">
              {selected.name}
              {selected.level && (
                <span
                  className={cn('text-xs px-1.5 py-0.5 rounded', getBadgeStyle(selected.level))}
                >
                  {selected.level}
                </span>
              )}
            </span>
          ) : (
            placeholder
          )}
        </span>
        <ChevronDown size={14} className="text-stone-400 shrink-0" />
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-stone-200 rounded-lg shadow-lg max-h-64 overflow-hidden">
          <div className="p-2 border-b">
            <div className="relative">
              <Search
                size={13}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-300"
              />
              <Input
                className="h-8 pl-8 text-xs"
                placeholder="输入姓名/单位搜索..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                autoFocus
              />
            </div>
          </div>
          <div className="overflow-y-auto max-h-48">
            {filtered.length === 0 ? (
              <p className="text-xs text-stone-400 text-center py-4">
                {search ? '无匹配结果' : '暂无嘉宾'}
              </p>
            ) : (
              filtered.map((g) => (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => {
                    onChange(g.id);
                    setOpen(false);
                    setSearch('');
                  }}
                  className={cn(
                    'flex items-center justify-between w-full px-3 py-2 text-left text-sm hover:bg-stone-50 transition-colors',
                    g.id === value && 'bg-stone-100',
                  )}
                >
                  <div className="flex items-center gap-2">
                    {g.id === value && <Check size={13} className="text-stone-600 shrink-0" />}
                    <span className="font-medium">{g.name}</span>
                    {g.level && (
                      <span className={cn('text-xs px-1.5 py-0.5 rounded', getBadgeStyle(g.level))}>
                        {g.level}
                      </span>
                    )}
                  </div>
                  {g.company && (
                    <span className="text-xs text-stone-400 truncate ml-2">{g.company}</span>
                  )}
                </button>
              ))
            )}
          </div>
          <div className="px-3 py-1.5 border-t text-xs text-stone-300 text-right">
            {filtered.length} / {guests.length} 位嘉宾
          </div>
        </div>
      )}
    </div>
  );
}
