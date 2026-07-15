import { lodgingRepository } from './repository';
import { ConflictError, NotFoundError, ValidationError } from '@/lib/shared/errors';
import type { LodgingStatus } from '@/lib/generated/prisma/enums';
import type { LodgingCreateData, LodgingUpdateData } from './types';

const STATUS_TRANSITIONS: Record<LodgingStatus, LodgingStatus[]> = {
  UNASSIGNED: ['RESERVED', 'CANCELED'],
  RESERVED: ['CHECKED_IN', 'ROOM_CHANGED', 'CANCELED'],
  CHECKED_IN: ['CHECKED_OUT', 'ROOM_CHANGED'],
  CHECKED_OUT: [],
  ROOM_CHANGED: ['CHECKED_IN', 'CHECKED_OUT'],
  CANCELED: [],
};

export const lodgingService = {
  async create(data: LodgingCreateData) {
    return lodgingRepository.create(data);
  },

  async assign(orderId: string, roomId: string) {
    const order = await lodgingRepository.findById(orderId);
    if (!order) throw new NotFoundError('LodgingOrder', orderId);

    const conflicts = await lodgingRepository.findRoomBookingsInRange(
      roomId,
      order.checkInAt,
      order.checkOutAt,
      orderId,
    );
    if (conflicts.length > 0) {
      throw new ConflictError('该房间在此日期范围已被预订');
    }
    return lodgingRepository.assign(orderId, roomId);
  },

  async updateStatus(id: string, target: LodgingStatus) {
    const order = await lodgingRepository.findById(id);
    if (!order) throw new NotFoundError('LodgingOrder', id);
    const current = order.status as LodgingStatus;
    if (current === target) throw new ValidationError(`订单已是 ${current} 状态`);
    if (!STATUS_TRANSITIONS[current].includes(target)) {
      throw new ValidationError(`非法状态转换: ${current} -> ${target}`);
    }
    return lodgingRepository.updateStatus(id, target);
  },

  async findById(id: string) {
    const order = await lodgingRepository.findById(id);
    if (!order) throw new NotFoundError('LodgingOrder', id);
    return order;
  },

  async listByMeeting(meetingId: string) {
    return lodgingRepository.findByMeeting(meetingId);
  },

  async delete(id: string) {
    const existing = await lodgingRepository.findById(id);
    if (!existing) throw new NotFoundError('LodgingOrder', id);
    return lodgingRepository.delete(id);
  },
};
