import { prisma } from '@/lib/db/client';
import { ticketRepository } from './repository';
import { NotFoundError, ValidationError } from '@/lib/shared/errors';
import type { TicketStatus, TicketType } from '@/lib/generated/prisma/enums';
import type { TicketCreateData } from './types';

const STATUS_TRANSITIONS: Record<TicketStatus, TicketStatus[]> = {
  PENDING: ['BOOKED', 'CANCELED'],
  BOOKED: ['CONFIRMED', 'CANCELED'],
  CONFIRMED: ['TICKETED', 'CANCELED'],
  TICKETED: ['CANCELED'],
  CANCELED: [],
};

function buildPickupLocation(ticketType: TicketType, arrivalCity: string): string {
  const suffix = ticketType === 'FLIGHT' ? '机场' : '火车站';
  return `${arrivalCity}${suffix}`;
}

export const ticketService = {
  /**
   * Create a ticket order and atomically generate a linked transport order draft.
   * The transport order serves as the ground-handoff pickup at the arrival station.
   */
  async create(data: TicketCreateData) {
    return prisma.$transaction(async (tx) => {
      const ticket = await tx.ticketOrder.create({ data });

      const pickupType = data.ticketType === 'FLIGHT' ? 'AIRPORT' : 'TRAINSTATION';
      const transport = await tx.transportOrder.create({
        data: {
          meetingId: data.meetingId,
          meetingGuestId: data.meetingGuestId,
          pickupType,
          pickupLocation: buildPickupLocation(data.ticketType, data.arrivalCity),
          pickupTime: data.arrivalAt,
          dropoffLocation: '待确认',
          flightNo: data.tripNo,
          status: 'UNASSIGNED',
        },
      });

      const updated = await tx.ticketOrder.update({
        where: { id: ticket.id },
        data: { transportOrderId: transport.id },
      });

      return updated;
    });
  },

  async findById(id: string) {
    const ticket = await ticketRepository.findById(id);
    if (!ticket) throw new NotFoundError('TicketOrder', id);
    return ticket;
  },

  async listByMeeting(meetingId: string) {
    return ticketRepository.findByMeeting(meetingId);
  },

  async updateStatus(id: string, target: TicketStatus) {
    const existing = await ticketRepository.findById(id);
    if (!existing) throw new NotFoundError('TicketOrder', id);

    const current = existing.status as TicketStatus;
    if (current === target) {
      throw new ValidationError(`订单已是 ${current} 状态`);
    }
    if (!STATUS_TRANSITIONS[current].includes(target)) {
      throw new ValidationError(`非法状态转换: ${current} -> ${target}`);
    }
    return ticketRepository.updateStatus(id, target);
  },

  async delete(id: string) {
    const existing = await ticketRepository.findById(id);
    if (!existing) throw new NotFoundError('TicketOrder', id);

    // Unlink transport order reference before deletion (transport order lifecycle is independent).
    return prisma.$transaction(async (tx) => {
      if (existing.transportOrderId) {
        await tx.ticketOrder.update({
          where: { id },
          data: { transportOrderId: null },
        });
      }
      return tx.ticketOrder.delete({ where: { id } });
    });
  },
};
