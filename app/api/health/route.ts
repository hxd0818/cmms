import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/client';

export async function GET() {
  const checks = await Promise.allSettled([
    prisma.$queryRaw`SELECT 1`,
  ]);

  const db = checks[0]?.status === 'fulfilled' ? 'ok' : 'fail';

  const allOk = db === 'ok';

  return NextResponse.json(
    {
      status: allOk ? 'ok' : 'degraded',
      db,
      timestamp: new Date().toISOString(),
    },
    { status: allOk ? 200 : 503 },
  );
}
