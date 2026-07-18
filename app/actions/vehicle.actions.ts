'use server';

import { vehicleCreateSchema } from '@/lib/shared/transport';
import { vehicleService } from '@/lib/domain/vehicle/service';
import { assertAuthorized, getContext, handleError, type ActionResult } from '@/lib/actions/utils';
import { revalidatePath } from 'next/cache';

export async function createVehicle(input: {
  meetingId: string;
  plateNo: string;
  type: string;
  capacity: number;
  driverName: string;
  driverPhone: string;
  belongs?: string;
}): Promise<ActionResult<{ id: string }>> {
  try {
    const { ability } = await getContext();
    assertAuthorized(ability, 'create', 'Vehicle');
    const data = vehicleCreateSchema.parse({
      plateNo: input.plateNo,
      type: input.type,
      capacity: input.capacity,
      driverName: input.driverName,
      driverPhone: input.driverPhone,
      belongs: input.belongs,
    });
    const v = await vehicleService.create({ ...data, meetingId: input.meetingId });
    revalidatePath(`/meetings/${input.meetingId}/transport`);
    return { ok: true, data: { id: v.id } };
  } catch (e) {
    return handleError(e);
  }
}

export async function deleteVehicle(
  id: string,
  meetingId: string,
): Promise<ActionResult<{ id: string }>> {
  try {
    const { ability } = await getContext();
    assertAuthorized(ability, 'delete', 'Vehicle');
    await vehicleService.delete(id);
    revalidatePath(`/meetings/${meetingId}/transport`);
    return { ok: true, data: { id } };
  } catch (e) {
    return handleError(e);
  }
}
