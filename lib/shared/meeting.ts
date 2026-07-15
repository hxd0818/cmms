import { z } from 'zod';
import { guestLevelSchema } from './guest';

export const meetingStatusSchema = z.enum([
  'DRAFT',
  'PLANNING',
  'ONGOING',
  'COMPLETED',
  'CANCELED',
]);
export type MeetingStatus = z.infer<typeof meetingStatusSchema>;

export const rsvpStatusSchema = z.enum(['PENDING', 'CONFIRMED', 'DECLINED']);
export type RsvpStatus = z.infer<typeof rsvpStatusSchema>;

export const receptionStageSchema = z.enum([
  'NOT_ARRIVED',
  'CHECKED_IN',
  'IN_HOUSE',
  'DEPARTED',
  'NO_SHOW',
]);
export type ReceptionStage = z.infer<typeof receptionStageSchema>;

export const entourageRoleSchema = z.enum([
  'PRIMARY',
  'SECRETARY',
  'SECURITY',
  'INTERPRETER',
  'FAMILY',
  'AIDE',
  'DRIVER',
]);
export type EntourageRole = z.infer<typeof entourageRoleSchema>;

const meetingBaseSchema = z.object({
  name: z.string().min(1, '会议名称必填').max(200),
  code: z
    .string()
    .min(1, '会议编号必填')
    .max(50)
    .regex(/^[A-Z0-9-]+$/i, '编号仅允许字母数字和连字符'),
  startAt: z.coerce.date(),
  endAt: z.coerce.date(),
  venue: z.string().max(200).optional(),
  description: z.string().max(2000).optional(),
});

export const meetingCreateSchema = meetingBaseSchema.refine((d) => d.endAt > d.startAt, {
  message: '结束时间必须晚于开始时间',
  path: ['endAt'],
});

export type MeetingCreateInput = z.infer<typeof meetingCreateSchema>;

export const meetingUpdateSchema = meetingBaseSchema.partial();
export type MeetingUpdateInput = z.infer<typeof meetingUpdateSchema>;

export const meetingGuestCreateSchema = z.object({
  meetingId: z.string().cuid(),
  guestId: z.string().cuid(),
  groupTags: z.array(z.string()).default([]),
  primaryMeetingGuestId: z.string().cuid().optional(),
  entourageRole: entourageRoleSchema.optional(),
  levelOverride: guestLevelSchema.optional(),
  inheritLodging: z.boolean().default(true),
  inheritTransport: z.boolean().default(true),
});
export type MeetingGuestCreateInput = z.infer<typeof meetingGuestCreateSchema>;
