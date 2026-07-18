import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/client';
import { generateToken } from '@/lib/auth/tokens';

const GUEST_TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000;

export async function POST(request: Request) {
  const { meetingGuestId } = await request.json();

  if (!meetingGuestId) {
    return NextResponse.json({ ok: false, error: 'missing meetingGuestId' }, { status: 400 });
  }

  // Verify the meeting guest exists
  const mg = await prisma.meetingGuest.findUnique({ where: { id: meetingGuestId } });
  if (!mg) {
    return NextResponse.json({ ok: false, error: 'not found' }, { status: 404 });
  }

  // Check if a valid token already exists
  const existing = await prisma.guestAccessToken.findUnique({
    where: { meetingGuestId },
  });
  if (existing && !existing.revokedAt && existing.expiresAt > new Date()) {
    // Can't return the raw token (only hash is stored), generate a new one
  }

  // Generate new token (or replace expired/revoked)
  const { raw, hash } = generateToken();
  const expiresAt = new Date(Date.now() + GUEST_TOKEN_TTL_MS);

  await prisma.guestAccessToken.upsert({
    where: { meetingGuestId },
    update: {
      tokenHash: hash,
      issuedAt: new Date(),
      expiresAt,
      revokedAt: null,
      revokedBy: null,
      accessCount: 0,
      lastAccessedAt: null,
    },
    create: {
      meetingGuestId,
      tokenHash: hash,
      expiresAt,
    },
  });

  return NextResponse.json({ ok: true, url: '/guest/' + raw });
}
