import type { GiftOrder } from '@/lib/generated/prisma/client';
import type { GiftStatus } from '@/lib/generated/prisma/enums';

export type GiftOrderEntity = GiftOrder;

export interface GiftOrderCreateData {
  meetingId: string;
  meetingGuestId: string;
  giftId: string;
  quantity?: number;
}
