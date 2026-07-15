'use server';

import { receptionService } from '@/lib/domain/reception/service';
import { getContext, handleError, type ActionResult } from '@/lib/actions/utils';
import { revalidatePath } from 'next/cache';

async function assertCanManageMeeting(): Promise<void> {
  const { ability } = await getContext();
  if (!ability.can('update', 'MeetingGuest')) {
    throw new Error('Forbidden: update MeetingGuest');
  }
}

export async function checkIn(meetingGuestId: string): Promise<ActionResult<{ id: string }>> {
  try {
    await assertCanManageMeeting();
    await receptionService.checkIn(meetingGuestId);
    revalidatePath('/meetings');
    return { ok: true, data: { id: meetingGuestId } };
  } catch (e) {
    return handleError(e);
  }
}

export async function markNoShow(meetingGuestId: string): Promise<ActionResult<{ id: string }>> {
  try {
    await assertCanManageMeeting();
    await receptionService.markNoShow(meetingGuestId);
    revalidatePath('/meetings');
    return { ok: true, data: { id: meetingGuestId } };
  } catch (e) {
    return handleError(e);
  }
}

export async function markDeparted(meetingGuestId: string): Promise<ActionResult<{ id: string }>> {
  try {
    await assertCanManageMeeting();
    await receptionService.markDeparted(meetingGuestId);
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
    await assertCanManageMeeting();
    await receptionService.promoteToInHouse(meetingGuestId);
    revalidatePath('/meetings');
    return { ok: true, data: { id: meetingGuestId } };
  } catch (e) {
    return handleError(e);
  }
}
