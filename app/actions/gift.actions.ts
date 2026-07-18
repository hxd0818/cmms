'use server';

import { giftCreateSchema, giftOrderCreateSchema } from '@/lib/shared/gift';
import { giftService } from '@/lib/domain/gift/service';
import { assertAuthorized, getContext, handleError, type ActionResult } from '@/lib/actions/utils';
import { auditLog } from '@/lib/audit/logger';
import { revalidatePath } from 'next/cache';

export async function createGift(input: {
  name: string;
  stock: number;
  unitPrice?: number;
}): Promise<ActionResult<{ id: string }>> {
  try {
    const { session, ability } = await getContext();
    assertAuthorized(ability, 'create', 'Gift');
    const data = giftCreateSchema.parse(input);
    const gift = await giftService.createGift(data);
    await auditLog(session, 'create', 'Gift', gift.id, { after: data });
    return { ok: true, data: { id: gift.id } };
  } catch (e) {
    return handleError(e);
  }
}

export async function createGiftOrder(input: {
  meetingId: string;
  meetingGuestId: string;
  giftId: string;
  quantity?: number;
}): Promise<ActionResult<{ id: string }>> {
  try {
    const { session, ability } = await getContext();
    assertAuthorized(ability, 'create', 'GiftOrder');
    const data = giftOrderCreateSchema.parse(input);
    const order = await giftService.createOrder(data);
    await auditLog(session, 'create', 'GiftOrder', order.id, { after: input });
    revalidatePath(`/meetings/${input.meetingId}/gifts`);
    return { ok: true, data: { id: order.id } };
  } catch (e) {
    return handleError(e);
  }
}

export async function deliverGiftOrder(
  orderId: string,
  meetingId: string,
): Promise<ActionResult<{ id: string }>> {
  try {
    const { session, ability } = await getContext();
    assertAuthorized(ability, 'update', 'GiftOrder');
    await giftService.deliverOrder(orderId);
    await auditLog(session, 'update', 'GiftOrder', orderId, { after: { delivered: true } });
    revalidatePath(`/meetings/${meetingId}/gifts`);
    return { ok: true, data: { id: orderId } };
  } catch (e) {
    return handleError(e);
  }
}

export async function deleteGiftOrder(
  orderId: string,
  meetingId: string,
): Promise<ActionResult<{ id: string }>> {
  try {
    const { session, ability } = await getContext();
    assertAuthorized(ability, 'delete', 'GiftOrder');
    await giftService.deleteOrder(orderId);
    await auditLog(session, 'delete', 'GiftOrder', orderId);
    revalidatePath(`/meetings/${meetingId}/gifts`);
    return { ok: true, data: { id: orderId } };
  } catch (e) {
    return handleError(e);
  }
}
