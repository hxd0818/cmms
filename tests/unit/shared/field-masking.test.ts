import { describe, it, expect } from 'vitest';
import { maskPhone, maskIdNumber, maskGuestFields } from '@/lib/shared/field-masking';

describe('maskPhone', () => {
  it('masks middle digits of a standard 11-digit phone', () => {
    expect(maskPhone('13812341234')).toBe('138****1234');
  });

  it('returns null for null input', () => {
    expect(maskPhone(null)).toBeNull();
  });

  it('returns null for undefined input', () => {
    expect(maskPhone(undefined)).toBeNull();
  });

  it('returns the original value when shorter than 7 chars', () => {
    expect(maskPhone('12345')).toBe('12345');
  });

  it('returns empty string unchanged', () => {
    expect(maskPhone('')).toBe('');
  });

  it('handles non-Chinese phone formats', () => {
    expect(maskPhone('15551234567')).toBe('155****4567');
  });
});

describe('maskIdNumber', () => {
  it('masks middle of a standard 18-digit ID with a fixed-width asterisk band', () => {
    // Implementation uses a fixed 8-char mask band regardless of input length,
    // which is intentional: it does not leak the original length.
    expect(maskIdNumber('110101199001011234')).toBe('110********1234');
  });

  it('returns null for null input', () => {
    expect(maskIdNumber(null)).toBeNull();
  });

  it('returns the original value when shorter than 6 chars', () => {
    expect(maskIdNumber('12345')).toBe('12345');
  });

  it('returns empty string unchanged', () => {
    expect(maskIdNumber('')).toBe('');
  });
});

describe('maskGuestFields', () => {
  it('returns the same reference when masking is disabled', () => {
    const guest = { id: '1', name: 'Alice', phone: '13812341234', idNumber: '110101199001011234' };
    expect(maskGuestFields(guest, false)).toBe(guest);
  });

  it('returns a new masked object when masking is enabled', () => {
    const guest = { id: '1', name: 'Alice', phone: '13812341234', idNumber: '110101199001011234' };
    const masked = maskGuestFields(guest, true);
    expect(masked).not.toBe(guest);
    expect(masked.phone).toBe('138****1234');
    expect(masked.idNumber).toBe('110********1234');
    expect(masked.name).toBe('Alice');
  });

  it('preserves null sensitive fields when masking', () => {
    const guest = { id: '1', name: 'Bob', phone: null, idNumber: null };
    const masked = maskGuestFields(guest, true);
    expect(masked.phone).toBeNull();
    expect(masked.idNumber).toBeNull();
    expect(masked.name).toBe('Bob');
  });

  it('does not mutate the input object', () => {
    const guest = { id: '1', name: 'Alice', phone: '13812341234', idNumber: '110101199001011234' };
    maskGuestFields(guest, true);
    expect(guest.phone).toBe('13812341234');
    expect(guest.idNumber).toBe('110101199001011234');
  });
});
