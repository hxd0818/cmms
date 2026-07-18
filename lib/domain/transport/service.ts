import { transportRepository } from './repository';
import { vehicleRepository } from '@/lib/domain/vehicle/repository';
import { meetingGuestRepository } from '@/lib/domain/meeting-guest/repository';
import { feeService } from '@/lib/domain/fee/service';
import { ConflictError, NotFoundError, ValidationError } from '@/lib/shared/errors';
import type { TransportStatus } from '@/lib/generated/prisma/enums';
import type { TransportCreateData, TransportUpdateData } from './types';

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

    // Find existing bookings on same vehicle in time window (for shared ride)
    const existingBookings = await transportRepository.findVehicleBookingsInRange(
      vehicleId,
      order.pickupTime,
      orderId,
    );

    // Calculate seats already taken by existing bookings
    let occupiedSeats = 0;
    for (const booking of existingBookings) {
      const bookingSubs = await meetingGuestRepository.findSubordinates(booking.meetingGuestId);
      occupiedSeats += 1 + bookingSubs.filter((s) => s.inheritTransport).length;
    }

    // Calculate seats needed for THIS order
    const subordinates = await meetingGuestRepository.findSubordinates(order.meetingGuestId);
    const inheritSubs = subordinates.filter((s) => s.inheritTransport);
    const seatsNeeded = 1 + inheritSubs.length;

    const vehicle = await vehicleRepository.findById(vehicleId);
    if (!vehicle) throw new NotFoundError('Vehicle', vehicleId);

    // Check total capacity (existing + new)
    if (occupiedSeats + seatsNeeded > vehicle.capacity) {
      throw new ValidationError(
        `车辆座位不足: 已占 ${occupiedSeats} + 本次需求 ${seatsNeeded} = ${occupiedSeats + seatsNeeded} > 容量 ${vehicle.capacity}`,
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
      throw new ValidationError(`非法状态转换: ${current} -> ${target}`);
    }
    const updated = await transportRepository.updateStatus(id, target);

    // Auto-generate fee when transport completes
    if (target === 'COMPLETED') {
      await feeService.create({
        meetingId: order.meetingId,
        meetingGuestId: order.meetingGuestId,
        category: 'TRANSPORT',
        amount: 0, // actual cost recorded by finance later
        notes: 'Transport auto-fee: ' + order.pickupLocation + ' -> ' + order.dropoffLocation,
        createdBy: 'system',
      }).catch(() => {}); // fire-and-forget, don't block on fee errors
    }

    return updated;
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

  /**
   * Check vehicle seat availability for a given pickup time.
   * Returns occupied seats, existing passengers, and remaining capacity.
   * Used by UI to show ride-sharing info before assignment.
   */
  async checkVehicleAvailability(vehicleId: string, pickupTime: Date) {
    const vehicle = await vehicleRepository.findById(vehicleId);
    if (!vehicle) throw new NotFoundError('Vehicle', vehicleId);

    const bookings = await transportRepository.findVehicleBookingsInRange(vehicleId, pickupTime);

    let occupiedSeats = 0;
    const passengers: Array<{ orderId: string; meetingGuestId: string; seats: number }> = [];

    for (const b of bookings) {
      const subs = await meetingGuestRepository.findSubordinates(b.meetingGuestId);
      const seats = 1 + subs.filter((s) => s.inheritTransport).length;
      occupiedSeats += seats;
      passengers.push({ orderId: b.id, meetingGuestId: b.meetingGuestId, seats });
    }

    return {
      vehicleCapacity: vehicle.capacity,
      occupiedSeats,
      remainingSeats: vehicle.capacity - occupiedSeats,
      hasOtherPassengers: bookings.length > 0,
      passengerCount: bookings.length,
    };
  },
};
