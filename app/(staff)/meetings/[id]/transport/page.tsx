import { meetingService } from '@/lib/domain/meeting/service';
import { transportService } from '@/lib/domain/transport/service';
import { vehicleService } from '@/lib/domain/vehicle/service';
import { meetingGuestService } from '@/lib/domain/meeting-guest/service';
import { notFound } from 'next/navigation';
import { TransportList } from './TransportList';
import { NewOrderForm } from './NewOrderForm';
import { MeetingTabs } from '@/components/layout/MeetingTabs';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function TransportPage({ params }: PageProps) {
  const { id } = await params;

  let meeting;
  try {
    meeting = await meetingService.findById(id);
  } catch {
    notFound();
  }

  const [orders, vehicles, meetingGuests] = await Promise.all([
    transportService.listByMeeting(id),
    vehicleService.list({ pageSize: 200 }),
    meetingGuestService.listByMeeting({ meetingId: id, pageSize: 500 }),
  ]);

  return (
    <div className="space-y-6">
      <MeetingTabs meetingId={id} meetingName={meeting.name} />
      <div>
        <h1 className="text-xl font-bold">接送调度</h1>
        <p className="text-sm text-stone-400">
          共 {orders.length} 个接送任务 · 可用车辆 {vehicles.total}
        </p>
      </div>

      <NewOrderForm
        meetingId={id}
        guests={meetingGuests.map((mg) => ({
          id: mg.id,
          name: mg.guest.name,
        }))}
      />

      <TransportList meetingId={id} orders={orders} vehicles={vehicles.items} />
    </div>
  );
}
