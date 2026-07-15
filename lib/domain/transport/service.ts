import { transportRepository } from './repository';
import { vehicleRepository } from '@/lib/domain/vehicle/repository';
import { meetingGuestRepository } from '@/lib/domain/meeting-guest/repository';
import {
  ConflictError,
  NotFoundError,
  ValidationError,
} from '@/lib/shared/errors';
import type { TransportStatus } from '@/lib/generated/prisma/enums';
import type {
  TransportCreateData,
  TransportUpdateData,
} from './types';

const STATUS_TRANSITIONS: Record<TransportStatus, TransportStatus[]> = {
  UNASSIGNED: ['ASSIGNED', 'CANCELED'],
  ASSIGNED: ['EN_ROUTE', 'REASSIGNED', 'CANCELED'],
  EN_ROUTE: ['PICKED_UP', 'CANCELED'],
  PICKED_UP: ['COMPLETED'],
  COMPLETED: [],
  REASSIGNED: ['ASSIGNED', 'CANCELED'],
  CANCELED: [],
};

export const transportService = {
  async create(data: TransportCreateData) {
    return transportRepository.create(data);
  },

  async update(id: string, data: TransportUpdateData) {
    const existing = await transportRepository.findById(id);
    if (!existing) throw new NotFoundError('TransportOrder', id);
    return transportRepository.update(id, data);
  },

  async assign(orderId: string, vehicleId: string) {
    const order = await transportRepository.findById(orderId);
    if (!order) throw new NotFoundError('TransportOrder', orderId);

    // Conflict check
    const conflicts = await transportRepository.findVehicleBookingsInRange(
      vehicleId,
      order.pickupTime,
      orderId,
    );
    if (conflicts.length > 0) {
      throw new ConflictError(
        `车辆在此时间段已被占用（前后 30/60 分钟窗口内已有任务）`,
      );
    }

    // Capacity check: main + subordinates with inheritTransport
    const subordinates = await meetingGuestRepository.findSubordinates(
      order.meetingGuestId,
    );
    const inheritSubs = subordinates.filter((s) => s.inheritTransport);
    const totalNeeded = 1 + inheritSubs.length;

    const vehicle = await vehicleRepository.findById(vehicleId);
    if (!vehicle) throw new NotFoundError('Vehicle', vehicleId);

    if (vehicle.capacity < totalNeeded) {
      throw new ValidationError(
        `车辆容量 ${vehicle.capacity} < 需求 ${totalNeeded}（含 ${inheritSubs.length} 位同车随行）`,
      );
    }

    return transportRepository.assign(orderId, vehicleId);
  },

  async updateStatus(id: string, target: TransportStatus) {
    const order = await transportRepository.findById(id);
    if (!order) throw new NotFoundError('TransportOrder', id);

    const current = order.status as TransportStatus;
    if (current === target) {
      throw new ValidationError(`订单已是 ${current} 状态`);
    }
    if (!STATUS_TRANSITIONS[current].includes(target)) {
      throw new ValidationError(
        `非法状态转换: ${current} -> ${target}`,
      );
    }
    return transportRepository.updateStatus(id, target);
  },

  async findById(id: string) {
    const order = await transportRepository.findById(id);
    if (!order) throw new NotFoundError('TransportOrder', id);
    return order;
  },

  async listByMeeting(meetingId: string) {
    return transportRepository.findByMeeting(meetingId);
  },

  async delete(id: string) {
    const existing = await transportRepository.findById(id);
    if (!existing) throw new NotFoundError('TransportOrder', id);
    return transportRepository.delete(id);
  },
};
