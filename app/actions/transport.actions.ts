'use server';

import { transportFormSchema } from '@/lib/shared/transport';
import { transportService } from '@/lib/domain/transport/service';
import { assertAuthorized, getContext, handleError, type ActionResult } from '@/lib/actions/utils';
import { auditLog } from '@/lib/audit/logger';
import { revalidatePath } from 'next/cache';
import type { TransportStatus } from '@/lib/generated/prisma/enums';

export async function createTransportOrder(input: {
  meetingId: string;
  meetingGuestId: string;
  pickupType: string;
  pickupLocation: string;
  pickupTime: string;
  dropoffLocation: string;
  flightNo?: string;
}): Promise<ActionResult<{ id: string }>> {
  try {
    const { session, ability } = await getContext();
    assertAuthorized(ability, 'create', 'TransportOrder');
    const data = transportFormSchema.parse({
      pickupType: input.pickupType,
      pickupLocation: input.pickupLocation,
      pickupTime: input.pickupTime,
      dropoffLocation: input.dropoffLocation,
      flightNo: input.flightNo,
    });
    const order = await transportService.create({
      meetingId: input.meetingId,
      meetingGuestId: input.meetingGuestId,
      ...data,
    });
    await auditLog(session, 'create', 'TransportOrder', order.id, { after: input });
    revalidatePath(`/meetings/${input.meetingId}/transport`);
    return { ok: true, data: { id: order.id } };
  } catch (e) {
    return handleError(e);
  }
}

export async function assignVehicle(
  orderId: string,
  vehicleId: string,
  meetingId: string,
): Promise<ActionResult<{ id: string }>> {
  try {
    const { session, ability } = await getContext();
    assertAuthorized(ability, 'update', 'TransportOrder');
    await transportService.assign(orderId, vehicleId);
    await auditLog(session, 'assign', 'TransportOrder', orderId, { after: { vehicleId } });
    revalidatePath(`/meetings/${meetingId}/transport`);
    return { ok: true, data: { id: orderId } };
  } catch (e) {
    return handleError(e);
  }
}

export async function updateTransportStatus(
  orderId: string,
  status: TransportStatus,
  meetingId: string,
): Promise<ActionResult<{ id: string }>> {
  try {
    const { session, ability } = await getContext();
    assertAuthorized(ability, 'update', 'TransportOrder');
    await transportService.updateStatus(orderId, status);
    await auditLog(session, 'update', 'TransportOrder', orderId, { after: { status } });
    revalidatePath(`/meetings/${meetingId}/transport`);
    return { ok: true, data: { id: orderId } };
  } catch (e) {
    return handleError(e);
  }
}

export async function deleteTransportOrder(
  orderId: string,
  meetingId: string,
): Promise<ActionResult<{ id: string }>> {
  try {
    const { session, ability } = await getContext();
    assertAuthorized(ability, 'delete', 'TransportOrder');
    await transportService.delete(orderId);
    await auditLog(session, 'delete', 'TransportOrder', orderId);
    revalidatePath(`/meetings/${meetingId}/transport`);
    return { ok: true, data: { id: orderId } };
  } catch (e) {
    return handleError(e);
  }
}

export async function getVehicleSeatInfo(
  vehicleId: string,
  pickupTime: string,
): Promise<
  ActionResult<{
    capacity: number;
    occupied: number;
    remaining: number;
    hasOthers: boolean;
  }>
> {
  try {
    await getContext();
    const info = await transportService.checkVehicleAvailability(vehicleId, new Date(pickupTime));
    return {
      ok: true,
      data: {
        capacity: info.vehicleCapacity,
        occupied: info.occupiedSeats,
        remaining: info.remainingSeats,
        hasOthers: info.hasOtherPassengers,
      },
    };
  } catch {
    return {
      ok: true,
      data: { capacity: 0, occupied: 0, remaining: 0, hasOthers: false },
    };
  }
}
