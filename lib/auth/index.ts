// Full NextAuth config (Node runtime) — used by route handler and server-side calls.
// Contains Credentials provider with Prisma-backed authorize().
import NextAuth from 'next-auth';
import { CredentialsSignin } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db/client';
import { edgeAuthConfig } from './config';
import { checkRateLimit, resetRateLimit, RATE_LIMIT_CONFIG } from './rate-limit';

/**
 * Thrown when the rate limiter blocks a login attempt.
 *
 * Subclasses CredentialsSignin so NextAuth surfaces it via the URL
 * `code=rate_limited` query param. The LoginForm maps this code to a
 * Chinese message — the code must be short and non-sensitive because
 * it is included in the redirect URL.
 */
export class RateLimitError extends CredentialsSignin {
  override code = 'rate_limited' as const;
}

export const { auth, handlers, signIn, signOut } = NextAuth({
  ...edgeAuthConfig,
  providers: [
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(creds) {
        if (!creds?.email || !creds?.password) return null;
        const email = String(creds.email).toLowerCase().trim();

        // Throttle brute-force attempts before touching the DB.
        const rate = await checkRateLimit(email);
        if (!rate.allowed) {
          throw new RateLimitError();
        }

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) return null;
        const ok = await bcrypt.compare(String(creds.password), user.passwordHash);
        if (!ok) return null;

        // Successful authentication: clear the rate-limit counter.
        await resetRateLimit(email);
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        };
      },
    }),
  ],
});

export { RATE_LIMIT_CONFIG };
