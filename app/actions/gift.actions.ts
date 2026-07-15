'use server';

import { giftCreateSchema, giftOrderCreateSchema } from '@/lib/shared/gift';
import { giftService } from '@/lib/domain/gift/service';
import { assertAuthorized, getContext, handleError, type ActionResult } from '@/lib/actions/utils';
import { revalidatePath } from 'next/cache';

export async function createGift(input: {
  name: string;
  stock: number;
  unitPrice?: number;
}): Promise<ActionResult<{ id: string }>> {
  try {
    const { ability } = await getContext();
    assertAuthorized(ability, 'create', 'Gift');
    const data = giftCreateSchema.parse(input);
    const gift = await giftService.createGift(data);
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
    const { ability } = await getContext();
    assertAuthorized(ability, 'create', 'GiftOrder');
    const data = giftOrderCreateSchema.parse(input);
    const order = await giftService.createOrder(data);
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
    const { ability } = await getContext();
    assertAuthorized(ability, 'update', 'GiftOrder');
    await giftService.deliverOrder(orderId);
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
    const { ability } = await getContext();
    assertAuthorized(ability, 'delete', 'GiftOrder');
    await giftService.deleteOrder(orderId);
    revalidatePath(`/meetings/${meetingId}/gifts`);
    return { ok: true, data: { id: orderId } };
  } catch (e) {
    return handleError(e);
  }
}
