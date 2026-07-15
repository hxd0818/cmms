import { z } from 'zod';

export const tableTypeSchema = z.enum(['ROUND', 'SQUARE', 'BUFFET']);
export const mealTypeSchema = z.enum([
  'WELCOME_BANQUET',
  'FAREWELL',
  'LUNCH',
  'DINNER',
  'BREAKFAST',
]);
export const cateringStatusSchema = z.enum(['SCHEDULED', 'SEATED', 'FINISHED', 'CANCELED']);

export const diningTableCreateSchema = z.object({
  meetingId: z.string().cuid(),
  name: z.string().min(1, '桌名必填').max(50),
  capacity: z.number().int().min(1).max(30),
  type: tableTypeSchema,
});
export type DiningTableCreateInput = z.infer<typeof diningTableCreateSchema>;

export const cateringCreateSchema = z.object({
  meetingId: z.string().cuid(),
  meetingGuestId: z.string().cuid(),
  mealType: mealTypeSchema,
  mealTime: z.coerce.date(),
  notes: z.string().max(500).optional(),
});
export type CateringCreateInput = z.infer<typeof cateringCreateSchema>;

export const cateringFormSchema = cateringCreateSchema.omit({
  meetingId: true,
  meetingGuestId: true,
});
