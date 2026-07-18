/**
 * Redis-backed sliding-window rate limiter for credential checks.
 *
 * Used by the Credentials provider authorize() to throttle brute-force
 * login attempts. The counter resets on successful authentication.
 */
import IORedis from 'ioredis';
import { logger } from '@/lib/utils/logger';

const MAX_ATTEMPTS = 5;
const WINDOW_SECONDS = 300; // 5 minutes

let client: IORedis | null = null;

/**
 * Lazily build a singleton Redis client for rate-limit checks.
 * Falls back to open (allow-all) behavior if Redis is unreachable,
 * since login must still function even if the limiter is offline.
 */
function getClient(): IORedis | null {
  if (client) return client;
  const url = process.env.REDIS_URL ?? 'redis://localhost:6381';
  try {
    const instance = new IORedis(url, {
      maxRetriesPerRequest: 1,
      enableReadyCheck: true,
      retryStrategy(times) {
        if (times > 2) return null;
        return Math.min(times * 200, 1000);
      },
    });
    instance.on('error', (err) => {
      logger.warn({ err: err.message }, 'rate-limit redis error');
    });
    client = instance;
    return client;
  } catch (err) {
    logger.warn(
      { err: err instanceof Error ? err.message : 'unknown' },
      'rate-limit redis init failed; limiter disabled',
    );
    return null;
  }
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
}

/**
 * Increment the attempt counter for the given identifier (e.g. email or IP).
 * First increment in a window sets the TTL.
 *
 * When Redis is unavailable, returns an "allow" result so that login
 * remains functional (fail-open for availability).
 */
export async function checkRateLimit(identifier: string): Promise<RateLimitResult> {
  const redis = getClient();
  if (!redis) {
    return { allowed: true, remaining: MAX_ATTEMPTS };
  }

  const key = `rate-limit:${identifier}`;
  try {
    const attempts = await redis.incr(key);
    if (attempts === 1) {
      await redis.expire(key, WINDOW_SECONDS);
    }
    return {
      allowed: attempts <= MAX_ATTEMPTS,
      remaining: Math.max(0, MAX_ATTEMPTS - attempts),
    };
  } catch (err) {
    logger.warn(
      { err: err instanceof Error ? err.message : 'unknown' },
      'rate-limit check failed; fail-open',
    );
    return { allowed: true, remaining: MAX_ATTEMPTS };
  }
}

/**
 * Reset the attempt counter for the given identifier.
 * Called after a successful authentication.
 */
export async function resetRateLimit(identifier: string): Promise<void> {
  const redis = getClient();
  if (!redis) return;
  try {
    await redis.del(`rate-limit:${identifier}`);
  } catch (err) {
    logger.warn({ err: err instanceof Error ? err.message : 'unknown' }, 'rate-limit reset failed');
  }
}

export const RATE_LIMIT_CONFIG = {
  maxAttempts: MAX_ATTEMPTS,
  windowSeconds: WINDOW_SECONDS,
} as const;
