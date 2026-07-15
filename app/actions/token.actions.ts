'use server';

import { prisma } from '@/lib/db/client';
import { generateToken } from '@/lib/auth/tokens';
import { getContext, handleError, type ActionResult } from '@/lib/actions/utils';
import { revalidatePath } from 'next/cache';

const GUEST_TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
const DRIVER_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export async function issueGuestToken(
  meetingGuestId: string,
  meetingId: string,
): Promise<ActionResult<{ url: string }>> {
  try {
    const { ability } = await getContext();
    if (!ability.can('update', 'MeetingGuest')) {
      return { ok: false, error: { code: 'FORBIDDEN', message: '无权发放 Token' } };
    }

    // Upsert: if token exists, revoke and reissue
    const existing = await prisma.guestAccessToken.findUnique({
      where: { meetingGuestId },
    });
    if (existing && !existing.revokedAt && existing.expiresAt > new Date()) {
      // Return existing valid token URL
      return {
        ok: true,
        data: {
          url: `/g/${existing.tokenHash}`,
        },
      };
    }

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

    revalidatePath(`/meetings/${meetingId}/guests`);
    return { ok: true, data: { url: `/g/${raw}` } };
  } catch (e) {
    return handleError(e);
  }
}

export async function revokeGuestToken(
  meetingGuestId: string,
  meetingId: string,
): Promise<ActionResult<{ meetingGuestId: string }>> {
  try {
    const { ability } = await getContext();
    if (!ability.can('update', 'MeetingGuest')) {
      return { ok: false, error: { code: 'FORBIDDEN', message: '无权吊销 Token' } };
    }

    await prisma.guestAccessToken.updateMany({
      where: { meetingGuestId, revokedAt: null },
      data: { revokedAt: new Date() },
    });

    revalidatePath(`/meetings/${meetingId}/guests`);
    return { ok: true, data: { meetingGuestId } };
  } catch (e) {
    return handleError(e);
  }
}

export async function issueDriverToken(
  transportOrderId: string,
  meetingId: string,
): Promise<ActionResult<{ url: string }>> {
  try {
    const { ability } = await getContext();
    if (!ability.can('update', 'TransportOrder')) {
      return { ok: false, error: { code: 'FORBIDDEN', message: '无权发放 Token' } };
    }

    const { raw, hash } = generateToken();
    const expiresAt = new Date(Date.now() + DRIVER_TOKEN_TTL_MS);

    await prisma.driverAccessToken.upsert({
      where: { transportOrderId },
      update: {
        tokenHash: hash,
        issuedAt: new Date(),
        expiresAt,
        revokedAt: null,
      },
      create: {
        transportOrderId,
        tokenHash: hash,
        expiresAt,
      },
    });

    revalidatePath(`/meetings/${meetingId}/transport`);
    return { ok: true, data: { url: `/d/${raw}` } };
  } catch (e) {
    return handleError(e);
  }
}
