// Edge-safe NextAuth config — used by middleware (Edge runtime).
// DO NOT import Prisma or any Node-only module here.
import type { NextAuthConfig } from 'next-auth';

export const edgeAuthConfig: NextAuthConfig = {
  session: { strategy: 'jwt', maxAge: 60 * 60 * 8 },
  pages: { signIn: '/login' },
  providers: [], // providers with authorize() live in lib/auth/index.ts (Node-only)
  callbacks: {
    authorized({ auth, request }) {
      const isLoggedIn = !!auth?.user;
      const { pathname } = request.nextUrl;
      const PUBLIC_PATHS = ['/login', '/api/auth', '/g', '/d'];

      if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
        return true;
      }
      return isLoggedIn;
    },
    jwt({ token, user }) {
      if (user) {
        token.id = (user as { id?: string }).id ?? token.sub ?? '';
        token.role = (user as { role?: string }).role ?? 'VIEWER';
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
      }
      return session;
    },
  },
};
