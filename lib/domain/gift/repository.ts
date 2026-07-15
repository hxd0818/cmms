import { prisma } from '@/lib/db/client';
import type { GiftStatus } from '@/lib/generated/prisma/enums';
import type { GiftOrderCreateData } from './types';

export const giftRepository = {
  async createGift(data: { name: string; stock: number; unitPrice?: number }) {
    return prisma.gift.create({ data });
  },
  async findGiftById(id: string) {
    return prisma.gift.findUnique({ where: { id } });
  },
  async listGifts() {
    return prisma.gift.findMany({ orderBy: { name: 'asc' } });
  },
  async deleteGift(id: string) {
    return prisma.gift.delete({ where: { id } });
  },
  async createOrder(data: GiftOrderCreateData) {
    return prisma.giftOrder.create({ data });
  },
  async findOrderById(id: string) {
    return prisma.giftOrder.findUnique({
      where: { id },
      include: { gift: true, meetingGuest: { include: { guest: true } } },
    });
  },
  async findOrdersByMeeting(meetingId: string) {
    return prisma.giftOrder.findMany({
      where: { meetingId },
      include: { gift: true, meetingGuest: { include: { guest: true } } },
      orderBy: { createdAt: 'desc' },
    });
  },
  async updateOrderStatus(id: string, status: GiftStatus) {
    return prisma.giftOrder.update({
      where: { id },
      data: { status, deliveredAt: status === 'DELIVERED' ? new Date() : undefined },
    });
  },
  async deleteOrder(id: string) {
    return prisma.giftOrder.delete({ where: { id } });
  },
};
