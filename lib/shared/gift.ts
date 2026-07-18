import { z } from 'zod';

export const giftStatusSchema = z.enum(['PENDING', 'DELIVERED', 'CANCELED']);
export const feeCategorySchema = z.enum(['TRANSPORT', 'LODGING', 'MEAL', 'GIFT', 'OTHER']);

export const giftCreateSchema = z.object({
  name: z.string().min(1, '礼品名称必填').max(100),
  stock: z.number().int().min(0, '库存不能为负'),
  unitPrice: z.coerce.number().min(0).optional(),
});
export type GiftCreateInput = z.infer<typeof giftCreateSchema>;

export const giftOrderCreateSchema = z.object({
  meetingId: z.string().cuid(),
  meetingGuestId: z.string().cuid(),
  giftId: z.string().cuid(),
  quantity: z.number().int().min(1).default(1),
});
export type GiftOrderCreateInput = z.infer<typeof giftOrderCreateSchema>;

export const companionCreateSchema = z.object({
  name: z.string().min(1, '姓名必填').max(50),
  phone: z
    .string()
    .regex(/^1[3-9]\d{9}$/)
    .optional()
    .or(z.literal('')),
  languages: z.array(z.string()).default([]),
  role: z.string().min(1).max(50),
});
export type CompanionCreateInput = z.infer<typeof companionCreateSchema>;

export const companionAssignSchema = z.object({
  meetingId: z.string().cuid(),
  meetingGuestId: z.string().cuid(),
  companionId: z.string().cuid(),
  assignmentScope: z.string().min(1, '接待范围必填').max(100),
});
export type CompanionAssignInput = z.infer<typeof companionAssignSchema>;

export const feeCreateSchema = z.object({
  meetingId: z.string().cuid(),
  meetingGuestId: z.string().cuid().optional(),
  category: feeCategorySchema,
  amount: z.coerce.number().min(0, '金额不能为负'),
  notes: z.string().max(500).optional(),
});
export type FeeCreateInput = z.infer<typeof feeCreateSchema>;
