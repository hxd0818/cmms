import { describe, it, expect } from 'vitest';
import { agendaTypeSchema, agendaCreateSchema, agendaUpdateSchema } from '@/lib/shared/agenda';

describe('Agenda schemas', () => {
  it('accepts all agenda types', () => {
    ['KEYNOTE', 'PANEL', 'BREAK', 'MEAL', 'TOUR', 'OTHER'].forEach((t) =>
      expect(agendaTypeSchema.parse(t)).toBe(t),
    );
  });

  it('rejects invalid type', () => {
    expect(() => agendaTypeSchema.parse('PARTY')).toThrow();
  });

  it('accepts valid agenda create', () => {
    const r = agendaCreateSchema.parse({
      meetingId: 'cmtest1234567890',
      title: '开幕式',
      type: 'KEYNOTE',
      startAt: '2026-08-01T09:00:00Z',
      endAt: '2026-08-01T10:30:00Z',
      venue: '主会场',
      speakerIds: ['cmtest1', 'cmtest2'],
    });
    expect(r.title).toBe('开幕式');
    expect(r.startAt).toBeInstanceOf(Date);
    expect(r.speakerIds).toEqual(['cmtest1', 'cmtest2']);
  });

  it('rejects end before start', () => {
    const bad = agendaCreateSchema.safeParse({
      meetingId: 'cmtest1234567890',
      title: 'X',
      type: 'KEYNOTE',
      startAt: '2026-08-01T10:30:00Z',
      endAt: '2026-08-01T09:00:00Z',
    });
    expect(bad.success).toBe(false);
  });

  it('defaults speakerIds to empty array', () => {
    const r = agendaCreateSchema.parse({
      meetingId: 'cmtest1234567890',
      title: '茶歇',
      type: 'BREAK',
      startAt: '2026-08-01T10:30:00Z',
      endAt: '2026-08-01T11:00:00Z',
    });
    expect(r.speakerIds).toEqual([]);
  });

  it('agendaUpdateSchema is partial', () => {
    const r = agendaUpdateSchema.parse({ title: '新标题' });
    expect(r.title).toBe('新标题');
    expect(r.type).toBeUndefined();
  });
});
