import { meetingService } from '@/lib/domain/meeting/service';
import { vehicleRepository } from '@/lib/domain/vehicle/repository';
import { hotelRepository } from '@/lib/domain/hotel/repository';
import { prisma } from '@/lib/db/client';
import { notFound } from 'next/navigation';
import { MeetingTabs } from '@/components/layout/MeetingTabs';
import { dict } from '@/lib/shared/dictionary';
import { VehicleManager } from './VehicleManager';
import { HotelRoomManager } from './HotelRoomManager';
import { DiningTableManager } from './DiningTableManager';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ResourcesPage({ params }: PageProps) {
  const { id } = await params;

  let meeting;
  try {
    meeting = await meetingService.findById(id);
  } catch {
    notFound();
  }

  const [vehicles, hotels, diningTables] = await Promise.all([
    vehicleRepository.listByMeeting(id),
    hotelRepository.listByMeeting(id),
    prisma.diningTable.findMany({ where: { meetingId: id }, orderBy: { name: 'asc' } }),
  ]);

  // Get all rooms for all hotels
  const hotelIds = hotels.map((h) => h.id);
  const rooms =
    hotelIds.length > 0
      ? await prisma.hotelRoom.findMany({
          where: { hotelId: { in: hotelIds } },
          include: { hotel: true },
          orderBy: [{ hotel: { name: 'asc' } }, { roomNumber: 'asc' }],
        })
      : [];

  return (
    <div className="space-y-6">
      <MeetingTabs meetingId={id} meetingName={meeting.name} />

      <div>
        <h1 className="text-xl font-bold">资源管理</h1>
        <p className="text-sm text-stone-400">管理本会议的车辆、酒店房间和餐桌</p>
      </div>

      {/* Vehicles */}
      <VehicleManager meetingId={id} initialVehicles={vehicles} />

      {/* Hotels + Rooms */}
      <HotelRoomManager meetingId={id} initialHotels={hotels} initialRooms={rooms} />

      {/* Dining Tables */}
      <DiningTableManager meetingId={id} initialTables={diningTables} />
    </div>
  );
}
