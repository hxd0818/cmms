'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Companion, MeetingGuest, Guest } from '@/lib/generated/prisma/client';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { unassignCompanion } from '@/app/actions/companion.actions';
import { toast } from 'sonner';
import { Share2 } from 'lucide-react';
import { copyToClipboard } from '@/lib/utils/clipboard';

type AssignmentWithRelations = {
  id: string;
  meetingGuestId: string;
  companionId: string;
  assignmentScope: string;
  notes: string | null;
  createdAt: Date;
  companion: Companion;
  meetingGuest: (MeetingGuest & { guest: Guest }) | null;
};

const SCOPE_LABEL: Record<string, string> = {
  FULL: '全程接待',
  MEETING: '会议期间',
  DINING: '用餐期间',
  TRANSPORT: '接送期间',
  LODGING: '住宿期间',
};

interface Props {
  meetingId: string;
  assignments: AssignmentWithRelations[];
}

export function CompanionList({ meetingId, assignments }: Props) {
  const router = useRouter();
  const [unassigning, setUnassigning] = useState<string | null>(null);

  async function onUnassign(assignmentId: string) {
    if (!confirm('确认取消该接待分配？')) return;
    setUnassigning(assignmentId);
    const r = await unassignCompanion(assignmentId, meetingId);
    setUnassigning(null);
    if (r.ok) {
      toast.success('已取消分配');
      router.refresh();
    } else {
      toast.error(r.error?.message ?? '取消失败');
    }
  }

  return (
    <div className="cmms-card overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>嘉宾</TableHead>
            <TableHead>接待人员</TableHead>
            <TableHead>角色</TableHead>
            <TableHead>语言</TableHead>
            <TableHead>接待范围</TableHead>
            <TableHead></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {assignments.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-slate-500 py-8">
                暂无接待分配
              </TableCell>
            </TableRow>
          ) : (
            assignments.map((a) => (
              <TableRow key={a.id}>
                <TableCell className="font-medium">{a.meetingGuest?.guest.name ?? '-'}</TableCell>
                <TableCell className="text-sm">{a.companion.name}</TableCell>
                <TableCell className="text-sm">{a.companion.role}</TableCell>
                <TableCell className="text-sm">
                  {a.companion.languages.length > 0 ? a.companion.languages.join(', ') : '-'}
                </TableCell>
                <TableCell>
                  <Badge variant="secondary">
                    {SCOPE_LABEL[a.assignmentScope] ?? a.assignmentScope}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      title="分享接待任务链接"
                      onClick={async () => {
                        const url = window.location.origin + '/companion/' + a.companion.id;
                        await copyToClipboard();
                        toast.success('链接已复制：' + a.companion.name + ' 的接待任务');
                      }}
                    >
                      <Share2 size={13} />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onUnassign(a.id)}
                      disabled={unassigning === a.id}
                    >
                      {unassigning === a.id ? '取消中...' : '取消分配'}
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
