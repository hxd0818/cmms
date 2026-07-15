// Edge proxy (Next.js 16 renamed middleware -> proxy) — uses NextAuth v5
// authorized callback for route protection.
// auth() here comes from the edge-safe config (no Prisma import).
import NextAuth from 'next-auth';
import { edgeAuthConfig } from '@/lib/auth/config';

const { auth } = NextAuth(edgeAuthConfig);

export default auth;

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/guests/template).*)'],
};
