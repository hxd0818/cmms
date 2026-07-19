import { prisma } from '@/lib/db/client';
import { notFound } from 'next/navigation';
import { CompanionPortal } from './CompanionPortal';

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

  // Load each guest's full task data
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

    return {
      mgId,
      assignmentId: assignments.find((a) => a.meetingGuestId === mgId)?.id ?? '',
      meetingId,
      scope: assignments.find((a) => a.meetingGuestId === mgId)?.assignmentScope ?? 'FULL',
      guestName: mg.guest.name,
      guestLevel: mg.guest.level,
      guestCompany: mg.guest.company,
      guestTitle: mg.guest.title,
      guestPhone: mg.guest.phone,
      guestGender: mg.guest.gender,
      dietaryTags: mg.guest.dietaryTags,
      meetingName: meetingMap.get(meetingId)?.name ?? '',
      meetingStart: meetingMap.get(meetingId)?.startAt.toISOString() ?? '',
      meetingEnd: meetingMap.get(meetingId)?.endAt.toISOString() ?? '',
      meetingVenue: meetingMap.get(meetingId)?.venue ?? '',
      transport: transport.map((t) => ({
        pickupType: t.pickupType,
        pickupLocation: t.pickupLocation,
        dropoffLocation: t.dropoffLocation,
        pickupTime: t.pickupTime.toISOString(),
        flightNo: t.flightNo,
        status: t.status,
        plateNo: t.vehicle?.plateNo ?? null,
        driverName: t.vehicle?.driverName ?? null,
        driverPhone: t.vehicle?.driverPhone ?? null,
      })),
      lodging: lodging.map((l) => ({
        hotelName: l.hotelRoom?.hotel.name ?? null,
        roomNumber: l.hotelRoom?.roomNumber ?? null,
        roomType: l.hotelRoom?.roomType ?? null,
        checkIn: l.checkInAt.toISOString(),
        checkOut: l.checkOutAt.toISOString(),
      })),
      catering: catering.map((c) => ({
        mealType: c.mealType,
        mealTime: c.mealTime.toISOString(),
        tableName: c.diningTable?.name ?? null,
        dietary: c.specialDietary,
      })),
      agenda: agenda.map((a) => ({
        title: a.title,
        type: a.type,
        start: a.startAt.toISOString(),
        end: a.endAt.toISOString(),
        venue: a.venue,
      })),
    };
  });

  const guestDataList = (await Promise.all(guestDataPromises)).filter(Boolean) as NonNullable<
    Awaited<(typeof guestDataPromises)[0]>
  >[];

  return (
    <CompanionPortal
      companionName={companion.name}
      companionRole={companion.role}
      companionPhone={companion.phone}
      companionLanguages={companion.languages}
      guests={guestDataList}
    />
  );
}
