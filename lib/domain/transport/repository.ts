import { prisma } from '@/lib/db/client';
import type { TransportStatus } from '@/lib/generated/prisma/enums';
import type { TransportCreateData, TransportUpdateData } from './types';

// 30 min before + 60 min after pickupTime as conflict window
const CONFLICT_WINDOW_BEFORE_MS = 30 * 60 * 1000;
const CONFLICT_WINDOW_AFTER_MS = 60 * 60 * 1000;

export const transportRepository = {
  async create(data: TransportCreateData) {
    return prisma.transportOrder.create({ data });
  },

  async update(id: string, data: TransportUpdateData) {
    return prisma.transportOrder.update({ where: { id }, data });
  },

  async findById(id: string) {
    return prisma.transportOrder.findUnique({ where: { id } });
  },

  async findByMeeting(meetingId: string) {
    return prisma.transportOrder.findMany({
      where: { meetingId },
      include: {
        meetingGuest: { include: { guest: true } },
        vehicle: true,
      },
      orderBy: { pickupTime: 'asc' },
    });
  },

  /**
   * Find bookings for a vehicle that overlap with [pickupTime - 30min, pickupTime + 60min].
   * Excludes CANCELED and REASSIGNED orders. Optionally excludes a specific order (self).
   */
  async findVehicleBookingsInRange(vehicleId: string, pickupTime: Date, excludeOrderId?: string) {
    const windowStart = new Date(pickupTime.getTime() - CONFLICT_WINDOW_BEFORE_MS);
    const windowEnd = new Date(pickupTime.getTime() + CONFLICT_WINDOW_AFTER_MS);
    return prisma.transportOrder.findMany({
      where: {
        id: excludeOrderId ? { not: excludeOrderId } : undefined,
        vehicleId,
        status: { notIn: ['CANCELED', 'REASSIGNED'] },
        pickupTime: {
          gte: windowStart,
          lte: windowEnd,
        },
      },
    });
  },

  async updateStatus(id: string, status: TransportStatus) {
    return prisma.transportOrder.update({ where: { id }, data: { status } });
  },

  async assign(id: string, vehicleId: string) {
    return prisma.transportOrder.update({
      where: { id },
      data: { vehicleId, status: 'ASSIGNED' },
    });
  },

  async delete(id: string) {
    return prisma.transportOrder.delete({ where: { id } });
  },
};
