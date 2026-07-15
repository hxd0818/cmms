import { z } from 'zod';

export const guestLevelSchema = z.enum(['VIP_A', 'VIP_B', 'A', 'B', 'C']);
export type GuestLevel = z.infer<typeof guestLevelSchema>;

export const genderSchema = z.enum(['MALE', 'FEMALE', 'OTHER']);
export type Gender = z.infer<typeof genderSchema>;

export const guestCreateSchema = z.object({
  name: z.string().min(1, '姓名必填').max(100),
  gender: genderSchema.optional(),
  phone: z
    .string()
    .regex(/^1[3-9]\d{9}$/, '手机号格式错误')
    .optional()
    .or(z.literal('')),
  email: z
    .string()
    .email('邮箱格式错误')
    .optional()
    .or(z.literal('')),
  company: z.string().max(200).optional(),
  title: z.string().max(100).optional(),
  level: guestLevelSchema.default('C'),
  avatarUrl: z.string().url().optional(),
  idNumber: z
    .string()
    .regex(/^[1-9]\d{16}[\dXx]$/, '身份证号格式错误')
    .optional()
    .or(z.literal('')),
  dietaryTags: z.array(z.string()).default([]),
  notes: z.string().max(2000).optional(),
});

export type GuestCreateInput = z.infer<typeof guestCreateSchema>;

export const guestUpdateSchema = guestCreateSchema.partial();
export type GuestUpdateInput = z.infer<typeof guestUpdateSchema>;
