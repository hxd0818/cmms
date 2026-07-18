'use server';

import { receptionService } from '@/lib/domain/reception/service';
import { getContext, handleError, type ActionResult } from '@/lib/actions/utils';
import { auditLog } from '@/lib/audit/logger';
import { revalidatePath } from 'next/cache';

async function assertCanManageMeeting() {
  const { session, ability } = await getContext();
  if (!ability.can('update', 'MeetingGuest')) {
    throw new Error('Forbidden: update MeetingGuest');
  }
  return session;
}

export async function checkIn(meetingGuestId: string): Promise<ActionResult<{ id: string }>> {
  try {
    const session = await assertCanManageMeeting();
    await receptionService.checkIn(meetingGuestId);
    await auditLog(session, 'checkIn', 'MeetingGuest', meetingGuestId);
    revalidatePath('/meetings');
    return { ok: true, data: { id: meetingGuestId } };
  } catch (e) {
    return handleError(e);
  }
}

export async function batchCheckIn(
  meetingGuestIds: string[],
  meetingId: string,
): Promise<ActionResult<{ count: number }>> {
  try {
    const session = await assertCanManageMeeting();
    let count = 0;
    for (const id of meetingGuestIds) {
      try {
        await receptionService.checkIn(id);
        await auditLog(session, 'checkIn', 'MeetingGuest', id);
        count++;
      } catch {
        // Skip guests who can't be checked in (wrong state)
      }
    }
    revalidatePath(`/meetings/${meetingId}/reception`);
    return { ok: true, data: { count } };
  } catch (e) {
    return handleError(e);
  }
}

export async function markNoShow(meetingGuestId: string): Promise<ActionResult<{ id: string }>> {
  try {
    const session = await assertCanManageMeeting();
    await receptionService.markNoShow(meetingGuestId);
    await auditLog(session, 'markNoShow', 'MeetingGuest', meetingGuestId);
    revalidatePath('/meetings');
    return { ok: true, data: { id: meetingGuestId } };
  } catch (e) {
    return handleError(e);
  }
}

export async function markDeparted(meetingGuestId: string): Promise<ActionResult<{ id: string }>> {
  try {
    const session = await assertCanManageMeeting();
    await receptionService.markDeparted(meetingGuestId);
    await auditLog(session, 'markDeparted', 'MeetingGuest', meetingGuestId);
    revalidatePath('/meetings');
    return { ok: true, data: { id: meetingGuestId } };
  } catch (e) {
    return handleError(e);
  }
}

export async function promoteToInHouse(
  meetingGuestId: string,
): Promise<ActionResult<{ id: string }>> {
  try {
    const session = await assertCanManageMeeting();
    await receptionService.promoteToInHouse(meetingGuestId);
    await auditLog(session, 'promoteToInHouse', 'MeetingGuest', meetingGuestId);
    revalidatePath('/meetings');
    return { ok: true, data: { id: meetingGuestId } };
  } catch (e) {
    return handleError(e);
  }
}
