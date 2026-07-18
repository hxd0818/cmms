import { prisma } from '@/lib/db/client';
import { notFound } from 'next/navigation';
import { dict } from '@/lib/shared/dictionary';
import { Phone, Globe, Clock, MapPin, Car, Bed, UtensilsCrossed, Star, AlertCircle } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface Props {
  params: Promise<{ token: string }>;
}

export default async function CompanionPortalPage({ params }: Props) {
  const { token } = await params;

  const companion = await prisma.companion.findUnique({ where: { id: token } });
  if (!companion) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-stone-50 p-6">
        <div className="text-center">
          <h1 className="text-xl font-bold text-stone-700">链接无效</h1>
          <p className="text-sm text-stone-400 mt-2">请联系会务组获取正确的链接</p>
        </div>
      </main>
    );
  }

  const assignments = await prisma.companionAssignment.findMany({
    where: { companionId: companion.id },
    orderBy: { createdAt: 'desc' },
  });

  const meetingIds = [...new Set(assignments.map((a) => a.meetingId))];
  const meetingGuestIds = [...new Set(assignments.map((a) => a.meetingGuestId))];

  const [meetings, meetingGuests] = await Promise.all([
    meetingIds.length > 0
      ? prisma.meeting.findMany({
          where: { id: { in: meetingIds } },
          select: { id: true, name: true, startAt: true, endAt: true, venue: true },
        })
      : [],
    meetingGuestIds.length > 0
      ? prisma.meetingGuest.findMany({
          where: { id: { in: meetingGuestIds } },
          include: { guest: true },
        })
      : [],
  ]);

  const meetingMap = new Map(meetings.map((m) => [m.id, m]));
  const guestMap = new Map(meetingGuests.map((mg) => [mg.id, mg]));

  // Load each guest's full task data (transport, lodging, catering, agenda)
  const guestDataPromises = meetingGuestIds.map(async (mgId) => {
    const mg = guestMap.get(mgId);
    if (!mg) return null;
    const meetingId = mg.meetingId;

    const [transport, lodging, catering, agenda] = await Promise.all([
      prisma.transportOrder.findMany({
        where: { meetingGuestId: mgId },
        include: { vehicle: true },
        orderBy: { pickupTime: 'asc' },
      }),
      prisma.lodgingOrder.findMany({
        where: { meetingGuestId: mgId },
        include: { hotelRoom: { include: { hotel: true } } },
        orderBy: { checkInAt: 'asc' },
      }),
      prisma.cateringOrder.findMany({
        where: { meetingGuestId: mgId },
        include: { diningTable: true },
        orderBy: { mealTime: 'asc' },
      }),
      prisma.agendaItem.findMany({
        where: { meetingId },
        orderBy: { startAt: 'asc' },
      }),
    ]);

    return { mgId, mg, transport, lodging, catering, agenda };
  });

  const guestDataList = (await Promise.all(guestDataPromises)).filter(Boolean);
  const guestDataMap = new Map(guestDataList.map((d) => [d!.mgId, d!]));

  return (
    <main className="min-h-screen bg-stone-50">
      <div className="max-w-md mx-auto px-4 py-6 space-y-5">
        {/* Companion header */}
        <div className="cmms-card p-5">
          <p className="text-xs text-stone-400 mb-1">接待任务</p>
          <h1 className="text-lg font-bold text-stone-800">{companion.name}</h1>
          <div className="flex flex-wrap gap-3 mt-2 text-xs text-stone-400">
            <span>{companion.role}</span>
            {companion.phone && (
              <span className="flex items-center gap-1">
                <Phone size={11} /> {companion.phone}
              </span>
            )}
            {companion.languages.length > 0 && (
              <span className="flex items-center gap-1">
                <Globe size={11} /> {companion.languages.join(', ')}
              </span>
            )}
          </div>
        </div>

        {assignments.length === 0 ? (
          <div className="cmms-card p-8 text-center">
            <p className="text-sm text-stone-400">暂无接待任务</p>
          </div>
        ) : (
          assignments.map((a) => {
            const meeting = meetingMap.get(a.meetingId);
            const data = guestDataMap.get(a.meetingGuestId);
            if (!meeting || !data) return null;
            const guest = data.mg.guest;

            return (
              <div key={a.id} className="space-y-3">
                {/* Meeting header */}
                <div className="cmms-card p-4 bg-stone-50">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-stone-700">{meeting.name}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-stone-200 text-stone-600">
                      {dict.assignmentScope[a.assignmentScope] ?? a.assignmentScope}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-stone-400">
                    <Clock size={11} />
                    {new Date(meeting.startAt).toLocaleDateString('zh-CN')}
                    {' ~ '}
                    {new Date(meeting.endAt).toLocaleDateString('zh-CN')}
                    {meeting.venue && <><MapPin size={11} className="ml-1" /> {meeting.venue}</>}
                  </div>
                </div>

                {/* Guest info */}
                <div className="cmms-card p-4 space-y-2">
                  <div className="flex items-center gap-2 mb-1">
                    <Star size={14} className="text-amber-500" />
                    <h3 className="text-sm font-bold text-stone-800">{guest.name}</h3>
                    <span className="text-xs px-1.5 py-0.5 rounded bg-stone-100 text-stone-500">
                      {dict.guestLevel[guest.level] ?? guest.level}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-1 text-xs text-stone-500">
                    {guest.company && <span>单位: {guest.company}</span>}
                    {guest.title && <span>职务: {guest.title}</span>}
                    {guest.phone && <span className="font-mono">电话: {guest.phone}</span>}
                    {guest.gender && <span>性别: {dict.gender[guest.gender] ?? guest.gender}</span>}
                  </div>

                  {guest.dietaryTags.length > 0 && (
                    <div className="flex items-center gap-1 text-xs text-orange-600 bg-orange-50 rounded px-2 py-1">
                      <AlertCircle size={12} />
                      饮食注意: {guest.dietaryTags.join(', ')}
                    </div>
                  )}
                </div>

                {/* Transport */}
                {data.transport.length > 0 && (
                  <Section icon={Car} title="接送安排">
                    {data.transport.map((t) => (
                      <Card key={t.id}>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-stone-500">{dict.pickupType[t.pickupType]}</span>
                          <Badge>{dict.transportStatus[t.status] ?? t.status}</Badge>
                        </div>
                        <p className="text-sm text-stone-700 mt-1">
                          {t.pickupLocation} {'->'} {t.dropoffLocation}
                        </p>
                        <p className="text-xs text-stone-400 mt-0.5">
                          {new Date(t.pickupTime).toLocaleString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          {t.flightNo && <span className="font-mono ml-2">{t.flightNo}</span>}
                        </p>
                        {t.vehicle && (
                          <p className="text-xs text-stone-500 mt-0.5">
                            {t.vehicle.plateNo} · {t.vehicle.driverName} {t.vehicle.driverPhone}
                          </p>
                        )}
                      </Card>
                    ))}
                  </Section>
                )}

                {/* Lodging */}
                {data.lodging.length > 0 && (
                  <Section icon={Bed} title="住宿">
                    {data.lodging.map((l) => (
                      <Card key={l.id}>
                        {l.hotelRoom ? (
                          <>
                            <p className="text-sm text-stone-700 font-medium">
                              {l.hotelRoom.hotel.name} {l.hotelRoom.roomNumber}
                            </p>
                            <p className="text-xs text-stone-400">
                              {dict.roomType[l.hotelRoom.roomType]}
                              {' · '}
                              {new Date(l.checkInAt).toLocaleDateString('zh-CN')}
                              {' ~ '}
                              {new Date(l.checkOutAt).toLocaleDateString('zh-CN')}
                            </p>
                          </>
                        ) : (
                          <p className="text-sm text-stone-400">房间待分配</p>
                        )}
                      </Card>
                    ))}
                  </Section>
                )}

                {/* Catering */}
                {data.catering.length > 0 && (
                  <Section icon={UtensilsCrossed} title="用餐">
                    {data.catering.map((c) => (
                      <Card key={c.id}>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-stone-700">
                            {dict.mealType[c.mealType]}
                          </span>
                          {c.diningTable && <span className="text-xs text-stone-400">{c.diningTable.name}</span>}
                        </div>
                        <p className="text-xs text-stone-400 mt-0.5">
                          {new Date(c.mealTime).toLocaleString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </p>
                        {c.specialDietary.length > 0 && (
                          <p className="text-xs text-orange-500 mt-0.5">饮食: {c.specialDietary.join(', ')}</p>
                        )}
                      </Card>
                    ))}
                  </Section>
                )}

                {/* Agenda */}
                {data.agenda.length > 0 && (
                  <Section icon={Clock} title="会议日程">
                    {data.agenda.map((item) => (
                      <Card key={item.id}>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-stone-700">{item.title}</span>
                          <span className="text-xs text-stone-400 bg-stone-100 px-1.5 py-0.5 rounded">
                            {dict.agendaType[item.type]}
                          </span>
                        </div>
                        <p className="text-xs text-stone-400 mt-0.5">
                          {new Date(item.startAt).toLocaleString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          {' ~ '}
                          {new Date(item.endAt).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                          {item.venue && <span className="ml-2">{item.venue}</span>}
                        </p>
                      </Card>
                    ))}
                  </Section>
                )}
              </div>
            );
          })
        )}

        <p className="text-center text-xs text-stone-300 pt-4 pb-6">
          如有疑问请联系会务组
        </p>
      </div>
    </main>
  );
}

function Section({ icon: Icon, title, children }: { icon: LucideIcon; title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-1.5 mb-2 px-1">
        <Icon size={14} className="text-stone-400" />
        <h4 className="text-xs font-semibold text-stone-500">{title}</h4>
      </div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return <div className="cmms-card p-3">{children}</div>;
}

function Badge({ children }: { children: React.ReactNode }) {
  return <span className="text-xs px-2 py-0.5 rounded-full bg-stone-100 text-stone-500">{children}</span>;
}
