// Edge middleware — uses NextAuth v5 authorized callback for route protection.
// auth() here comes from the edge-safe config (no Prisma import).
import NextAuth from 'next-auth';
import { edgeAuthConfig } from '@/lib/auth/config';

export const { auth: middleware } = NextAuth(edgeAuthConfig);

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/guests/template).*)'],
};
