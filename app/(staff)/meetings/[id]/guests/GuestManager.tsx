'use client';

import { useState, Fragment } from 'react';
import { useRouter } from 'next/navigation';
import type { MeetingGuest, Guest } from '@/lib/generated/prisma/client';
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
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  addGuestToMeeting,
  removeGuestFromMeeting,
  searchGuestsForMeeting,
} from '@/app/actions/meeting-guest.actions';
import { toast } from 'sonner';

type MeetingGuestWithGuest = MeetingGuest & { guest: Guest };

interface Props {
  meetingId: string;
  meetingGuests: MeetingGuestWithGuest[];
}

const ROLE_LABEL: Record<string, string> = {
  PRIMARY: '主嘉宾',
  SECRETARY: '秘书',
  SECURITY: '安保',
  INTERPRETER: '翻译',
  FAMILY: '家属',
  AIDE: '助理',
  DRIVER: '司机',
};

export function GuestManager({ meetingId, meetingGuests }: Props) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<
    Array<{ id: string; name: string; phone: string | null; company: string | null }>
  >([]);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [searching, setSearching] = useState(false);

  async function onSearch() {
    if (!searchQuery.trim()) return;
    setSearching(true);
    const result = await searchGuestsForMeeting(searchQuery.trim());
    setSearching(false);
    if (result.ok && result.data) {
      // Filter out guests already in meeting
      const existingIds = new Set(meetingGuests.map((mg) => mg.guestId));
      setSearchResults(result.data.filter((g) => !existingIds.has(g.id)));
    }
  }

  async function onAdd(guestId: string) {
    const result = await addGuestToMeeting({
      meetingId,
      guestId,
      entourageRole: 'PRIMARY',
    });
    if (result.ok) {
      toast.success('已添加到会议');
      setAddDialogOpen(false);
      setSearchQuery('');
      setSearchResults([]);
      router.refresh();
    } else {
      toast.error(result.error?.message ?? '添加失败');
    }
  }

  async function onRemove(meetingGuestId: string, name: string) {
    if (!confirm(`确认从会议中移除「${name}」？此操作不影响嘉宾库。`)) return;
    const result = await removeGuestFromMeeting(meetingGuestId, meetingId);
    if (result.ok) {
      toast.success(`已移除「${name}」`);
      router.refresh();
    } else {
      toast.error(result.error?.message ?? '移除失败');
    }
  }

  // Group by primary
  const primaryGuests = meetingGuests.filter((mg) => !mg.primaryMeetingGuestId);
  const subordinateByPrimary = new Map<string, MeetingGuestWithGuest[]>();
  meetingGuests
    .filter((mg) => mg.primaryMeetingGuestId)
    .forEach((mg) => {
      const list = subordinateByPrimary.get(mg.primaryMeetingGuestId!) ?? [];
      list.push(mg);
      subordinateByPrimary.set(mg.primaryMeetingGuestId!, list);
    });

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
          <DialogTrigger render={<Button>添加嘉宾</Button>} />
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>添加嘉宾到会议</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div className="flex gap-2">
                <Input
                  placeholder="按姓名 / 手机 / 单位搜索"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && onSearch()}
                />
                <Button onClick={onSearch} disabled={searching}>
                  {searching ? '搜索中...' : '搜索'}
                </Button>
              </div>
              <div className="max-h-72 overflow-auto space-y-1">
                {searchResults.length === 0 ? (
                  <p className="text-sm text-slate-500 text-center py-4">
                    {searchQuery ? '无匹配结果' : '请输入关键词搜索'}
                  </p>
                ) : (
                  searchResults.map((g) => (
                    <div
                      key={g.id}
                      className="flex items-center justify-between p-2 rounded border hover:bg-slate-50"
                    >
                      <div>
                        <p className="font-medium">{g.name}</p>
                        <p className="text-xs text-slate-500">
                          {[g.phone, g.company].filter(Boolean).join(' · ') || '-'}
                        </p>
                      </div>
                      <Button size="sm" onClick={() => onAdd(g.id)}>
                        添加
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
                关闭
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="cmms-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>姓名</TableHead>
              <TableHead>角色</TableHead>
              <TableHead>单位</TableHead>
              <TableHead>等级</TableHead>
              <TableHead>分组</TableHead>
              <TableHead>签到状态</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {primaryGuests.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-slate-500 py-8">
                  暂无嘉宾，点击右上角添加
                </TableCell>
              </TableRow>
            ) : (
              primaryGuests.map((mg) => {
                const subs = subordinateByPrimary.get(mg.id) ?? [];
                return (
                  <Fragment key={mg.id}>
                    <TableRow>
                      <TableCell className="font-medium">{mg.guest.name}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {mg.entourageRole ? ROLE_LABEL[mg.entourageRole] : '-'}
                        </Badge>
                      </TableCell>
                      <TableCell>{mg.guest.company ?? '-'}</TableCell>
                      <TableCell>
                        {mg.levelOverride ?? mg.guest.level}
                        {mg.levelOverride && (
                          <span className="text-xs text-orange-600 ml-1">(覆盖)</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {(mg.groupTags ?? []).map((t) => (
                          <Badge key={t} variant="outline" className="mr-1">
                            {t}
                          </Badge>
                        ))}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{mg.receptionStage}</Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => onRemove(mg.id, mg.guest.name)}
                        >
                          移除
                        </Button>
                      </TableCell>
                    </TableRow>
                    {subs.map((sub) => (
                      <TableRow key={sub.id} className="bg-slate-50">
                        <TableCell className="pl-8 text-sm">└ {sub.guest.name}</TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {sub.entourageRole ? ROLE_LABEL[sub.entourageRole] : '-'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">{sub.guest.company ?? '-'}</TableCell>
                        <TableCell className="text-sm">{sub.guest.level}</TableCell>
                        <TableCell></TableCell>
                        <TableCell>
                          <Badge variant="outline">{sub.receptionStage}</Badge>
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => onRemove(sub.id, sub.guest.name)}
                          >
                            移除
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </Fragment>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
