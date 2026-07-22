'use server';

import { prisma } from '@/lib/db/client';
import { generateToken, hashToken } from '@/lib/auth/tokens';
import { getContext, handleError, assertAuthorized, type ActionResult } from '@/lib/actions/utils';
import { auditLog } from '@/lib/audit/logger';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const MANAGER_TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000;

export async function issueManagerToken(input: {
  meetingId: string;
  name: string;
  phone: string;
  scope?: string;
}): Promise<ActionResult<{ url: string }>> {
  try {
    const { session, ability } = await getContext();
    assertAuthorized(ability, 'manage', 'all');

    const { raw, hash } = generateToken();
    const expiresAt = new Date(Date.now() + MANAGER_TOKEN_TTL_MS);

    const record = await prisma.guestManagerToken.create({
      data: {
        meetingId: input.meetingId,
        name: input.name,
        phone: input.phone,
        tokenHash: hash,
        scope: (input.scope === 'ALL' ? 'ALL' : 'ASSIGNED') as never,
        expiresAt,
      },
    });

    await auditLog(session, 'issue', 'GuestManagerToken', record.id, {
      after: { meetingId: input.meetingId, name: input.name, scope: input.scope },
    });
    return { ok: true, data: { url: '/manage/' + raw } };
  } catch (e) {
    return handleError(e);
  }
}

export async function listManagerTokens(meetingId: string) {
  try {
    await getContext();
    return await prisma.guestManagerToken.findMany({
      where: { meetingId, revokedAt: null },
      orderBy: { issuedAt: 'desc' },
    });
  } catch {
    return [];
  }
}

export async function revokeManagerToken(tokenId: string, meetingId: string) {
  try {
    const { session, ability } = await getContext();
    assertAuthorized(ability, 'manage', 'all');
    await prisma.guestManagerToken.update({
      where: { id: tokenId },
      data: { revokedAt: new Date() },
    });
    await auditLog(session, 'revoke', 'GuestManagerToken', tokenId);
    revalidatePath(`/meetings/${meetingId}/staff`);
    return { ok: true, data: { id: tokenId } };
  } catch (e) {
    return handleError(e);
  }
}

const guestCreateByManagerSchema = z.object({
  name: z.string().min(1, '姓名必填').max(100),
  phone: z
    .string()
    .regex(/^1[3-9]\d{9}$/)
    .optional()
    .or(z.literal('')),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']).optional(),
  company: z.string().max(200).optional(),
  title: z.string().max(100).optional(),
  level: z.enum(['VIP_A', 'VIP_B', 'A', 'B', 'C']).default('C'),
  dietaryTags: z.array(z.string()).default([]),
});

export async function createGuestByManager(input: {
  tokenHash: string;
  meetingId: string;
  guestData: z.infer<typeof guestCreateByManagerSchema>;
}): Promise<ActionResult<{ guestId: string; meetingGuestId: string }>> {
  try {
    const data = guestCreateByManagerSchema.parse(input.guestData);

    // Verify token
    const token = await prisma.guestManagerToken.findUnique({
      where: { tokenHash: input.tokenHash },
    });
    if (!token || token.revokedAt || token.expiresAt < new Date()) {
      return { ok: false, error: { code: 'UNAUTHORIZED', message: 'Token 无效或已过期' } };
    }

    // Check phone uniqueness if provided
    if (data.phone) {
      const existing = await prisma.guest.findFirst({
        where: { phone: data.phone, deletedAt: null },
      });
      if (existing) {
        // Guest already exists, add to meeting if not already
        const mg = await prisma.meetingGuest.findUnique({
          where: { meetingId_guestId: { meetingId: input.meetingId, guestId: existing.id } },
        });
        if (mg) {
          return { ok: false, error: { code: 'CONFLICT', message: '该手机号嘉宾已在会议中' } };
        }
        const newMg = await prisma.meetingGuest.create({
          data: { meetingId: input.meetingId, guestId: existing.id },
        });
        return { ok: true, data: { guestId: existing.id, meetingGuestId: newMg.id } };
      }
    }

    // Create guest
    const guest = await prisma.guest.create({
      data: {
        name: data.name,
        phone: data.phone || undefined,
        gender: data.gender,
        company: data.company,
        title: data.title,
        level: data.level as never,
        dietaryTags: data.dietaryTags,
      },
    });

    // Add to meeting
    const meetingGuest = await prisma.meetingGuest.create({
      data: { meetingId: input.meetingId, guestId: guest.id },
    });

    return { ok: true, data: { guestId: guest.id, meetingGuestId: meetingGuest.id } };
  } catch (e) {
    return handleError(e);
  }
}

