'use server';

import { meetingCreateSchema, meetingUpdateSchema } from '@/lib/shared/meeting';
import { meetingService } from '@/lib/domain/meeting/service';
import { assertAuthorized, getContext, handleError, type ActionResult } from '@/lib/actions/utils';
import { auditLog } from '@/lib/audit/logger';
import { revalidatePath } from 'next/cache';
import type { MeetingStatus } from '@/lib/generated/prisma/enums';

export async function createMeeting(
  input: Record<string, unknown>,
): Promise<ActionResult<{ id: string }>> {
  try {
    const { session, ability } = await getContext();
    assertAuthorized(ability, 'create', 'Meeting');

    const data = meetingCreateSchema.parse(input);
    const meeting = await meetingService.create(data);
    await auditLog(session, 'create', 'Meeting', meeting.id, { after: data });
    revalidatePath('/meetings');

    return { ok: true, data: { id: meeting.id } };
  } catch (e) {
    return handleError(e);
  }
}

export async function updateMeeting(
  id: string,
  input: Record<string, unknown>,
): Promise<ActionResult<{ id: string }>> {
  try {
    const { session, ability } = await getContext();
    assertAuthorized(ability, 'update', 'Meeting');

    const data = meetingUpdateSchema.parse(input);
    const meeting = await meetingService.update(id, data);
    await auditLog(session, 'update', 'Meeting', meeting.id, { after: data });
    revalidatePath('/meetings');
    revalidatePath(`/meetings/${id}`);

    return { ok: true, data: { id: meeting.id } };
  } catch (e) {
    return handleError(e);
  }
}

export async function updateMeetingStatus(
  id: string,
  status: MeetingStatus,
): Promise<ActionResult<{ id: string }>> {
  try {
    const { session, ability } = await getContext();
    assertAuthorized(ability, 'update', 'Meeting');

    await meetingService.updateStatus(id, status);
    await auditLog(session, 'update', 'Meeting', id, { after: { status } });
    revalidatePath('/meetings');
    revalidatePath(`/meetings/${id}`);

    return { ok: true, data: { id } };
  } catch (e) {
    return handleError(e);
  }
}
