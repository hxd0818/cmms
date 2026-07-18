'use server';

import { feeCreateSchema } from '@/lib/shared/gift';
import { feeService } from '@/lib/domain/fee/service';
import { assertAuthorized, getContext, handleError, type ActionResult } from '@/lib/actions/utils';
import { auditLog } from '@/lib/audit/logger';
import { revalidatePath } from 'next/cache';

export async function createFeeRecord(input: {
  meetingId: string;
  meetingGuestId?: string;
  category: string;
  amount: number;
  notes?: string;
}): Promise<ActionResult<{ id: string }>> {
  try {
    const { ability, session } = await getContext();
    assertAuthorized(ability, 'create', 'FeeRecord');
    const data = feeCreateSchema.parse(input);
    const record = await feeService.create({
      ...data,
      createdBy: session.user.id,
    });
    await auditLog(session, 'create', 'FeeRecord', record.id, { after: input });
    revalidatePath(`/meetings/${input.meetingId}/fees`);
    return { ok: true, data: { id: record.id } };
  } catch (e) {
    return handleError(e);
  }
}

export async function deleteFeeRecord(
  recordId: string,
  meetingId: string,
): Promise<ActionResult<{ id: string }>> {
  try {
    const { session, ability } = await getContext();
    assertAuthorized(ability, 'delete', 'FeeRecord');
    await feeService.delete(recordId);
    await auditLog(session, 'delete', 'FeeRecord', recordId);
    revalidatePath(`/meetings/${meetingId}/fees`);
    return { ok: true, data: { id: recordId } };
  } catch (e) {
    return handleError(e);
  }
}
