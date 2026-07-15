import type { LodgingOrder } from '@/lib/generated/prisma/client';
import type { LodgingStatus } from '@/lib/generated/prisma/enums';

export type LodgingOrderEntity = LodgingOrder;

export interface LodgingCreateData {
  meetingId: string;
  meetingGuestId: string;
  checkInAt: Date;
  checkOutAt: Date;
  specialRequests?: string;
}

export interface LodgingUpdateData {
  checkInAt?: Date;
  checkOutAt?: Date;
  specialRequests?: string | null;
}
