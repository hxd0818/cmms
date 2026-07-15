import { z } from 'zod';

export const vehicleTypeSchema = z.enum(['SEDAN', 'MPV', 'BUS', 'OTHER']);
export type VehicleType = z.infer<typeof vehicleTypeSchema>;

export const vehicleCreateSchema = z.object({
  plateNo: z.string().min(1, '车牌号必填').max(20),
  type: vehicleTypeSchema,
  capacity: z.number().int().min(1, '容量必须 > 0').max(60),
  driverName: z.string().min(1, '司机姓名必填').max(50),
  driverPhone: z
    .string()
    .min(1, '司机电话必填')
    .regex(/^1[3-9]\d{9}$/, '手机号格式错误'),
  belongs: z.string().max(100).optional(),
});
export type VehicleCreateInput = z.infer<typeof vehicleCreateSchema>;

export const vehicleUpdateSchema = vehicleCreateSchema.partial();
export type VehicleUpdateInput = z.infer<typeof vehicleUpdateSchema>;

export const pickupTypeSchema = z.enum(['AIRPORT', 'TRAINSTATION', 'HOTEL', 'VENUE']);
export type PickupType = z.infer<typeof pickupTypeSchema>;

export const transportStatusSchema = z.enum([
  'UNASSIGNED',
  'ASSIGNED',
  'EN_ROUTE',
  'PICKED_UP',
  'COMPLETED',
  'REASSIGNED',
  'CANCELED',
]);
export type TransportStatus = z.infer<typeof transportStatusSchema>;

const transportBaseSchema = z.object({
  meetingId: z.string().cuid(),
  meetingGuestId: z.string().cuid(),
  pickupType: pickupTypeSchema,
  pickupLocation: z.string().min(1, '上车地点必填').max(200),
  pickupTime: z.coerce.date(),
  dropoffLocation: z.string().min(1, '下车地点必填').max(200),
  flightNo: z.string().max(50).optional(),
});

export const transportCreateSchema = transportBaseSchema;
export type TransportCreateInput = z.infer<typeof transportCreateSchema>;

export const transportUpdateSchema = transportBaseSchema.partial();
export type TransportUpdateInput = z.infer<typeof transportUpdateSchema>;

export const transportFormSchema = transportBaseSchema.omit({
  meetingId: true,
  meetingGuestId: true,
});
export type TransportFormValues = z.infer<typeof transportFormSchema>;
