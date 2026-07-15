import type { TransportOrder } from '@/lib/generated/prisma/client';
import type { PickupType, TransportStatus } from '@/lib/generated/prisma/enums';

export type TransportOrderEntity = TransportOrder;

export interface TransportCreateData {
  meetingId: string;
  meetingGuestId: string;
  pickupType: PickupType;
  pickupLocation: string;
  pickupTime: Date;
  dropoffLocation: string;
  flightNo?: string;
}

export interface TransportUpdateData {
  pickupType?: PickupType;
  pickupLocation?: string;
  pickupTime?: Date;
  dropoffLocation?: string;
  flightNo?: string | null;
}
