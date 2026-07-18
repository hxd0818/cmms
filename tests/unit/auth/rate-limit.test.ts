import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock ioredis before importing the module under test so the singleton
// client uses our fake implementation.
const fakeRedis = {
  incr: vi.fn(),
  expire: vi.fn(),
  del: vi.fn(),
  on: vi.fn(),
};

vi.mock('ioredis', () => {
  // Mock must be a constructor (called with `new` in the module under test).
  return {
    default: class MockIORedis {
      constructor() {
        // Return the shared fakeRedis instance via the constructor's
        // implicit return path; class constructors return `this` by
        // default but we override with Object.assign to expose mocks.
        Object.assign(this, fakeRedis);
        return this;
      }
    },
  };
});

// Mock the logger to avoid pino side effects during tests.
vi.mock('@/lib/utils/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

import { checkRateLimit, resetRateLimit, RATE_LIMIT_CONFIG } from '@/lib/auth/rate-limit';

describe('rate-limit', () => {
  beforeEach(() => {
    fakeRedis.incr.mockReset();
    fakeRedis.expire.mockReset();
    fakeRedis.del.mockReset();
  });

  it('exports sane config defaults', () => {
    expect(RATE_LIMIT_CONFIG.maxAttempts).toBe(5);
    expect(RATE_LIMIT_CONFIG.windowSeconds).toBe(300);
  });

  it('allows the first attempt and sets the window TTL', async () => {
    fakeRedis.incr.mockResolvedValueOnce(1);
    fakeRedis.expire.mockResolvedValueOnce(1);

    const result = await checkRateLimit('user@example.com');

    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(4);
    expect(fakeRedis.expire).toHaveBeenCalledTimes(1);
  });

  it('does not re-set TTL on subsequent attempts', async () => {
    fakeRedis.incr.mockResolvedValueOnce(2);

    const result = await checkRateLimit('user@example.com');

    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(3);
    expect(fakeRedis.expire).not.toHaveBeenCalled();
  });

  it('blocks after MAX_ATTEMPTS and reports zero remaining', async () => {
    fakeRedis.incr.mockResolvedValueOnce(RATE_LIMIT_CONFIG.maxAttempts + 1);

    const result = await checkRateLimit('user@example.com');

    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it('clamps remaining at zero when counter exceeds max', async () => {
    fakeRedis.incr.mockResolvedValueOnce(RATE_LIMIT_CONFIG.maxAttempts + 50);

    const result = await checkRateLimit('user@example.com');

    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it('resetRateLimit deletes the key', async () => {
    fakeRedis.del.mockResolvedValueOnce(1);

    await resetRateLimit('user@example.com');

    expect(fakeRedis.del).toHaveBeenCalledWith('rate-limit:user@example.com');
  });
});
