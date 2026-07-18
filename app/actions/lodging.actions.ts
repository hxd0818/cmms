'use server';

import { lodgingFormSchema } from '@/lib/shared/lodging';
import { lodgingService } from '@/lib/domain/lodging/service';
import { assertAuthorized, getContext, handleError, type ActionResult } from '@/lib/actions/utils';
import { auditLog } from '@/lib/audit/logger';
import { revalidatePath } from 'next/cache';
import type { LodgingStatus } from '@/lib/generated/prisma/enums';

export async function createLodgingOrder(input: {
  meetingId: string;
  meetingGuestId: string;
  checkInAt: string;
  checkOutAt: string;
  specialRequests?: string;
}): Promise<ActionResult<{ id: string }>> {
  try {
    const { session, ability } = await getContext();
    assertAuthorized(ability, 'create', 'LodgingOrder');
    const data = lodgingFormSchema.parse({
      checkInAt: input.checkInAt,
      checkOutAt: input.checkOutAt,
      specialRequests: input.specialRequests,
    });
    const order = await lodgingService.create({
      meetingId: input.meetingId,
      meetingGuestId: input.meetingGuestId,
      ...data,
    });
    await auditLog(session, 'create', 'LodgingOrder', order.id, { after: input });
    revalidatePath(`/meetings/${input.meetingId}/lodging`);
    return { ok: true, data: { id: order.id } };
  } catch (e) {
    return handleError(e);
  }
}

export async function assignRoom(
  orderId: string,
  roomId: string,
  meetingId: string,
): Promise<ActionResult<{ id: string }>> {
  try {
    const { session, ability } = await getContext();
    assertAuthorized(ability, 'update', 'LodgingOrder');
    await lodgingService.assign(orderId, roomId);
    await auditLog(session, 'assign', 'LodgingOrder', orderId, { after: { roomId } });
    revalidatePath(`/meetings/${meetingId}/lodging`);
    return { ok: true, data: { id: orderId } };
  } catch (e) {
    return handleError(e);
  }
}

export async function updateLodgingStatus(
  orderId: string,
  status: LodgingStatus,
  meetingId: string,
): Promise<ActionResult<{ id: string }>> {
  try {
    const { session, ability } = await getContext();
    assertAuthorized(ability, 'update', 'LodgingOrder');
    await lodgingService.updateStatus(orderId, status);
    await auditLog(session, 'update', 'LodgingOrder', orderId, { after: { status } });
    revalidatePath(`/meetings/${meetingId}/lodging`);
    return { ok: true, data: { id: orderId } };
  } catch (e) {
    return handleError(e);
  }
}

export async function deleteLodgingOrder(
  orderId: string,
  meetingId: string,
): Promise<ActionResult<{ id: string }>> {
  try {
    const { session, ability } = await getContext();
    assertAuthorized(ability, 'delete', 'LodgingOrder');
    await lodgingService.delete(orderId);
    await auditLog(session, 'delete', 'LodgingOrder', orderId);
    revalidatePath(`/meetings/${meetingId}/lodging`);
    return { ok: true, data: { id: orderId } };
  } catch (e) {
    return handleError(e);
  }
}

export async function assignRoommates(
  orderId: string,
  roommateIds: string[],
  meetingId: string,
): Promise<ActionResult<{ id: string }>> {
  try {
    const { session, ability } = await getContext();
    assertAuthorized(ability, 'update', 'LodgingOrder');
    await lodgingService.assignRoommates(orderId, roommateIds);
    await auditLog(session, 'update', 'LodgingOrder', orderId, {
      after: { roommateIds },
    });
    revalidatePath(`/meetings/${meetingId}/lodging`);
    return { ok: true, data: { id: orderId } };
  } catch (e) {
    return handleError(e);
  }
}
