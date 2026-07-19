import { meetingService } from '@/lib/domain/meeting/service';
import { lodgingService } from '@/lib/domain/lodging/service';
import { hotelRepository } from '@/lib/domain/hotel/repository';
import { meetingGuestService } from '@/lib/domain/meeting-guest/service';
import { notFound } from 'next/navigation';
import { LodgingList } from './LodgingList';
import { LodgingBoard } from './LodgingBoard';
import { NewOrderForm } from './NewOrderForm';
import { HotelManager } from './HotelManager';
import { MeetingTabs } from '@/components/layout/MeetingTabs';
import { ViewToggle } from '@/components/shared/ViewToggle';

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ view?: string }>;
}

export default async function LodgingPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const { view } = await searchParams;
  const boardMode = view === 'board';

  let meeting;
  try {
    meeting = await meetingService.findById(id);
  } catch {
    notFound();
  }

  const [orders, rooms, hotels, meetingGuests] = await Promise.all([
    lodgingService.listByMeeting(id),
    hotelRepository.findRoomsByMeeting(id),
    hotelRepository.listByMeeting(id),
    meetingGuestService.listByMeeting({ meetingId: id, pageSize: 500 }),
  ]);

  // Filter unassigned orders for the board
  const unassignedOrders = orders.filter((o) => o.hotelRoomId === null);

  return (
    <div className="space-y-6">
      <MeetingTabs meetingId={id} meetingName={meeting.name} />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">住宿管理</h1>
          <p className="text-sm text-stone-400">
            共 {orders.length} 个住宿订单 · 待分配 {unassignedOrders.length} · {hotels.length}{' '}
            家酒店 · {rooms.length} 间房
          </p>
        </div>
        <ViewToggle basePath={`/meetings/${id}/lodging`} boardMode={boardMode} />
      </div>

      {boardMode ? (
        <>
          {unassignedOrders.length > 0 ? (
            <LodgingBoard
              meetingId={id}
              orders={unassignedOrders.map((o) => ({
                id: o.id,
                guestName: o.meetingGuest.guest.name,
                level: o.meetingGuest.levelOverride ?? o.meetingGuest.guest.level,
                checkInAt: o.checkInAt.toISOString(),
                checkOutAt: o.checkOutAt.toISOString(),
              }))}
              rooms={rooms.map((r) => ({
                id: r.id,
                hotelName: r.hotel.name,
                roomNumber: r.roomNumber,
                roomType: r.roomType,
                status: r.status,
              }))}
            />
          ) : (
            <div className="cmms-card p-8 text-center">
              <p className="text-sm text-stone-400">全部订单已分配房间</p>
            </div>
          )}
        </>
      ) : (
        <>
          <NewOrderForm
            meetingId={id}
            guests={meetingGuests.map((mg) => ({
              id: mg.id,
              name: mg.guest.name,
            }))}
          />

          <HotelManager meetingId={id} initialHotels={hotels} />

          <LodgingList meetingId={id} orders={orders} rooms={rooms} />
        </>
      )}
    </div>
  );
}
