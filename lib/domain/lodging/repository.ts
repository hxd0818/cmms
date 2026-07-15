import { prisma } from '@/lib/db/client';
import type { LodgingStatus } from '@/lib/generated/prisma/enums';
import type { LodgingCreateData, LodgingUpdateData } from './types';

export const lodgingRepository = {
  async create(data: LodgingCreateData) {
    return prisma.lodgingOrder.create({ data });
  },
  async findById(id: string) {
    return prisma.lodgingOrder.findUnique({ where: { id } });
  },
  async findByMeeting(meetingId: string) {
    return prisma.lodgingOrder.findMany({
      where: { meetingId },
      include: {
        meetingGuest: { include: { guest: true } },
        hotelRoom: { include: { hotel: true } },
      },
      orderBy: { checkInAt: 'asc' },
    });
  },
  async findRoomBookingsInRange(
    roomId: string,
    checkInAt: Date,
    checkOutAt: Date,
    excludeOrderId?: string,
  ) {
    return prisma.lodgingOrder.findMany({
      where: {
        id: excludeOrderId ? { not: excludeOrderId } : undefined,
        hotelRoomId: roomId,
        status: { notIn: ['CANCELED'] },
        AND: [{ checkInAt: { lt: checkOutAt } }, { checkOutAt: { gt: checkInAt } }],
      },
    });
  },
  async assign(id: string, roomId: string) {
    return prisma.lodgingOrder.update({
      where: { id },
      data: { hotelRoomId: roomId, status: 'RESERVED' },
    });
  },
  async updateStatus(id: string, status: LodgingStatus) {
    return prisma.lodgingOrder.update({ where: { id }, data: { status } });
  },
  async delete(id: string) {
    return prisma.lodgingOrder.delete({ where: { id } });
  },
};
