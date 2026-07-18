'use server';

import { dictionaryService } from '@/lib/domain/dictionary/service';
import { getContext, handleError, assertAuthorized, type ActionResult } from '@/lib/actions/utils';
import { auditLog } from '@/lib/audit/logger';
import { revalidatePath } from 'next/cache';

export async function updateDictionaryLabel(
  id: string,
  label: string,
): Promise<ActionResult<{ id: string }>> {
  try {
    const { session, ability } = await getContext();
    assertAuthorized(ability, 'update', 'all');
    await dictionaryService.updateLabel(id, label);
    await auditLog(session, 'update', 'DictionaryEntry', id, { after: { label } });
    revalidatePath('/admin/dictionary');
    return { ok: true, data: { id } };
  } catch (e) {
    return handleError(e);
  }
}

export async function toggleDictionaryVisibility(
  id: string,
): Promise<ActionResult<{ id: string }>> {
  try {
    const { session, ability } = await getContext();
    assertAuthorized(ability, 'update', 'all');
    await dictionaryService.toggleVisibility(id);
    await auditLog(session, 'toggle', 'DictionaryEntry', id);
    revalidatePath('/admin/dictionary');
    return { ok: true, data: { id } };
  } catch (e) {
    return handleError(e);
  }
}
