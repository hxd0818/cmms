'use server';

import { prisma } from '@/lib/db/client';
import { getContext, handleError, assertAuthorized, type ActionResult } from '@/lib/actions/utils';
import { auditLog } from '@/lib/audit/logger';
import { revalidatePath } from 'next/cache';

const ENTITY_MAP = {
  transport: { table: 'transportOrder', type: 'TransportOrder' },
  lodging: { table: 'lodgingOrder', type: 'LodgingOrder' },
  catering: { table: 'cateringOrder', type: 'CateringOrder' },
  gift: { table: 'giftOrder', type: 'GiftOrder' },
} as const;

export async function assignTask(
  entityType: keyof typeof ENTITY_MAP,
  entityId: string,
  assigneeId: string | null,
  meetingId: string,
): Promise<ActionResult<{ id: string }>> {
  try {
    const { session, ability } = await getContext();
    assertAuthorized(ability, 'update', 'all');

    const mapping = ENTITY_MAP[entityType];
    const updateFn = {
      transport: () =>
        prisma.transportOrder.update({ where: { id: entityId }, data: { assigneeId } }),
      lodging: () => prisma.lodgingOrder.update({ where: { id: entityId }, data: { assigneeId } }),
      catering: () =>
        prisma.cateringOrder.update({ where: { id: entityId }, data: { assigneeId } }),
      gift: () => prisma.giftOrder.update({ where: { id: entityId }, data: { assigneeId } }),
    }[entityType];
    await updateFn();

    await auditLog(session, 'assign', mapping.type, entityId, {
      after: { assigneeId },
    });
    revalidatePath(`/meetings/${meetingId}/${entityType === 'gift' ? 'gifts' : entityType}`);
    revalidatePath('/my-tasks');
    return { ok: true, data: { id: entityId } };
  } catch (e) {
    return handleError(e);
  }
}

export async function getMyTasks() {
  const { session } = await getContext();
  if (!session?.user?.id) return { transport: [], lodging: [], catering: [], gifts: [] };

  const userId = session.user.id;

  const [transport, lodging, catering, gifts] = await Promise.all([
    prisma.transportOrder.findMany({
      where: { assigneeId: userId },
      include: { meetingGuest: { include: { guest: true } }, vehicle: true },
      orderBy: { pickupTime: 'asc' },
    }),
    prisma.lodgingOrder.findMany({
      where: { assigneeId: userId },
      include: {
        meetingGuest: { include: { guest: true } },
        hotelRoom: { include: { hotel: true } },
      },
      orderBy: { checkInAt: 'asc' },
    }),
    prisma.cateringOrder.findMany({
      where: { assigneeId: userId },
      include: { meetingGuest: { include: { guest: true } }, diningTable: true },
      orderBy: { mealTime: 'asc' },
    }),
    prisma.giftOrder.findMany({
      where: { assigneeId: userId },
      include: { meetingGuest: { include: { guest: true } }, gift: true },
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  // Batch-query meeting names (no Prisma relation on task models)
  const meetingIds = new Set<string>();
  [...transport, ...lodging, ...catering, ...gifts].forEach((t) => meetingIds.add(t.meetingId));
  const meetings =
    meetingIds.size > 0
      ? await prisma.meeting.findMany({
          where: { id: { in: Array.from(meetingIds) } },
          select: { id: true, name: true },
        })
      : [];
  const meetingMap = new Map(meetings.map((m) => [m.id, m.name]));

  const attach = <T extends { meetingId: string }>(items: T[]) =>
    items.map((item) => ({ ...item, meetingName: meetingMap.get(item.meetingId) ?? '' }));

  return {
    transport: attach(transport),
    lodging: attach(lodging),
    catering: attach(catering),
    gifts: attach(gifts),
  };
}
