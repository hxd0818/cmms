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
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import {
  addGuestToMeeting,
  removeGuestFromMeeting,
  searchGuestsForMeeting,
} from '@/app/actions/meeting-guest.actions';
import { getBadgeStyle } from '@/lib/shared/badge-colors';
import { toast } from 'sonner';
import { Car, Bed, UtensilsCrossed, Gift, UserCheck, Receipt } from 'lucide-react';
import { cn } from '@/lib/utils';

type MeetingGuestWithGuest = MeetingGuest & { guest: Guest };

interface GuestTasks {
  transport: Array<{
    id: string;
    pickupLocation: string;
    dropoffLocation: string;
    pickupTime: Date;
    status: string;
    vehicle: { plateNo: string } | null;
  }>;
  lodging: Array<{
    id: string;
    checkInAt: Date;
    checkOutAt: Date;
    status: string;
    hotelRoom: { hotel: { name: string }; roomNumber: string; roomType: string } | null;
  }>;
  catering: Array<{
    id: string;
    mealType: string;
    diningTable: { name: string } | null;
    specialDietary: string[];
  }>;
  gifts: Array<{
    id: string;
    quantity: number;
    status: string;
    gift: { name: string };
  }>;
  companions: Array<{
    id: string;
    assignmentScope: string;
    companion: { name: string };
  }>;
  fees: Array<{
    id: string;
    category: string;
    amount: unknown;
  }>;
}

interface Props {
  meetingId: string;
  meetingGuests: MeetingGuestWithGuest[];
  tasksByGuestId: Record<string, GuestTasks>;
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

const MEAL_LABEL: Record<string, string> = {
  WELCOME_BANQUET: '欢迎宴',
  FAREWELL: '欢送宴',
  LUNCH: '午餐',
  DINNER: '晚餐',
  BREAKFAST: '早餐',
};

export function GuestManager({ meetingId, meetingGuests, tasksByGuestId }: Props) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<
    Array<{ id: string; name: string; phone: string | null; company: string | null }>
  >([]);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [searching, setSearching] = useState(false);
  const [selectedGuest, setSelectedGuest] = useState<MeetingGuestWithGuest | null>(null);

  async function onSearch() {
    if (!searchQuery.trim()) return;
    setSearching(true);
    const result = await searchGuestsForMeeting(searchQuery.trim());
    setSearching(false);
    if (result.ok && result.data) {
      const existingIds = new Set(meetingGuests.map((mg) => mg.guestId));
      setSearchResults(result.data.filter((g) => !existingIds.has(g.id)));
    }
  }

