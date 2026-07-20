import { meetingService } from '@/lib/domain/meeting/service';
import { ticketService } from '@/lib/domain/ticket/service';
import { meetingGuestService } from '@/lib/domain/meeting-guest/service';
import { notFound } from 'next/navigation';
import { MeetingTabs } from '@/components/layout/MeetingTabs';
import { TicketForm } from './TicketForm';
import { TicketList } from './TicketList';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function TicketsPage({ params }: PageProps) {
  const { id } = await params;

  let meeting;
  try {
    meeting = await meetingService.findById(id);
  } catch {
    notFound();
  }

  const [tickets, meetingGuests] = await Promise.all([
    ticketService.listByMeeting(id),
    meetingGuestService.listByMeeting({ meetingId: id, pageSize: 500 }),
  ]);

  return (
    <div className="space-y-6">
      <MeetingTabs meetingId={id} meetingName={meeting.name} />

      <div>
        <h1 className="text-xl font-bold">订票管理</h1>
        <p className="text-sm text-stone-400">
          共 {tickets.length} 张票 · 创建票务后自动生成到达接送任务
        </p>
      </div>

      <TicketForm
        meetingId={id}
        guests={meetingGuests.map((mg) => ({
          id: mg.id,
          name: mg.guest.name,
        }))}
      />

      <TicketList
        meetingId={id}
        tickets={tickets.map((t) => ({
          id: t.id,
          guestName: t.meetingGuest.guest.name,
          ticketType: t.ticketType,
          tripNo: t.tripNo,
          departureCity: t.departureCity,
          arrivalCity: t.arrivalCity,
          departureAt: t.departureAt.toISOString(),
          arrivalAt: t.arrivalAt.toISOString(),
          cabinClass: t.cabinClass,
          price: t.price,
          paymentMethod: t.paymentMethod,
          status: t.status,
          notes: t.notes,
          transportOrderId: t.transportOrderId,
        }))}
      />
    </div>
  );
}
