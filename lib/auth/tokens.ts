import crypto from 'crypto';
import { prisma } from '@/lib/db/client';

function getSecret(): string {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) {
    throw new Error('NEXTAUTH_SECRET environment variable is required for token hashing');
  }
  return secret;
}

export function generateToken(): { raw: string; hash: string } {
  const raw = crypto.randomBytes(32).toString('base64url');
  return { raw, hash: hashToken(raw) };
}

export function hashToken(raw: string): string {
  return crypto.createHmac('sha256', getSecret()).update(raw).digest('hex');
}

/**
 * Verify a guest portal token. Returns the meetingGuestId if valid,
 * null if token not found / expired / revoked.
 *
 * Also updates lastAccessedAt + accessCount for audit.
 */
export async function verifyGuestToken(raw: string): Promise<{ meetingGuestId: string } | null> {
  const hash = hashToken(raw);
  const record = await prisma.guestAccessToken.findUnique({
    where: { tokenHash: hash },
  });
  if (!record) return null;
  if (record.revokedAt) return null;
  if (record.expiresAt < new Date()) return null;

  // Fire-and-forget update (don't block the request)
  void prisma.guestAccessToken
    .update({
      where: { id: record.id },
      data: {
        lastAccessedAt: new Date(),
        accessCount: { increment: 1 },
      },
    })
    .catch(() => {});

  return { meetingGuestId: record.meetingGuestId };
}

/**
 * Verify a driver portal token. Returns the transportOrderId if valid.
 */
export async function verifyDriverToken(raw: string): Promise<{ transportOrderId: string } | null> {
  const hash = hashToken(raw);
  const record = await prisma.driverAccessToken.findUnique({
    where: { tokenHash: hash },
  });
  if (!record) return null;
  if (record.revokedAt) return null;
  if (record.expiresAt < new Date()) return null;

  return { transportOrderId: record.transportOrderId };
}
