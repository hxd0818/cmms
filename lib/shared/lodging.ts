import { z } from 'zod';

export const roomTypeSchema = z.enum(['SINGLE', 'DOUBLE', 'SUITE']);
export const roomStatusSchema = z.enum(['AVAILABLE', 'RESERVED', 'OCCUPIED', 'MAINTENANCE']);
export const lodgingStatusSchema = z.enum([
  'UNASSIGNED',
  'RESERVED',
  'CHECKED_IN',
  'CHECKED_OUT',
  'ROOM_CHANGED',
  'CANCELED',
]);

export const hotelCreateSchema = z.object({
  name: z.string().min(1, '酒店名称必填').max(200),
  address: z.string().min(1, '地址必填').max(500),
  contactPhone: z.string().max(20).optional(),
});
export type HotelCreateInput = z.infer<typeof hotelCreateSchema>;

export const hotelRoomCreateSchema = z.object({
  hotelId: z.string().cuid(),
  roomNumber: z.string().min(1).max(20),
  roomType: roomTypeSchema,
});
export type HotelRoomCreateInput = z.infer<typeof hotelRoomCreateSchema>;

const lodgingBaseSchema = z.object({
  meetingId: z.string().cuid(),
  meetingGuestId: z.string().cuid(),
  checkInAt: z.coerce.date(),
  checkOutAt: z.coerce.date(),
  specialRequests: z.string().max(500).optional(),
});

export const lodgingCreateSchema = lodgingBaseSchema.refine((d) => d.checkOutAt > d.checkInAt, {
  message: '退房时间必须晚于入住时间',
  path: ['checkOutAt'],
});
export const lodgingFormSchema = lodgingBaseSchema
  .omit({ meetingId: true, meetingGuestId: true })
  .refine((d) => d.checkOutAt > d.checkInAt, {
    message: '退房时间必须晚于入住时间',
    path: ['checkOutAt'],
  });