export async function getManagerGuests(tokenHash: string) {
  const token = await prisma.guestManagerToken.findUnique({
    where: { tokenHash },
  });
  if (!token || token.revokedAt || token.expiresAt < new Date()) return null;

  const meetingGuests = await prisma.meetingGuest.findMany({
    where: { meetingId: token.meetingId },
    include: { guest: true },
    orderBy: { guest: { name: 'asc' } },
  });

  return {
    token,
    meetingGuests: meetingGuests.map((mg) => ({
      id: mg.id,
      guestId: mg.guestId,
      name: mg.guest.name,
      phone: mg.guest.phone,
      company: mg.guest.company,
      title: mg.guest.title,
      level: mg.levelOverride ?? mg.guest.level,
      gender: mg.guest.gender,
      dietaryTags: mg.guest.dietaryTags,
      receptionStage: mg.receptionStage,
    })),
  };
}

export async function getManagerGuestDetail(tokenHash: string, meetingGuestId: string) {
  const token = await prisma.guestManagerToken.findUnique({
    where: { tokenHash },
  });
  if (!token || token.revokedAt || token.expiresAt < new Date()) return null;

  const mg = await prisma.meetingGuest.findUnique({
    where: { id: meetingGuestId },
    include: { guest: true },
  });
  if (!mg || mg.meetingId !== token.meetingId) return null;

  const [transport, lodging, catering, gifts, agenda] = await Promise.all([
    prisma.transportOrder.findMany({
      where: { meetingGuestId },
      include: { vehicle: true },
      orderBy: { pickupTime: 'asc' },
    }),
    prisma.lodgingOrder.findMany({
      where: { meetingGuestId },
      include: { hotelRoom: { include: { hotel: true } } },
      orderBy: { checkInAt: 'asc' },
    }),
    prisma.cateringOrder.findMany({
      where: { meetingGuestId },
      include: { diningTable: true },
      orderBy: { mealTime: 'asc' },
    }),
    prisma.giftOrder.findMany({
      where: { meetingGuestId },
      include: { gift: true },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.agendaItem.findMany({
      where: { meetingId: token.meetingId },
      orderBy: { startAt: 'asc' },
    }),
  ]);

  return {
    guest: {
      name: mg.guest.name,
      level: mg.levelOverride ?? mg.guest.level,
      company: mg.guest.company,
      title: mg.guest.title,
      phone: mg.guest.phone,
      gender: mg.guest.gender,
      dietaryTags: mg.guest.dietaryTags,
    },
    transport: transport.map((t) => ({
      pickupType: t.pickupType,
      pickupLocation: t.pickupLocation,
      dropoffLocation: t.dropoffLocation,
      pickupTime: t.pickupTime.toISOString(),
      flightNo: t.flightNo,
      status: t.status,
      plateNo: t.vehicle?.plateNo ?? null,
      driverName: t.vehicle?.driverName ?? null,
    })),
    lodging: lodging.map((l) => ({
      hotelName: l.hotelRoom?.hotel.name ?? null,
      roomNumber: l.hotelRoom?.roomNumber ?? null,
      checkIn: l.checkInAt.toISOString(),
      checkOut: l.checkOutAt.toISOString(),
      status: l.status,
    })),
    catering: catering.map((c) => ({
      mealType: c.mealType,
      mealTime: c.mealTime.toISOString(),
      tableName: c.diningTable?.name ?? null,
    })),
    gifts: gifts.map((g) => ({
      name: g.gift.name,
      quantity: g.quantity,
      status: g.status,
    })),
    agenda: agenda.map((a) => ({
      title: a.title,
      type: a.type,
      start: a.startAt.toISOString(),
      end: a.endAt.toISOString(),
      venue: a.venue,
    })),
  };
}
