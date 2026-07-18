'use server';

import { agendaCreateSchema, agendaUpdateSchema } from '@/lib/shared/agenda';
import { agendaService } from '@/lib/domain/agenda/service';
import { assertAuthorized, getContext, handleError, type ActionResult } from '@/lib/actions/utils';
import { auditLog } from '@/lib/audit/logger';
import { revalidatePath } from 'next/cache';

export async function createAgendaItem(
  input: Record<string, unknown>,
): Promise<ActionResult<{ id: string }>> {
  try {
    const { session, ability } = await getContext();
    assertAuthorized(ability, 'create', 'AgendaItem');

    const data = agendaCreateSchema.parse(input);
    const item = await agendaService.create(data);
    await auditLog(session, 'create', 'AgendaItem', item.id, { after: data });
    revalidatePath(`/meetings/${data.meetingId}/agenda`);

    return { ok: true, data: { id: item.id } };
  } catch (e) {
    return handleError(e);
  }
}

export async function updateAgendaItem(
  id: string,
  meetingId: string,
  input: Record<string, unknown>,
): Promise<ActionResult<{ id: string }>> {
  try {
    const { session, ability } = await getContext();
    assertAuthorized(ability, 'update', 'AgendaItem');

    const data = agendaUpdateSchema.parse(input);
    const item = await agendaService.update(id, data);
    await auditLog(session, 'update', 'AgendaItem', item.id, { after: data });
    revalidatePath(`/meetings/${meetingId}/agenda`);

    return { ok: true, data: { id: item.id } };
  } catch (e) {
    return handleError(e);
  }
}

export async function deleteAgendaItem(
  id: string,
  meetingId: string,
): Promise<ActionResult<{ id: string }>> {
  try {
    const { session, ability } = await getContext();
    assertAuthorized(ability, 'delete', 'AgendaItem');

    await agendaService.delete(id);
    await auditLog(session, 'delete', 'AgendaItem', id);
    revalidatePath(`/meetings/${meetingId}/agenda`);

    return { ok: true, data: { id } };
  } catch (e) {
    return handleError(e);
  }
}
