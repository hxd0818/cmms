import { cateringRepository } from './repository';
import { prisma } from '@/lib/db/client';
import { NotFoundError, ValidationError } from '@/lib/shared/errors';
import type { CateringCreateData } from './types';

export const cateringService = {
  async create(data: CateringCreateData) {
    // Sync dietary tags from guest
    const mg = await prisma.meetingGuest.findUnique({
      where: { id: data.meetingGuestId },
      include: { guest: true },
    });
    if (!mg) throw new NotFoundError('MeetingGuest', data.meetingGuestId);

    return cateringRepository.create({
      ...data,
      specialDietary: mg.guest.dietaryTags ?? [],
    });
  },

  async assignTable(orderId: string, tableId: string) {
    const order = await cateringRepository.findById(orderId);
    if (!order) throw new NotFoundError('CateringOrder', orderId);

    const table = await prisma.diningTable.findUnique({ where: { id: tableId } });
    if (!table) throw new NotFoundError('DiningTable', tableId);

    const existing = await cateringRepository.countTableAssignments(tableId, order.mealTime);
    if (existing + 1 > table.capacity) {
      throw new ValidationError(`餐桌容量 ${table.capacity}，已分配 ${existing} 人`);
    }
    return cateringRepository.assignTable(orderId, tableId);
  },

  async findById(id: string) {
    const order = await cateringRepository.findById(id);
    if (!order) throw new NotFoundError('CateringOrder', id);
    return order;
  },

  async listByMeeting(meetingId: string) {
    return cateringRepository.findByMeeting(meetingId);
  },

  async delete(id: string) {
    const existing = await cateringRepository.findById(id);
    if (!existing) throw new NotFoundError('CateringOrder', id);
    return cateringRepository.delete(id);
  },
};
