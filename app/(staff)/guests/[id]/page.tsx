import { guestService } from '@/lib/domain/guest/service';
import { reportService } from '@/lib/domain/report/service';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { buttonVariants } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DeleteGuestButton } from '@/components/guests/DeleteGuestButton';
import { getBadgeStyle } from '@/lib/shared/badge-colors';
import { Car, Bed, Utensils, Gift, Users, Receipt } from 'lucide-react';
import { dict } from '@/lib/shared/dictionary';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function GuestDetailPage({ params }: PageProps) {
  const { id } = await params;
  let guest;
  try {
    guest = await guestService.findById(id);
  } catch {
    notFound();
  }

  const profile = await reportService.getGuestFullProfile(id);

  return (
    <div className="space-y-6 max-w-5xl">
      <Breadcrumbs items={[{ label: '嘉宾库', href: '/guests' }, { label: guest.name }]} />
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold">{guest.name}</h1>
          <p className="text-sm text-stone-500 mt-0.5">
            {guest.company ?? '-'} {guest.title ? ` · ${guest.title}` : ''}
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href={`/guests/${guest.id}/edit`}
            className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}
          >
            编辑
          </Link>
          <DeleteGuestButton guestId={guest.id} guestName={guest.name} />
        </div>
      </div>

      {/* Stats bar */}
      {profile && (
        <div className="flex gap-6 text-sm">
          <div className="flex items-center gap-1.5">
            <span className="text-stone-400">参会</span>
            <span className="font-bold text-stone-800">{profile.stats.totalMeetings}</span>
          </div>
          {profile.stats.totalPendingTasks > 0 && (
            <div className="flex items-center gap-1.5">
              <span className="text-stone-400">待办</span>
              <span className="font-bold text-amber-600">{profile.stats.totalPendingTasks}</span>
            </div>
          )}
          {profile.stats.totalFee > 0 && (
            <div className="flex items-center gap-1.5">
              <span className="text-stone-400">累计费用</span>
              <span className="font-bold text-stone-800">
                {profile.stats.totalFee.toFixed(0)} 元
              </span>
            </div>
          )}
        </div>
      )}

      {/* Tabs */}
      <Tabs defaultValue="info">
        <TabsList>
          <TabsTrigger value="info">基本信息</TabsTrigger>
          <TabsTrigger value="meetings">会议参与 ({profile?.meetings.length ?? 0})</TabsTrigger>
          <TabsTrigger value="tasks">接待任务</TabsTrigger>
        </TabsList>

        {/* Tab 1: Basic Info */}
        <TabsContent value="info" className="mt-4">
          <div className="grid grid-cols-2 gap-4 cmms-card p-6">
            <Field label="等级">
              <Badge className={getBadgeStyle(guest.level)} variant="secondary">
                {guest.level}
              </Badge>
            </Field>
            <Field label="性别">{guest.gender ?? '-'}</Field>
            <Field label="手机">{guest.phone ?? '-'}</Field>
            <Field label="邮箱">{guest.email ?? '-'}</Field>
            <Field label="身份证">{guest.idNumber ?? '-'}</Field>
            <Field label="饮食标签">{(guest.dietaryTags ?? []).join(', ') || '-'}</Field>
            <Field label="创建时间">{new Date(guest.createdAt).toLocaleDateString('zh-CN')}</Field>
            <Field label="更新时间">{new Date(guest.updatedAt).toLocaleDateString('zh-CN')}</Field>
            <Field label="备注" full>
              {guest.notes ?? '-'}
            </Field>
          </div>
        </TabsContent>

        {/* Tab 2: Meeting Participation */}
        <TabsContent value="meetings" className="mt-4">
          {!profile || profile.meetings.length === 0 ? (
            <EmptyState text="该嘉宾暂未参加任何会议" />
          ) : (
            <div className="space-y-2">
              {profile.meetings.map((m) => (
                <Link
                  key={m.meetingGuestId}
                  href={'/meetings/' + m.meeting.id}
                  className="cmms-card cmms-card-hover block p-4 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div>
                        <p className="text-sm font-medium">{m.meeting.name}</p>
                        <p className="text-xs text-stone-400 mt-0.5">
                          {new Date(m.meeting.startAt).toLocaleDateString('zh-CN')}
                          {m.meeting.venue ? ' · ' + m.meeting.venue : ''}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {m.entourageRole && (
                        <Badge variant="outline" className="text-xs">
                          {dict.entourageRole[m.entourageRole] ?? m.entourageRole}
                        </Badge>
                      )}
                      <Badge className={getBadgeStyle(m.receptionStage)} variant="secondary">
                        {dict.receptionStage[m.receptionStage]}
                      </Badge>
                      <Badge className={getBadgeStyle(m.meeting.status)} variant="secondary">
                        {dict.meetingStatus[m.meeting.status] ?? m.meeting.status}
                      </Badge>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Tab 3: Reception Tasks */}
        <TabsContent value="tasks" className="mt-4">
          {!profile || profile.meetings.length === 0 ? (
            <EmptyState text="暂无接待任务" />
          ) : (
            <div className="space-y-4">
              {profile.meetings.map((m) => (
                <div key={m.meetingGuestId}>
                  {/* Meeting header */}
                  <div className="flex items-center justify-between mb-2">
                    <Link
                      href={'/meetings/' + m.meeting.id}
                      className="text-sm font-semibold hover:underline"
                    >
                      {m.meeting.name}
                    </Link>
                    {m.pendingCount > 0 && (
                      <Badge className="bg-amber-50 text-amber-700" variant="secondary">
                        {m.pendingCount} 待处理
                      </Badge>
                    )}
                  </div>

                  {/* Task grid */}
                  <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
                    {/* Transport */}
                    <TaskCard
                      icon={<Car size={14} />}
                      title="接送"
                      href={'/meetings/' + m.meeting.id + '/transport'}
                      empty={m.transport.length === 0}
                    >
                      {m.transport.map((t) => (
                        <div key={t.id} className="text-xs">
                          <span className="text-stone-600">
                            {t.pickupLocation} {'->'} {t.dropoffLocation}
                          </span>
                          <br />
                          <span className="text-stone-400">
                            {t.vehicle ? t.vehicle.plateNo + ' · ' : ''}
                            {new Date(t.pickupTime).toLocaleString('zh-CN', {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                          <Badge
                            className={cn('ml-1', getBadgeStyle(t.status))}
                            variant="secondary"
                          >
                            {t.status}
                          </Badge>
                        </div>
                      ))}
                    </TaskCard>

                    {/* Lodging */}
                    <TaskCard
                      icon={<Bed size={14} />}
                      title="住宿"
                      href={'/meetings/' + m.meeting.id + '/lodging'}
                      empty={m.lodging.length === 0}
                    >
                      {m.lodging.map((l) => (
                        <div key={l.id} className="text-xs">
                          <span className="text-stone-600">
                            {l.hotelRoom
                              ? l.hotelRoom.hotel.name +
                                ' ' +
                                l.hotelRoom.roomNumber +
                                ' (' +
                                l.hotelRoom.roomType +
                                ')'
                              : '待分配'}
                          </span>
                          <br />
                          <span className="text-stone-400">
                            {new Date(l.checkInAt).toLocaleDateString('zh-CN')} -{' '}
                            {new Date(l.checkOutAt).toLocaleDateString('zh-CN')}
                          </span>
                          <Badge
                            className={cn('ml-1', getBadgeStyle(l.status))}
                            variant="secondary"
                          >
                            {l.status}
                          </Badge>
                        </div>
                      ))}
                    </TaskCard>

                    {/* Catering */}
                    <TaskCard
                      icon={<Utensils size={14} />}
                      title="餐饮"
                      href={'/meetings/' + m.meeting.id + '/catering'}
                      empty={m.catering.length === 0}
                    >
                      {m.catering.map((c) => (
                        <div key={c.id} className="text-xs">
                          <span className="text-stone-600">
                            {dict.mealType[c.mealType] ?? c.mealType}
                            {c.diningTable ? ' · ' + c.diningTable.name : ''}
                          </span>
                          {c.specialDietary.length > 0 && (
                            <span className="text-orange-500 ml-1">
                              ({c.specialDietary.join('/')})
                            </span>
                          )}
                        </div>
                      ))}
                    </TaskCard>

                    {/* Gift */}
                    <TaskCard
                      icon={<Gift size={14} />}
                      title="礼品"
                      href={'/meetings/' + m.meeting.id + '/gifts'}
                      empty={m.gifts.length === 0}
                    >
                      {m.gifts.map((g) => (
                        <div key={g.id} className="text-xs">
                          <span className="text-stone-600">
                            {g.gift.name} x{g.quantity}
                          </span>
                          <Badge
                            className={cn('ml-1', getBadgeStyle(g.status))}
                            variant="secondary"
                          >
                            {dict.giftStatus[g.status]}
                          </Badge>
                        </div>
                      ))}
                    </TaskCard>

                    {/* Companion */}
                    <TaskCard
                      icon={<Users size={14} />}
                      title="陪同"
                      href={'/meetings/' + m.meeting.id + '/companions'}
                      empty={m.companions.length === 0}
                    >
                      {m.companions.map((c) => (
                        <div key={c.id} className="text-xs">
                          <span className="text-stone-600">{c.companion.name}</span>
                          <span className="text-stone-400 ml-1">({c.assignmentScope})</span>
                        </div>
                      ))}
                    </TaskCard>

                    {/* Fee */}
                    <TaskCard
                      icon={<Receipt size={14} />}
                      title={'费用 (' + m.totalFee.toFixed(0) + ' 元)'}
                      href={'/meetings/' + m.meeting.id + '/fees'}
                      empty={m.fees.length === 0}
                    >
                      {Object.entries(
                        m.fees.reduce(
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
                    </TaskCard>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Field({
  label,
  children,
  full,
}: {
  label: string;
  children: React.ReactNode;
  full?: boolean;
}) {
  return (
    <div className={full ? 'col-span-2' : ''}>
      <p className="text-xs text-stone-400 mb-1">{label}</p>
      <div className="text-sm">{children}</div>
    </div>
  );
}

function TaskCard({
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
    <Link href={href} className="cmms-card cmms-card-hover block p-3 min-h-[80px]">
      <div className="flex items-center gap-1.5 mb-1.5 text-stone-500">
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

function EmptyState({ text }: { text: string }) {
  return (
    <div className="cmms-card p-12 text-center">
      <p className="text-sm text-stone-400">{text}</p>
    </div>
  );
}
