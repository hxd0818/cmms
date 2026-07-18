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
