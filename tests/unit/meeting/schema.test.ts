import { describe, it, expect } from 'vitest';
import {
  meetingCreateSchema,
  meetingUpdateSchema,
  meetingStatusSchema,
  rsvpStatusSchema,
  receptionStageSchema,
  entourageRoleSchema,
} from '@/lib/shared/meeting';

describe('Meeting schemas', () => {
  it('accepts valid meeting with coerced dates', () => {
    const r = meetingCreateSchema.parse({
      name: 'XX 峰会 2026',
      code: 'XX-2026',
      startAt: '2026-08-01T09:00:00Z',
      endAt: '2026-08-03T18:00:00Z',
    });
    expect(r.name).toBe('XX 峰会 2026');
    expect(r.startAt).toBeInstanceOf(Date);
    expect(r.endAt).toBeInstanceOf(Date);
  });

  it('rejects empty name', () => {
    expect(() =>
      meetingCreateSchema.parse({
        name: '',
        code: 'X',
        startAt: '2026-08-01T09:00:00Z',
        endAt: '2026-08-01T18:00:00Z',
      }),
    ).toThrow();
  });

  it('rejects lowercase/special chars in code', () => {
    const bad = meetingCreateSchema.safeParse({
      name: 'X',
      code: 'xx 2026',
      startAt: '2026-08-01T09:00:00Z',
      endAt: '2026-08-01T18:00:00Z',
    });
    expect(bad.success).toBe(false);
  });

  it('rejects end before start', () => {
    const bad = meetingCreateSchema.safeParse({
      name: 'X',
      code: 'X',
      startAt: '2026-08-03T18:00:00Z',
      endAt: '2026-08-01T09:00:00Z',
    });
    expect(bad.success).toBe(false);
  });

  it('meetingUpdateSchema is partial', () => {
    const r = meetingUpdateSchema.parse({ name: 'Only name' });
    expect(r.name).toBe('Only name');
    expect(r.code).toBeUndefined();
  });

  it('meetingStatusSchema accepts all 5 values', () => {
    ['DRAFT', 'PLANNING', 'ONGOING', 'COMPLETED', 'CANCELED'].forEach((s) =>
      expect(meetingStatusSchema.parse(s)).toBe(s),
    );
  });

  it('rsvpStatusSchema accepts PENDING/CONFIRMED/DECLINED', () => {
    ['PENDING', 'CONFIRMED', 'DECLINED'].forEach((s) =>
      expect(rsvpStatusSchema.parse(s)).toBe(s),
    );
  });

  it('receptionStageSchema accepts 5 stages', () => {
    ['NOT_ARRIVED', 'CHECKED_IN', 'IN_HOUSE', 'DEPARTED', 'NO_SHOW'].forEach((s) =>
      expect(receptionStageSchema.parse(s)).toBe(s),
    );
  });

  it('entourageRoleSchema accepts all 7 roles', () => {
    ['PRIMARY', 'SECRETARY', 'SECURITY', 'INTERPRETER', 'FAMILY', 'AIDE', 'DRIVER'].forEach(
      (r) => expect(entourageRoleSchema.parse(r)).toBe(r),
    );
  });

  it('entourageRoleSchema rejects invalid', () => {
    expect(() => entourageRoleSchema.parse('BOSS')).toThrow();
  });
});
