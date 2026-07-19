'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { AssignmentBoard, type BoardItem } from '@/components/shared/AssignmentBoard';
import { assignCompanion } from '@/app/actions/companion.actions';
import { dict } from '@/lib/shared/dictionary';
import { getBadgeStyle } from '@/lib/shared/badge-colors';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select';
import { toast } from 'sonner';

interface GuestData {
  id: string;
  name: string;
  level: string;
  company: string | null;
  hasCompanion: boolean;
}

interface CompanionData {
  id: string;
  name: string;
  role: string;
  languages: string[];
  phone: string | null;
  assignmentCount: number;
}

export function CompanionBoard({
  meetingId,
  guests,
  companions,
}: {
  meetingId: string;
  guests: GuestData[];
  companions: CompanionData[];
}) {
  const router = useRouter();
  const [scope, setScope] = useState('FULL');

  // Left: guests who don't have a companion yet
  const unassignedGuests = guests.filter((g) => !g.hasCompanion);

  const leftItems: BoardItem[] = unassignedGuests.map((g) => ({
    id: g.id,
    title: g.name,
    subtitle: g.company ?? '',
    badge: { text: g.level, className: getBadgeStyle(g.level) },
  }));

  const rightItems: BoardItem[] = companions.map((c) => ({
    id: c.id,
    title: c.name,
    subtitle:
      c.role +
      (c.languages.length > 0 ? ' · ' + c.languages.join(', ') : '') +
      (c.phone ? ' · ' + c.phone : ''),
    badge: { text: c.assignmentCount + ' 位', className: 'bg-stone-100 text-stone-500' },
  }));

  async function onAssign(guestIds: string[], companionId: string) {
    let ok = 0;
    let fail = 0;
    for (const guestId of guestIds) {
      const r = await assignCompanion({
        meetingId,
        meetingGuestId: guestId,
        companionId,
        assignmentScope: scope,
      });
      if (r.ok) ok++;
      else fail++;
    }
    if (fail > 0 && ok > 0) {
      toast.success('已分配 ' + ok + ' 位，' + fail + ' 位失败');
      return { ok: true };
    }
    if (fail > 0) return { ok: false, error: '分配失败' };
    return { ok: true };
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <Label className="text-xs text-stone-400">接待范围</Label>
        <Select value={scope} onValueChange={(v) => setScope(v ?? 'FULL')}>
          <SelectTrigger className="h-8 w-40">
            <span>{dict.assignmentScope[scope] ?? scope}</span>
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
      <AssignmentBoard
        leftTitle="待分配嘉宾"
        leftItems={leftItems}
        rightTitle="接待人员"
        rightItems={rightItems}
        leftSearchPlaceholder="搜索嘉宾..."
        rightSearchPlaceholder="搜索接待人员..."
        onAssign={onAssign}
      />
    </div>
  );
}
