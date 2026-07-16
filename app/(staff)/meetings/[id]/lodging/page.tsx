import { meetingService } from '@/lib/domain/meeting/service';
import { lodgingService } from '@/lib/domain/lodging/service';
import { hotelService } from '@/lib/domain/hotel/service';
import { meetingGuestService } from '@/lib/domain/meeting-guest/service';
import { notFound } from 'next/navigation';
import { LodgingList } from './LodgingList';
import { NewOrderForm } from './NewOrderForm';
import { MeetingTabs } from '@/components/layout/MeetingTabs';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function LodgingPage({ params }: PageProps) {
  const { id } = await params;

  let meeting;
  try {
    meeting = await meetingService.findById(id);
  } catch {
    notFound();
  }

  const [orders, availableRooms, meetingGuests] = await Promise.all([
    lodgingService.listByMeeting(id),
    hotelService.findAvailableRooms(),
    meetingGuestService.listByMeeting({ meetingId: id, pageSize: 500 }),
  ]);

  return (
    <div className="space-y-6">
      <MeetingTabs meetingId={id} meetingName={meeting.name} />
      <div>
        <h1 className="text-xl font-bold">住宿管理</h1>
        <p className="text-sm text-slate-500">共 {orders.length} 个住宿订单</p>
      </div>

      <NewOrderForm
        meetingId={id}
        guests={meetingGuests.map((mg) => ({
          id: mg.id,
          name: mg.guest.name,
        }))}
      />

      <LodgingList meetingId={id} orders={orders} rooms={availableRooms} />
    </div>
  );
}
