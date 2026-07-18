import { describe, it, expect, beforeAll } from 'vitest';
import { encrypt, decrypt } from '@/lib/db/field-encryption';

describe('field encryption', () => {
  beforeAll(() => {
    process.env.FIELD_ENCRYPTION_KEY = 'a'.repeat(64);
  });

  it('encrypts and decrypts a value round-trip', () => {
    const original = '13812345678';
    const encrypted = encrypt(original);
    expect(encrypted).not.toBe(original);
    expect(encrypted.startsWith('enc:')).toBe(true);
    expect(decrypt(encrypted)).toBe(original);
  });

  it('handles empty values', () => {
    expect(encrypt('')).toBe('');
    expect(decrypt('')).toBe('');
    expect(decrypt(null as unknown as string)).toBeNull();
    expect(decrypt(undefined as unknown as string)).toBeNull();
  });

  it('passes through null', () => {
    expect(decrypt(null as unknown as string)).toBeNull();
  });

  it('produces different ciphertext for same plaintext (random IV)', () => {
    const a = encrypt('13812345678');
    const b = encrypt('13812345678');
    expect(a).not.toBe(b);
    expect(decrypt(a)).toBe(decrypt(b));
  });
});
