import type { TicketOrder } from '@/lib/generated/prisma/client';
import type { TicketType, TicketStatus, PaymentMethod } from '@/lib/generated/prisma/enums';

export type TicketOrderEntity = TicketOrder;

export interface TicketCreateData {
  meetingId: string;
  meetingGuestId: string;
  ticketType: TicketType;
  tripNo: string;
  departureCity: string;
  arrivalCity: string;
  departureAt: Date;
  arrivalAt: Date;
  cabinClass?: string;
  price?: number;
  paymentMethod?: PaymentMethod;
  notes?: string;
}

export interface TicketUpdateData {
  ticketType?: TicketType;
  tripNo?: string;
  ticketNo?: string;
  departureCity?: string;
  arrivalCity?: string;
  departureAt?: Date;
  arrivalAt?: Date;
  cabinClass?: string | null;
  price?: number | null;
  paymentMethod?: PaymentMethod;
  notes?: string | null;
}

export type { TicketType, TicketStatus, PaymentMethod };
