import { prisma } from '@/lib/db/client';
import type { RoomType } from '@/lib/generated/prisma/enums';

export const hotelRepository = {
  async create(data: { meetingId: string; name: string; address: string; contactPhone?: string }) {
    return prisma.hotel.create({ data });
  },

  async findById(id: string) {
    return prisma.hotel.findUnique({
      where: { id },
      include: { rooms: { orderBy: { roomNumber: 'asc' } } },
    });
  },

  async listByMeeting(meetingId: string) {
    return prisma.hotel.findMany({
      where: { meetingId },
      include: { _count: { select: { rooms: true } } },
      orderBy: { name: 'asc' },
    });
  },

  async addRoom(hotelId: string, roomNumber: string, roomType: RoomType) {
    return prisma.hotelRoom.create({
      data: { hotelId, roomNumber, roomType },
    });
  },

  async findRoomsByMeeting(meetingId: string) {
    return prisma.hotelRoom.findMany({
      where: { hotel: { meetingId } },
      include: { hotel: true },
      orderBy: [{ hotel: { name: 'asc' } }, { roomNumber: 'asc' }],
    });
  },

  async deleteRoom(id: string) {
    return prisma.hotelRoom.delete({ where: { id } });
  },
};
