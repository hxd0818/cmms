import { prisma } from '@/lib/db/client';
import type { TicketStatus, TicketType, PaymentMethod } from '@/lib/generated/prisma/enums';
import type { TicketCreateData, TicketUpdateData } from './types';

export interface TicketWithGuest {
  id: string;
  meetingId: string;
  meetingGuestId: string;
  ticketType: TicketType;
  tripNo: string;
  ticketNo: string | null;
  departureCity: string;
  arrivalCity: string;
  departureAt: Date;
  arrivalAt: Date;
  cabinClass: string | null;
  price: number | null;
  paymentMethod: PaymentMethod;
  status: TicketStatus;
  transportOrderId: string | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  meetingGuest: {
    id: string;
    guest: { id: string; name: string };
  };
}

export const ticketRepository = {
  async create(data: TicketCreateData) {
    return prisma.ticketOrder.create({ data });
  },

  async findById(id: string) {
    return prisma.ticketOrder.findUnique({ where: { id } });
  },

  /**
   * Find tickets by meeting, joining meetingGuest + guest manually since the
   * TicketOrder model does not declare a Prisma relation to MeetingGuest.
   */
  async findByMeeting(meetingId: string): Promise<TicketWithGuest[]> {
    const tickets = await prisma.ticketOrder.findMany({
      where: { meetingId },
      orderBy: { departureAt: 'asc' },
    });

    if (tickets.length === 0) return [];

    const guestIds = Array.from(new Set(tickets.map((t) => t.meetingGuestId)));
    const meetingGuests = await prisma.meetingGuest.findMany({
      where: { id: { in: guestIds } },
      include: { guest: true },
    });
    const guestMap = new Map(meetingGuests.map((mg) => [mg.id, mg]));

    return tickets.map((t) => {
      const mg = guestMap.get(t.meetingGuestId);
      return {
        id: t.id,
        meetingId: t.meetingId,
        meetingGuestId: t.meetingGuestId,
        ticketType: t.ticketType,
        tripNo: t.tripNo,
        ticketNo: t.ticketNo,
        departureCity: t.departureCity,
        arrivalCity: t.arrivalCity,
        departureAt: t.departureAt,
        arrivalAt: t.arrivalAt,
        cabinClass: t.cabinClass,
        price: t.price ? Number(t.price) : null,
        paymentMethod: t.paymentMethod,
        status: t.status,
        transportOrderId: t.transportOrderId,
        notes: t.notes,
        createdAt: t.createdAt,
        updatedAt: t.updatedAt,
        meetingGuest: mg
          ? { id: mg.id, guest: { id: mg.guest.id, name: mg.guest.name } }
          : { id: t.meetingGuestId, guest: { id: '', name: '(unknown)' } },
      };
    });
  },

  async update(id: string, data: TicketUpdateData) {
    return prisma.ticketOrder.update({ where: { id }, data });
  },

  async updateStatus(id: string, status: TicketStatus) {
    return prisma.ticketOrder.update({ where: { id }, data: { status } });
  },

  async delete(id: string) {
    return prisma.ticketOrder.delete({ where: { id } });
  },
};
