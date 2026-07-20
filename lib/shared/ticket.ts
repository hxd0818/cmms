import { z } from 'zod';

export const ticketTypeSchema = z.enum(['FLIGHT', 'TRAIN']);
export type TicketTypeValue = z.infer<typeof ticketTypeSchema>;

export const ticketStatusSchema = z.enum([
  'PENDING',
  'BOOKED',
  'CONFIRMED',
  'TICKETED',
  'CANCELED',
]);
export type TicketStatusValue = z.infer<typeof ticketStatusSchema>;

export const paymentMethodSchema = z.enum(['COMPANY', 'SELF']);
export type PaymentMethodValue = z.infer<typeof paymentMethodSchema>;

const ticketBaseSchema = z.object({
  meetingId: z.string().cuid(),
  meetingGuestId: z.string().cuid(),
  ticketType: ticketTypeSchema,
  tripNo: z.string().min(1, '航班号/车次号必填').max(50),
  departureCity: z.string().min(1, '出发城市必填').max(100),
  arrivalCity: z.string().min(1, '到达城市必填').max(100),
  departureAt: z.coerce.date(),
  arrivalAt: z.coerce.date(),
  cabinClass: z.string().max(50).optional(),
  price: z.coerce.number().min(0, '票价不能为负').optional(),
  paymentMethod: paymentMethodSchema.default('COMPANY'),
  notes: z.string().max(500).optional(),
});

export const ticketCreateSchema = ticketBaseSchema.refine(
  (d) => d.arrivalAt > d.departureAt,
  {
    message: '到达时间必须晚于出发时间',
    path: ['arrivalAt'],
  },
);

export type TicketCreateInput = z.infer<typeof ticketCreateSchema>;

export const ticketFormSchema = ticketBaseSchema
  .omit({ meetingId: true, meetingGuestId: true })
  .refine((d) => d.arrivalAt > d.departureAt, {
    message: '到达时间必须晚于出发时间',
    path: ['arrivalAt'],
  });

export type TicketFormValues = z.infer<typeof ticketFormSchema>;
