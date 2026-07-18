'use server';

import { guestCreateSchema, guestUpdateSchema } from '@/lib/shared/guest';
import { guestService } from '@/lib/domain/guest/service';
import type { GuestEntity, GuestListParams, GuestListResult } from '@/lib/domain/guest/types';
import {
  assertAuthorized,
  getContext,
  handleError,
  shouldMaskFields,
  type ActionResult,
} from '@/lib/actions/utils';
import { maskGuestFields } from '@/lib/shared/field-masking';
import { auditLog } from '@/lib/audit/logger';
import { revalidatePath } from 'next/cache';

export async function createGuest(
  input: Record<string, unknown>,
): Promise<ActionResult<{ id: string }>> {
  try {
    const { session, ability } = await getContext();
    assertAuthorized(ability, 'create', 'Guest');

    const data = guestCreateSchema.parse(input);
    const guest = await guestService.create(data);
    await auditLog(session, 'create', 'Guest', guest.id, { after: data });
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
    const { session, ability } = await getContext();
    assertAuthorized(ability, 'update', 'Guest');

    const data = guestUpdateSchema.parse(input);
    const guest = await guestService.update(id, data);
    await auditLog(session, 'update', 'Guest', guest.id, { after: data });
    revalidatePath('/guests');
    revalidatePath(`/guests/${id}`);

    return { ok: true, data: { id: guest.id } };
  } catch (e) {
    return handleError(e);
  }
}

export async function deleteGuest(id: string): Promise<ActionResult<{ id: string }>> {
  try {
    const { session, ability } = await getContext();
    assertAuthorized(ability, 'delete', 'Guest');

    await guestService.delete(id);
    await auditLog(session, 'delete', 'Guest', id);
    revalidatePath('/guests');

    return { ok: true, data: { id } };
  } catch (e) {
    return handleError(e);
  }
}

/**
 * List guests with sensitive fields (phone, idNumber) masked
 * when the requesting user has the VIEWER role.
 */
export async function listGuests(params: GuestListParams): Promise<ActionResult<GuestListResult>> {
  try {
    const { session, ability } = await getContext();
    assertAuthorized(ability, 'read', 'Guest');

    const result = await guestService.list(params);
    const mask = shouldMaskFields(session.user.role);

    return {
      ok: true,
      data: {
        items: result.items.map((g) => maskGuestFields(g, mask)),
        total: result.total,
        page: result.page,
        pageSize: result.pageSize,
      },
    };
  } catch (e) {
    return handleError(e);
  }
}

/**
 * Fetch a single guest with sensitive fields masked
 * when the requesting user has the VIEWER role.
 */
export async function getGuest(id: string): Promise<ActionResult<GuestEntity>> {
  try {
    const { session, ability } = await getContext();
    assertAuthorized(ability, 'read', 'Guest');

    const guest = await guestService.findById(id);
    const mask = shouldMaskFields(session.user.role);

    return { ok: true, data: maskGuestFields(guest, mask) };
  } catch (e) {
    return handleError(e);
  }
}
