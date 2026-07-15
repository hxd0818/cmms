import { z } from 'zod';

export const agendaTypeSchema = z.enum([
  'KEYNOTE',
  'PANEL',
  'BREAK',
  'MEAL',
  'TOUR',
  'OTHER',
]);
export type AgendaType = z.infer<typeof agendaTypeSchema>;

const agendaBaseSchema = z.object({
  meetingId: z.string().cuid(),
  title: z.string().min(1, '议程标题必填').max(200),
  type: agendaTypeSchema,
  startAt: z.coerce.date(),
  endAt: z.coerce.date(),
  venue: z.string().max(200).optional(),
  speakerIds: z.array(z.string().cuid()).default([]),
  notes: z.string().max(2000).optional(),
});

export const agendaCreateSchema = agendaBaseSchema.refine(
  (d) => d.endAt > d.startAt,
  { message: '结束时间必须晚于开始时间', path: ['endAt'] },
);

export type AgendaCreateInput = z.infer<typeof agendaCreateSchema>;

export const agendaUpdateSchema = agendaBaseSchema.partial();
export type AgendaUpdateInput = z.infer<typeof agendaUpdateSchema>;
