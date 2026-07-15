'use server';

import { guestCreateSchema, guestUpdateSchema } from '@/lib/shared/guest';
import { guestService } from '@/lib/domain/guest/service';
import {
  assertAuthorized,
  getContext,
  handleError,
  type ActionResult,
} from '@/lib/actions/utils';
import { revalidatePath } from 'next/cache';

export async function createGuest(
  input: Record<string, unknown>,
): Promise<ActionResult<{ id: string }>> {
  try {
    const { ability } = await getContext();
    assertAuthorized(ability, 'create', 'Guest');

    const data = guestCreateSchema.parse(input);
    const guest = await guestService.create(data);
    revalidatePath('/guests');

    return { ok: true, data: { id: guest.id } };
  } catch (e) {
    return handleError(e);
  }
}

export async function updateGuest(
  id: string,
  input: Record<string, unknown>,
): Promise<ActionResult<{ id: string }>> {
  try {
    const { ability } = await getContext();
    assertAuthorized(ability, 'update', 'Guest');

    const data = guestUpdateSchema.parse(input);
    const guest = await guestService.update(id, data);
    revalidatePath('/guests');
    revalidatePath(`/guests/${id}`);

    return { ok: true, data: { id: guest.id } };
  } catch (e) {
    return handleError(e);
  }
}

export async function deleteGuest(id: string): Promise<ActionResult<{ id: string }>> {
  try {
    const { ability } = await getContext();
    assertAuthorized(ability, 'delete', 'Guest');

    await guestService.delete(id);
    revalidatePath('/guests');

    return { ok: true, data: { id } };
  } catch (e) {
    return handleError(e);
  }
}
