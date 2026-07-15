import { describe, it, expect } from 'vitest';
import { vehicleCreateSchema, vehicleTypeSchema } from '@/lib/shared/transport';

describe('Vehicle schemas', () => {
  it('accepts all vehicle types', () => {
    ['SEDAN', 'MPV', 'BUS', 'OTHER'].forEach((t) =>
      expect(vehicleTypeSchema.parse(t)).toBe(t),
    );
  });

  it('accepts valid vehicle', () => {
    const r = vehicleCreateSchema.parse({
      plateNo: '京A12345',
      type: 'SEDAN',
      capacity: 4,
      driverName: '王师傅',
      driverPhone: '13812345678',
    });
    expect(r.plateNo).toBe('京A12345');
    expect(r.capacity).toBe(4);
  });

  it('rejects capacity <= 0', () => {
    const bad = vehicleCreateSchema.safeParse({
      plateNo: 'X',
      type: 'SEDAN',
      capacity: 0,
      driverName: 'X',
      driverPhone: '13812345678',
    });
    expect(bad.success).toBe(false);
  });

  it('rejects empty plateNo', () => {
    const bad = vehicleCreateSchema.safeParse({
      plateNo: '',
      type: 'SEDAN',
      capacity: 4,
      driverName: 'X',
      driverPhone: '13812345678',
    });
    expect(bad.success).toBe(false);
  });
});