  async function onAdd(guestId: string) {
    const result = await addGuestToMeeting({ meetingId, guestId, entourageRole: 'PRIMARY' });
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
    if (!confirm('确认从会议中移除「' + name + '」？')) return;
    const result = await removeGuestFromMeeting(meetingGuestId, meetingId);
    if (result.ok) {
      toast.success('已移除');
      router.refresh();
    } else {
      toast.error(result.error?.message ?? '移除失败');
    }
  }

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
      {/* Add guest dialog */}
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
                  <p className="text-sm text-stone-400 text-center py-4">
                    {searchQuery ? '无匹配结果' : '请输入关键词搜索'}
                  </p>
                ) : (
                  searchResults.map((g) => (
                    <div
                      key={g.id}
                      className="flex items-center justify-between p-2 rounded border hover:bg-stone-50"
                    >
                      <div>
                        <p className="font-medium">{g.name}</p>
                        <p className="text-xs text-stone-400">
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

      {/* Guest table */}
      <div className="cmms-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>姓名</TableHead>
              <TableHead>角色</TableHead>
              <TableHead>单位</TableHead>
              <TableHead>等级</TableHead>
              <TableHead>签到状态</TableHead>
              <TableHead>接待</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {primaryGuests.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-stone-400 py-8">
                  暂无嘉宾，点击右上角添加
                </TableCell>
              </TableRow>
            ) : (
              primaryGuests.map((mg) => {
                const subs = subordinateByPrimary.get(mg.id) ?? [];
                const tasks = tasksByGuestId[mg.id];
                const taskCount = tasks
                  ? tasks.transport.length +
                    tasks.lodging.length +
                    tasks.catering.length +
                    tasks.gifts.length
                  : 0;
                return (
                  <Fragment key={mg.id}>
                    <TableRow
                      className="cursor-pointer hover:bg-stone-50"
                      onClick={() => setSelectedGuest(mg)}
                    >
                      <TableCell className="font-medium text-stone-800">{mg.guest.name}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {mg.entourageRole ? ROLE_LABEL[mg.entourageRole] : '-'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-stone-500">
                        {mg.guest.company ?? '-'}
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={getBadgeStyle(mg.levelOverride ?? mg.guest.level)}
                          variant="secondary"
                        >
                          {mg.levelOverride ?? mg.guest.level}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getBadgeStyle(mg.receptionStage)} variant="secondary">
                          {mg.receptionStage === 'NOT_ARRIVED'
                            ? '未签到'
                            : mg.receptionStage === 'CHECKED_IN'
                              ? '已签到'
                              : mg.receptionStage === 'IN_HOUSE'
                                ? '在场'
                                : mg.receptionStage === 'DEPARTED'
                                  ? '已离场'
                                  : '未到'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {taskCount > 0 ? (
                          <span className="text-xs text-teal-600 font-medium">
                            {taskCount} 项任务
                          </span>
                        ) : (
                          <span className="text-xs text-stone-300">无</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            onRemove(mg.id, mg.guest.name);
                          }}
                        >
                          移除
                        </Button>
                      </TableCell>
                    </TableRow>
                    {subs.map((sub) => {
                      const subTasks = tasksByGuestId[sub.id];
                      const subCount = subTasks
                        ? subTasks.transport.length +
                          subTasks.lodging.length +
                          subTasks.catering.length +
                          subTasks.gifts.length
                        : 0;
                      return (
                        <TableRow
                          key={sub.id}
                          className="bg-stone-50 cursor-pointer hover:bg-stone-100"
                          onClick={() => setSelectedGuest(sub)}
                        >
                          <TableCell className="pl-8 text-sm text-stone-600">
                            └ {sub.guest.name}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs">
                              {sub.entourageRole ? ROLE_LABEL[sub.entourageRole] : '-'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-stone-400">
                            {sub.guest.company ?? '-'}
                          </TableCell>
                          <TableCell>
                            <Badge className={getBadgeStyle(sub.guest.level)} variant="secondary">
                              {sub.guest.level}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{sub.receptionStage}</Badge>
                          </TableCell>
                          <TableCell>
                            {subCount > 0 ? (
                              <span className="text-xs text-teal-600">{subCount} 项</span>
                            ) : (
                              <span className="text-xs text-stone-300">无</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation();
                                onRemove(sub.id, sub.guest.name);
                              }}
                            >
                              移除
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </Fragment>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Guest task sheet */}
      <Sheet open={!!selectedGuest} onOpenChange={(v) => !v && setSelectedGuest(null)}>
        <SheetContent className="w-[480px] sm:max-w-[480px] overflow-y-auto">
          {selectedGuest && (
            <>
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  {selectedGuest.guest.name}
                  <Badge className={getBadgeStyle(selectedGuest.guest.level)} variant="secondary">
                    {selectedGuest.guest.level}
                  </Badge>
                  {selectedGuest.entourageRole && (
                    <Badge variant="outline" className="text-xs">
                      {ROLE_LABEL[selectedGuest.entourageRole]}
                    </Badge>
                  )}
                </SheetTitle>
                <p className="text-xs text-stone-400">
                  {selectedGuest.guest.company ?? '-'}{' '}
                  {selectedGuest.guest.title ? ' · ' + selectedGuest.guest.title : ''}
                </p>
              </SheetHeader>

              <GuestTaskCards meetingId={meetingId} tasks={tasksByGuestId[selectedGuest.id]} />
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function GuestTaskCards({
  meetingId,
  tasks,
}: {
  meetingId: string;
  tasks: GuestTasks | undefined;
}) {
  if (!tasks) {
    return <p className="text-sm text-stone-400 mt-4">暂无接待任务</p>;
  }

  const totalFee = tasks.fees.reduce((s, f) => s + Number(f.amount), 0);

  return (
    <div className="space-y-3 mt-4">
      {/* Transport */}
      <TaskSection
        icon={<Car size={14} />}
        title="接送"
        href={'/meetings/' + meetingId + '/transport'}
        empty={tasks.transport.length === 0}
      >
        {tasks.transport.map((t) => (
          <div key={t.id} className="text-xs flex items-center gap-2">
            <span className="text-stone-600 flex-1">
              {t.pickupLocation} {'->'} {t.dropoffLocation}
            </span>
            <Badge className={getBadgeStyle(t.status)} variant="secondary">
              {t.status}
            </Badge>
          </div>
        ))}
      </TaskSection>

      {/* Lodging */}
      <TaskSection
        icon={<Bed size={14} />}
        title="住宿"
        href={'/meetings/' + meetingId + '/lodging'}
        empty={tasks.lodging.length === 0}
      >
        {tasks.lodging.map((l) => (
          <div key={l.id} className="text-xs flex items-center gap-2">
            <span className="text-stone-600 flex-1">
              {l.hotelRoom ? l.hotelRoom.hotel.name + ' ' + l.hotelRoom.roomNumber : '待分配'}
            </span>
            <Badge className={getBadgeStyle(l.status)} variant="secondary">
              {l.status}
            </Badge>
          </div>
        ))}
      </TaskSection>

      {/* Catering */}
      <TaskSection
        icon={<UtensilsCrossed size={14} />}
        title="餐饮"
        href={'/meetings/' + meetingId + '/catering'}
        empty={tasks.catering.length === 0}
      >
        {tasks.catering.map((c) => (
          <div key={c.id} className="text-xs">
            <span className="text-stone-600">
              {MEAL_LABEL[c.mealType] ?? c.mealType}
              {c.diningTable ? ' · ' + c.diningTable.name : ''}
            </span>
            {c.specialDietary.length > 0 && (
              <span className="text-orange-500 ml-1">({c.specialDietary.join('/')})</span>
            )}
          </div>
        ))}
      </TaskSection>

      {/* Gift */}
      <TaskSection
        icon={<Gift size={14} />}
        title="礼品"
        href={'/meetings/' + meetingId + '/gifts'}
        empty={tasks.gifts.length === 0}
      >
        {tasks.gifts.map((g) => (
          <div key={g.id} className="text-xs flex items-center gap-2">
            <span className="text-stone-600 flex-1">
              {g.gift.name} x{g.quantity}
            </span>
            <Badge className={getBadgeStyle(g.status)} variant="secondary">
              {g.status === 'PENDING' ? '待发' : '已发'}
            </Badge>
          </div>
        ))}
      </TaskSection>

      {/* Companion */}
      <TaskSection
        icon={<UserCheck size={14} />}
        title="陪同"
        href={'/meetings/' + meetingId + '/companions'}
        empty={tasks.companions.length === 0}
      >
        {tasks.companions.map((c) => (
          <div key={c.id} className="text-xs text-stone-600">
            {c.companion.name} <span className="text-stone-400">({c.assignmentScope})</span>
          </div>
        ))}
      </TaskSection>

      {/* Fee */}
      <TaskSection
        icon={<Receipt size={14} />}
        title={'费用 (' + totalFee.toFixed(0) + ' 元)'}
        href={'/meetings/' + meetingId + '/fees'}
        empty={tasks.fees.length === 0}
      >
        {Object.entries(
          tasks.fees.reduce(
            (acc, f) => {
              const cat = f.category as string;
              acc[cat] = (acc[cat] ?? 0) + Number(f.amount);
              return acc;
            },
            {} as Record<string, number>,
          ),
        ).map(([cat, amount]) => (
          <div key={cat} className="text-xs flex justify-between">
            <span className="text-stone-500">{cat}</span>
            <span className="text-stone-700 font-medium">{amount.toFixed(0)}</span>
          </div>
        ))}
      </TaskSection>
    </div>
  );
}

function TaskSection({
  icon,
  title,
  href,
  empty,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  href: string;
  empty: boolean;
  children?: React.ReactNode;
}) {
  return (
    <Link href={href} className="cmms-card cmms-card-hover block p-3">
      <div className="flex items-center gap-1.5 mb-2 text-stone-500">
        {icon}
        <span className="text-xs font-semibold">{title}</span>
      </div>
      {empty ? (
        <p className="text-xs text-stone-300">暂无</p>
      ) : (
        <div className="space-y-1">{children}</div>
      )}
    </Link>
  );
}

import Link from 'next/link';
