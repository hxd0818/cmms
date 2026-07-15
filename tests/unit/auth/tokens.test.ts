import { describe, it, expect, beforeAll, vi } from 'vitest';

// Mock prisma to avoid DB connection during pure crypto tests
vi.mock('@/lib/db/client', () => ({
  prisma: {},
}));

import { generateToken, hashToken } from '@/lib/auth/tokens';

describe('token helpers', () => {
  beforeAll(() => {
    process.env.NEXTAUTH_SECRET = 'test-secret-for-hmac';
  });

  it('generateToken returns raw + hash', () => {
    const { raw, hash } = generateToken();
    expect(raw).toBeTruthy();
    expect(raw.length).toBeGreaterThan(20);
    expect(hash).toBeTruthy();
    expect(hash).not.toBe(raw);
  });

  it('hashToken is deterministic (same input → same hash)', () => {
    const a = hashToken('abc123');
    const b = hashToken('abc123');
    expect(a).toBe(b);
  });

  it('different inputs produce different hashes', () => {
    expect(hashToken('a')).not.toBe(hashToken('b'));
  });

  it('generateToken produces unique tokens', () => {
    const tokens = new Set<string>();
    for (let i = 0; i < 100; i++) {
      const { raw } = generateToken();
      tokens.add(raw);
    }
    expect(tokens.size).toBe(100);
  });
});
