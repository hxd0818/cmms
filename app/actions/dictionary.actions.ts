'use server';

import { dictionaryService } from '@/lib/domain/dictionary/service';
import { getContext, handleError, assertAuthorized, type ActionResult } from '@/lib/actions/utils';
import { revalidatePath } from 'next/cache';

export async function updateDictionaryLabel(
  id: string,
  label: string,
): Promise<ActionResult<{ id: string }>> {
  try {
    const { ability } = await getContext();
    assertAuthorized(ability, 'update', 'all');
    await dictionaryService.updateLabel(id, label);
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
    const { ability } = await getContext();
    assertAuthorized(ability, 'update', 'all');
    await dictionaryService.toggleVisibility(id);
    revalidatePath('/admin/dictionary');
    return { ok: true, data: { id } };
  } catch (e) {
    return handleError(e);
  }
}
