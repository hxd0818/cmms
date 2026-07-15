import type { CateringOrder } from '@/lib/generated/prisma/client';
import type { MealType, CateringStatus } from '@/lib/generated/prisma/enums';

export type CateringOrderEntity = CateringOrder;

export interface CateringCreateData {
  meetingId: string;
  meetingGuestId: string;
  mealType: MealType;
  mealTime: Date;
  notes?: string;
  specialDietary?: string[];
}
