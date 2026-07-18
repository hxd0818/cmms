import { giftRepository } from './repository';
import { prisma } from '@/lib/db/client';
import { feeService } from '@/lib/domain/fee/service';
import { ConflictError, NotFoundError } from '@/lib/shared/errors';
import type { GiftStatus } from '@/lib/generated/prisma/enums';
import type { GiftOrderCreateData } from './types';

export const giftService = {
  async createGift(data: { name: string; stock: number; unitPrice?: number }) {
    return giftRepository.createGift(data);
  },

  async listGifts() {
    return giftRepository.listGifts();
  },

  async createOrder(data: GiftOrderCreateData) {
    const gift = await giftRepository.findGiftById(data.giftId);
    if (!gift) throw new NotFoundError('Gift', data.giftId);
    if (gift.stock < (data.quantity ?? 1)) {
      throw new ConflictError(`礼品「${gift.name}」库存不足（剩 ${gift.stock}）`);
    }
    return giftRepository.createOrder({ ...data, quantity: data.quantity ?? 1 });
  },

  async deliverOrder(orderId: string) {
    const order = await giftRepository.findOrderById(orderId);
    if (!order) throw new NotFoundError('GiftOrder', orderId);
    if (order.status !== 'PENDING') {
      throw new ConflictError(`订单状态为 ${order.status}，不可发放`);
    }
    // Transaction: decrement stock + mark delivered
    await prisma.$transaction([
      prisma.gift.update({
        where: { id: order.giftId },
        data: { stock: { decrement: order.quantity } },
      }),
      prisma.giftOrder.update({
        where: { id: orderId },
        data: { status: 'DELIVERED' as GiftStatus, deliveredAt: new Date() },
      }),
    ]);

    // Auto-generate fee for gift delivery
    const unitPrice = order.gift.unitPrice ? Number(order.gift.unitPrice) : 0;
    await feeService
      .create({
        meetingId: order.meetingId,
        meetingGuestId: order.meetingGuestId,
        category: 'GIFT',
        amount: unitPrice * order.quantity,
        notes: 'Gift auto-fee: ' + order.gift.name + ' x' + order.quantity,
        createdBy: 'system',
      })
      .catch(() => {});

    return order;
  },

  async listOrdersByMeeting(meetingId: string) {
    return giftRepository.findOrdersByMeeting(meetingId);
  },

  async deleteOrder(id: string) {
    const existing = await giftRepository.findOrderById(id);
    if (!existing) throw new NotFoundError('GiftOrder', id);
    return giftRepository.deleteOrder(id);
  },
};
