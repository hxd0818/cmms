'use client';

import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Share2 } from 'lucide-react';

interface RosterItem {
  id: string;
  name: string;
  role: string;
  languages: string[];
  phone: string | null;
  count: number;
}

export function CompanionRoster({ companions }: { companions: RosterItem[] }) {
  return (
    <div className="cmms-card overflow-hidden">
      <div className="px-4 py-2.5 bg-stone-50 border-b">
        <h3 className="text-sm font-semibold text-stone-700">接待人员名册</h3>
      </div>
      <div className="divide-y divide-stone-100">
        {companions.map((c) => (
          <div key={c.id} className="flex items-center justify-between px-4 py-3 hover:bg-stone-50">
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
            <div className="flex items-center gap-2">
              <Badge variant="secondary">{c.count} 位嘉宾</Badge>
              <button
                onClick={async () => {
                  const url = window.location.origin + '/companion/' + c.id;
                  await navigator.clipboard.writeText(url);
                  toast.success('已复制 ' + c.name + ' 的接待链接');
                }}
                className="text-stone-400 hover:text-stone-600 p-1.5 rounded hover:bg-stone-100"
                title="分享接待链接"
              >
                <Share2 size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
