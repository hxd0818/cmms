'use server';

import { vehicleCreateSchema, vehicleUpdateSchema } from '@/lib/shared/transport';
import { vehicleService } from '@/lib/domain/vehicle/service';
import {
  assertAuthorized,
  getContext,
  handleError,
  type ActionResult,
} from '@/lib/actions/utils';
import { revalidatePath } from 'next/cache';

export async function createVehicle(
  input: Record<string, unknown>,
): Promise<ActionResult<{ id: string }>> {
  try {
    const { ability } = await getContext();
    assertAuthorized(ability, 'create', 'Vehicle');
    const data = vehicleCreateSchema.parse(input);
    const v = await vehicleService.create(data);
    revalidatePath('/vehicles');
    return { ok: true, data: { id: v.id } };
  } catch (e) {
    return handleError(e);
  }
}

export async function updateVehicle(
  id: string,
  input: Record<string, unknown>,
): Promise<ActionResult<{ id: string }>> {
  try {
    const { ability } = await getContext();
    assertAuthorized(ability, 'update', 'Vehicle');
    const data = vehicleUpdateSchema.parse(input);
    const v = await vehicleService.update(id, data);
    revalidatePath('/vehicles');
    return { ok: true, data: { id: v.id } };
  } catch (e) {
    return handleError(e);
  }
}

export async function deleteVehicle(id: string): Promise<ActionResult<{ id: string }>> {
  try {
    const { ability } = await getContext();
    assertAuthorized(ability, 'delete', 'Vehicle');
    await vehicleService.delete(id);
    revalidatePath('/vehicles');
    return { ok: true, data: { id } };
  } catch (e) {
    return handleError(e);
  }
}
