'use server';

import { companionCreateSchema, companionAssignSchema } from '@/lib/shared/gift';
import { companionService } from '@/lib/domain/companion/service';
import { assertAuthorized, getContext, handleError, type ActionResult } from '@/lib/actions/utils';
import { auditLog } from '@/lib/audit/logger';
import { revalidatePath } from 'next/cache';

export async function createCompanion(input: {
  name: string;
  phone?: string;
  languages: string[];
  role: string;
}): Promise<ActionResult<{ id: string }>> {
  try {
    const { session, ability } = await getContext();
    assertAuthorized(ability, 'create', 'Companion');
    const data = companionCreateSchema.parse(input);
    const companion = await companionService.create({
      name: data.name,
      phone: data.phone || undefined,
      languages: data.languages,
      role: data.role,
    });
    await auditLog(session, 'create', 'Companion', companion.id, { after: data });
    return { ok: true, data: { id: companion.id } };
  } catch (e) {
    return handleError(e);
  }
}

export async function assignCompanion(input: {
  meetingId: string;
  meetingGuestId: string;
  companionId: string;
  assignmentScope: string;
}): Promise<ActionResult<{ id: string }>> {
  try {
    const { session, ability } = await getContext();
    assertAuthorized(ability, 'create', 'Companion');
    const data = companionAssignSchema.parse(input);
    const assignment = await companionService.assign(data);
    await auditLog(session, 'assign', 'CompanionAssignment', assignment.id, { after: input });
    revalidatePath(`/meetings/${input.meetingId}/companions`);
    return { ok: true, data: { id: assignment.id } };
  } catch (e) {
    return handleError(e);
  }
}

export async function unassignCompanion(
  assignmentId: string,
  meetingId: string,
): Promise<ActionResult<{ id: string }>> {
  try {
    const { session, ability } = await getContext();
    assertAuthorized(ability, 'delete', 'Companion');
    await companionService.unassign(assignmentId);
    await auditLog(session, 'unassign', 'CompanionAssignment', assignmentId);
    revalidatePath(`/meetings/${meetingId}/companions`);
    return { ok: true, data: { id: assignmentId } };
  } catch (e) {
    return handleError(e);
  }
}
