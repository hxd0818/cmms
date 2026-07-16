import { meetingGuestService } from '@/lib/domain/meeting-guest/service';
import { prisma } from '@/lib/db/client';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { GuestManager } from './GuestManager';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function MeetingGuestsPage({ params }: PageProps) {
  const { id } = await params;

  let meetingGuests;
  try {
    meetingGuests = await meetingGuestService.listByMeeting({
      meetingId: id,
      pageSize: 500,
    });
  } catch {
    notFound();
  }

  // Pre-load all tasks for this meeting, grouped by meetingGuestId
  const mgIds = meetingGuests.map((mg) => mg.id);
  const [transport, lodging, catering, gifts, companions, fees] = await Promise.all([
    prisma.transportOrder.findMany({
      where: { meetingId: id },
      include: { vehicle: true },
    }),
    prisma.lodgingOrder.findMany({
      where: { meetingId: id },
      include: { hotelRoom: { include: { hotel: true } } },
    }),
    prisma.cateringOrder.findMany({
      where: { meetingId: id },
      include: { diningTable: true },
    }),
    prisma.giftOrder.findMany({
      where: { meetingId: id },
      include: { gift: true },
    }),
    prisma.companionAssignment.findMany({
      where: { meetingId: id },
      include: { companion: true },
    }),
    prisma.feeRecord.findMany({ where: { meetingId: id } }),
  ]);

  // Build lookup maps
  const tasksByGuestId: Record<
    string,
    {
      transport: typeof transport;
      lodging: typeof lodging;
      catering: typeof catering;
      gifts: typeof gifts;
      companions: typeof companions;
      fees: typeof fees;
    }
  > = {};

  for (const mg of meetingGuests) {
    tasksByGuestId[mg.id] = {
      transport: transport.filter((t) => t.meetingGuestId === mg.id),
      lodging: lodging.filter((l) => l.meetingGuestId === mg.id),
      catering: catering.filter((c) => c.meetingGuestId === mg.id),
      gifts: gifts.filter((g) => g.meetingGuestId === mg.id),
      companions: companions.filter((c) => c.meetingGuestId === mg.id),
      fees: fees.filter((f) => f.meetingGuestId === mg.id),
    };
  }

  const primary = meetingGuests.filter((mg) => !mg.primaryMeetingGuestId);
  const subordinate = meetingGuests.filter((mg) => mg.primaryMeetingGuestId);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">嘉宾管理</h1>
          <p className="text-sm text-stone-400">
            主嘉宾 {primary.length} 位，随行 {subordinate.length} 位
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href={`/meetings/${id}/guests/import`}
            className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}
          >
            批量导入
          </Link>
        </div>
      </div>
      <GuestManager meetingId={id} meetingGuests={meetingGuests} tasksByGuestId={tasksByGuestId} />
    </div>
  );
}
