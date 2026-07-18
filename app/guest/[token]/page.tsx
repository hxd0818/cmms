import { prisma } from '@/lib/db/client';
import { notFound } from 'next/navigation';
import { dict } from '@/lib/shared/dictionary';
import { Car, Bed, UtensilsCrossed, Gift, CalendarDays, MapPin, Clock } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface Props {
  params: Promise<{ token: string }>;
}

export default async function GuestPortalPage({ params }: Props) {
  const { token } = await params;

  // Validate token (HMAC hash lookup)
  const tokenRecord = await prisma.guestAccessToken.findFirst({
    where: {
      tokenHash: token,
      revokedAt: null,
      expiresAt: { gt: new Date() },
    },
  });

  if (!tokenRecord) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-stone-50 p-6">
        <div className="text-center">
          <h1 className="text-xl font-bold text-stone-700">链接无效或已过期</h1>
          <p className="text-sm text-stone-400 mt-2">请联系会务组重新获取链接</p>
        </div>
      </main>
    );
  }

  // Update access tracking
  await prisma.guestAccessToken.update({
    where: { id: tokenRecord.id },
    data: {
      lastAccessedAt: new Date(),
      accessCount: { increment: 1 },
    },
  });

  // Load guest + meeting + all tasks
  const mg = await prisma.meetingGuest.findUnique({
    where: { id: tokenRecord.meetingGuestId },
    include: {
      guest: true,
      meeting: true,
      primary: { include: { guest: true } },
    },
  });

  if (!mg) notFound();

  const meetingId = mg.meetingId;
  const meetingGuestId = mg.id;

  const [agendaItems, transport, lodging, catering, gifts, companions] = await Promise.all([
    prisma.agendaItem.findMany({
      where: { meetingId },
      orderBy: { startAt: 'asc' },
    }),
    prisma.transportOrder.findMany({
      where: { meetingGuestId },
      include: { vehicle: true },
      orderBy: { pickupTime: 'asc' },
    }),
    prisma.lodgingOrder.findMany({
      where: { meetingGuestId },
      include: { hotelRoom: { include: { hotel: true } } },
      orderBy: { checkInAt: 'asc' },
    }),
    prisma.cateringOrder.findMany({
      where: { meetingGuestId },
      include: { diningTable: true },
      orderBy: { mealTime: 'asc' },
    }),
    prisma.giftOrder.findMany({
      where: { meetingGuestId },
      include: { gift: true },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.companionAssignment.findMany({
      where: { meetingGuestId },
      include: { companion: true },
    }),
  ]);

  return (
    <main className="min-h-screen bg-stone-50">
      <div className="max-w-md mx-auto px-4 py-6 space-y-5">
        {/* Meeting header */}
        <div className="cmms-card p-5">
          <p className="text-xs text-stone-400 mb-1">参会行程</p>
          <h1 className="text-lg font-bold text-stone-800">{mg.guest.name}</h1>
          <p className="text-sm text-stone-500 mt-1">{mg.meeting.name}</p>
          <div className="flex items-center gap-3 mt-3 text-xs text-stone-400">
            <span className="flex items-center gap-1">
              <CalendarDays size={12} />
              {new Date(mg.meeting.startAt).toLocaleDateString('zh-CN')}
              {' ~ '}
              {new Date(mg.meeting.endAt).toLocaleDateString('zh-CN')}
            </span>
            {mg.meeting.venue && (
              <span className="flex items-center gap-1">
                <MapPin size={12} />
                {mg.meeting.venue}
              </span>
            )}
          </div>
          <div className="mt-3">
            <span className="text-xs text-stone-400">参会状态:</span>{' '}
            <span className={'text-xs font-medium ' + getRsvpTextColor(mg.rsvpStatus)}>
              {dict.rsvpStatus[mg.rsvpStatus] ?? mg.rsvpStatus}
            </span>
          </div>
        </div>

        {/* Transport */}
        {transport.length > 0 && (
          <Section icon={Car} title="接送安排">
            {transport.map((t) => (
              <Card key={t.id}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-stone-600">
                    {dict.pickupType[t.pickupType]}
                  </span>
                  <StatusBadge status={t.status} type="transportStatus" />
                </div>
                <p className="text-sm text-stone-700">
                  {t.pickupLocation} {'->'} {t.dropoffLocation}
                </p>
                <p className="text-xs text-stone-400 mt-1 flex items-center gap-1">
                  <Clock size={11} />
                  {new Date(t.pickupTime).toLocaleString('zh-CN', {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                  {t.flightNo && <span className="ml-2 font-mono">{t.flightNo}</span>}
                </p>
                {t.vehicle && (
                  <p className="text-xs text-stone-500 mt-1">
                    {t.vehicle.plateNo} · {t.vehicle.driverName} {t.vehicle.driverPhone}
                  </p>
                )}
              </Card>
            ))}
          </Section>
        )}

        {/* Lodging */}
        {lodging.length > 0 && (
          <Section icon={Bed} title="住宿安排">
            {lodging.map((l) => (
              <Card key={l.id}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-stone-600">
                    {dict.lodgingStatus[l.status]}
                  </span>
                </div>
                {l.hotelRoom ? (
                  <>
                    <p className="text-sm text-stone-700 font-medium">{l.hotelRoom.hotel.name}</p>
                    <p className="text-xs text-stone-500 mt-0.5">
                      {l.hotelRoom.roomNumber} ({dict.roomType[l.hotelRoom.roomType]})
                    </p>
                  </>
                ) : (
                  <p className="text-sm text-stone-400">房间待分配</p>
                )}
                <p className="text-xs text-stone-400 mt-1">
                  {new Date(l.checkInAt).toLocaleDateString('zh-CN')}
                  {' ~ '}
                  {new Date(l.checkOutAt).toLocaleDateString('zh-CN')}
                </p>
                {l.specialRequests && (
                  <p className="text-xs text-stone-500 mt-1">{l.specialRequests}</p>
                )}
              </Card>
            ))}
          </Section>
        )}

        {/* Catering */}
        {catering.length > 0 && (
          <Section icon={UtensilsCrossed} title="餐饮安排">
            {catering.map((c) => (
              <Card key={c.id}>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-stone-700">
                    {dict.mealType[c.mealType]}
                  </span>
                  {c.diningTable && (
                    <span className="text-xs text-stone-400">{c.diningTable.name}</span>
                  )}
                </div>
                <p className="text-xs text-stone-400 mt-1">
                  {new Date(c.mealTime).toLocaleString('zh-CN', {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
                {c.specialDietary.length > 0 && (
                  <p className="text-xs text-orange-500 mt-1">
                    饮食注意: {c.specialDietary.join(', ')}
                  </p>
                )}
              </Card>
            ))}
          </Section>
        )}

        {/* Agenda */}
        {agendaItems.length > 0 && (
          <Section icon={CalendarDays} title="会议议程">
            {agendaItems.map((a) => (
              <Card key={a.id}>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-stone-700">{a.title}</span>
                  <span className="text-xs text-stone-400 bg-stone-100 px-2 py-0.5 rounded">
                    {dict.agendaType[a.type]}
                  </span>
                </div>
                <p className="text-xs text-stone-400 mt-1">
                  {new Date(a.startAt).toLocaleString('zh-CN', {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                  {' ~ '}
                  {new Date(a.endAt).toLocaleTimeString('zh-CN', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
                {a.venue && (
                  <p className="text-xs text-stone-500 mt-0.5 flex items-center gap-1">
                    <MapPin size={11} /> {a.venue}
                  </p>
                )}
              </Card>
            ))}
          </Section>
        )}

        {/* Gifts */}
        {gifts.length > 0 && (
          <Section icon={Gift} title="礼品">
            {gifts.map((g) => (
              <Card key={g.id}>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-stone-700">
                    {g.gift.name} x{g.quantity}
                  </span>
                  <StatusBadge status={g.status} type="giftStatus" />
                </div>
              </Card>
            ))}
          </Section>
        )}

        {/* Companions */}
        {companions.length > 0 && (
          <Section icon={MapPin} title="陪同人员">
            {companions.map((c) => (
              <Card key={c.id}>
                <p className="text-sm font-medium text-stone-700">{c.companion.name}</p>
                <p className="text-xs text-stone-400 mt-0.5">
                  {c.companion.role}
                  {c.companion.phone && ' · ' + c.companion.phone}
                </p>
                <p className="text-xs text-stone-500">{c.assignmentScope}</p>
              </Card>
            ))}
          </Section>
        )}

        {/* Footer */}
        <p className="text-center text-xs text-stone-300 pt-4 pb-6">如有疑问请联系会务组</p>
      </div>
    </main>
  );
}

function Section({
  icon: Icon,
  title,
  children,
}: {
  icon: LucideIcon;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center gap-1.5 mb-2 px-1">
        <Icon size={14} className="text-stone-400" />
        <h2 className="text-sm font-semibold text-stone-600">{title}</h2>
      </div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return <div className="cmms-card p-3.5">{children}</div>;
}

function StatusBadge({ status, type }: { status: string; type: string }) {
  const label = dict[type as keyof typeof dict]?.[status] ?? status;
  return (
    <span className="text-xs px-2 py-0.5 rounded-full bg-stone-100 text-stone-600">{label}</span>
  );
}

function getRsvpTextColor(status: string): string {
  if (status === 'CONFIRMED') return 'text-green-700';
  if (status === 'DECLINED') return 'text-red-600';
  return 'text-amber-600';
}
