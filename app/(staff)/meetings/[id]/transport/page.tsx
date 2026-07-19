import { meetingService } from '@/lib/domain/meeting/service';
import { transportService } from '@/lib/domain/transport/service';
import { vehicleRepository } from '@/lib/domain/vehicle/repository';
import { meetingGuestService } from '@/lib/domain/meeting-guest/service';
import { notFound } from 'next/navigation';
import { TransportList } from './TransportList';
import { TransportBoard } from './TransportBoard';
import { NewOrderForm } from './NewOrderForm';
import { NewVehicleForm } from './NewVehicleForm';
import { MeetingTabs } from '@/components/layout/MeetingTabs';
import { ViewToggle } from '@/components/shared/ViewToggle';

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ view?: string }>;
}

export default async function TransportPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const { view } = await searchParams;
  const boardMode = view === 'board';

  let meeting;
  try {
    meeting = await meetingService.findById(id);
  } catch {
    notFound();
  }

  const [orders, vehicles, meetingGuests] = await Promise.all([
    transportService.listByMeeting(id),
    vehicleRepository.listByMeeting(id),
    meetingGuestService.listByMeeting({ meetingId: id, pageSize: 500 }),
  ]);

  // Filter unassigned orders for the board
  const unassignedOrders = orders.filter((o) => o.status === 'UNASSIGNED');

  return (
    <div className="space-y-6">
      <MeetingTabs meetingId={id} meetingName={meeting.name} />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">接送调度</h1>
          <p className="text-sm text-stone-400">
            共 {orders.length} 个任务 · 待分配 {unassignedOrders.length} · 车辆 {vehicles.length}
          </p>
        </div>
        <ViewToggle basePath={`/meetings/${id}/transport`} boardMode={boardMode} />
      </div>

      {boardMode ? (
        <>
          {unassignedOrders.length > 0 ? (
            <TransportBoard
              meetingId={id}
              orders={unassignedOrders.map((o) => ({
                id: o.id,
                guestName: o.meetingGuest.guest.name,
                level: o.meetingGuest.levelOverride ?? o.meetingGuest.guest.level,
                pickupType: o.pickupType,
                pickupLocation: o.pickupLocation,
                dropoffLocation: o.dropoffLocation,
                pickupTime: o.pickupTime.toISOString(),
              }))}
              vehicles={vehicles.map((v) => ({
                id: v.id,
                plateNo: v.plateNo,
                type: v.type,
                capacity: v.capacity,
                driverName: v.driverName,
                driverPhone: v.driverPhone,
                belongs: v.belongs,
              }))}
            />
          ) : (
            <div className="cmms-card p-8 text-center">
              <p className="text-sm text-stone-400">全部订单已分配车辆</p>
            </div>
          )}
        </>
      ) : (
        <>
          <NewOrderForm
            meetingId={id}
            guests={meetingGuests.map((mg) => ({ id: mg.id, name: mg.guest.name }))}
          />
          <NewVehicleForm meetingId={id} />
          <TransportList meetingId={id} orders={orders} vehicles={vehicles} />
        </>
      )}
    </div>
  );
}
