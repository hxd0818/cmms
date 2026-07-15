import { prisma } from '@/lib/db/client';
import type { CateringStatus } from '@/lib/generated/prisma/enums';
import type { CateringCreateData } from './types';

export const cateringRepository = {
  async create(data: CateringCreateData) {
    return prisma.cateringOrder.create({ data });
  },
  async findById(id: string) {
    return prisma.cateringOrder.findUnique({ where: { id } });
  },
  async findByMeeting(meetingId: string) {
    return prisma.cateringOrder.findMany({
      where: { meetingId },
      include: {
        meetingGuest: { include: { guest: true } },
        diningTable: true,
      },
      orderBy: { mealTime: 'asc' },
    });
  },
  async countTableAssignments(tableId: string, mealTime: Date) {
    // Count assigned orders for same meal time window (±2 hours)
    const start = new Date(mealTime.getTime() - 2 * 60 * 60 * 1000);
    const end = new Date(mealTime.getTime() + 2 * 60 * 60 * 1000);
    return prisma.cateringOrder.count({
      where: {
        diningTableId: tableId,
        status: { notIn: ['CANCELED'] },
        mealTime: { gte: start, lte: end },
      },
    });
  },
  async assignTable(id: string, tableId: string) {
    return prisma.cateringOrder.update({
      where: { id },
      data: { diningTableId: tableId },
    });
  },
  async updateStatus(id: string, status: CateringStatus) {
    return prisma.cateringOrder.update({ where: { id }, data: { status } });
  },
  async delete(id: string) {
    return prisma.cateringOrder.delete({ where: { id } });
  },
};
