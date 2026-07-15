import { describe, it, expect } from 'vitest';
import { guestLevelSchema, genderSchema, guestCreateSchema } from '@/lib/shared/guest';

describe('Guest enums and schema', () => {
  it('accepts valid GuestLevel', () => {
    expect(guestLevelSchema.parse('VIP_A')).toBe('VIP_A');
    expect(guestLevelSchema.parse('VIP_B')).toBe('VIP_B');
    expect(guestLevelSchema.parse('A')).toBe('A');
    expect(guestLevelSchema.parse('B')).toBe('B');
    expect(guestLevelSchema.parse('C')).toBe('C');
  });

  it('rejects invalid GuestLevel', () => {
    expect(() => guestLevelSchema.parse('VIP')).toThrow();
    expect(() => guestLevelSchema.parse('X')).toThrow();
    expect(() => guestLevelSchema.parse('vip_a')).toThrow();
  });

  it('accepts valid Gender', () => {
    expect(genderSchema.parse('MALE')).toBe('MALE');
    expect(genderSchema.parse('FEMALE')).toBe('FEMALE');
    expect(genderSchema.parse('OTHER')).toBe('OTHER');
  });

  it('rejects invalid Gender', () => {
    expect(() => genderSchema.parse('M')).toThrow();
    expect(() => genderSchema.parse('male')).toThrow();
  });

  it('guestCreateSchema accepts a minimal valid guest', () => {
    const result = guestCreateSchema.parse({ name: '张三', level: 'C' });
    expect(result.name).toBe('张三');
    expect(result.level).toBe('C');
    expect(result.dietaryTags).toEqual([]);
  });

  it('guestCreateSchema validates Chinese phone format', () => {
    const ok = guestCreateSchema.safeParse({ name: 'X', level: 'C', phone: '13812345678' });
    expect(ok.success).toBe(true);

    const bad = guestCreateSchema.safeParse({ name: 'X', level: 'C', phone: '12345' });
    expect(bad.success).toBe(false);
  });

  it('guestCreateSchema rejects empty name', () => {
    const bad = guestCreateSchema.safeParse({ name: '', level: 'C' });
    expect(bad.success).toBe(false);
  });

  it('guestCreateSchema defaults level to C when omitted', () => {
    const result = guestCreateSchema.parse({ name: 'X' });
    expect(result.level).toBe('C');
  });
});
