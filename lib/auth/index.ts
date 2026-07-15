// Full NextAuth config (Node runtime) — used by route handler and server-side calls.
// Contains Credentials provider with Prisma-backed authorize().
import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db/client';
import { edgeAuthConfig } from './config';

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
        const email = String(creds.email);
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) return null;
        const ok = await bcrypt.compare(String(creds.password), user.passwordHash);
        if (!ok) return null;
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
