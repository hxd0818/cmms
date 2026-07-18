'use server';

import { cateringFormSchema } from '@/lib/shared/catering';
import { cateringService } from '@/lib/domain/catering/service';
import { assertAuthorized, getContext, handleError, type ActionResult } from '@/lib/actions/utils';
import { auditLog } from '@/lib/audit/logger';
import { revalidatePath } from 'next/cache';

export async function createCateringOrder(input: {
  meetingId: string;
  meetingGuestId: string;
  mealType: string;
  mealTime: string;
  notes?: string;
}): Promise<ActionResult<{ id: string }>> {
  try {
    const { session, ability } = await getContext();
    assertAuthorized(ability, 'create', 'CateringOrder');
    const data = cateringFormSchema.parse({
      mealType: input.mealType,
      mealTime: input.mealTime,
      notes: input.notes,
    });
    const order = await cateringService.create({
      meetingId: input.meetingId,
      meetingGuestId: input.meetingGuestId,
      ...data,
    });
    await auditLog(session, 'create', 'CateringOrder', order.id, { after: input });
    revalidatePath(`/meetings/${input.meetingId}/catering`);
    return { ok: true, data: { id: order.id } };
  } catch (e) {
    return handleError(e);
  }
}

export async function assignTable(
  orderId: string,
  tableId: string,
  meetingId: string,
): Promise<ActionResult<{ id: string }>> {
  try {
    const { session, ability } = await getContext();
    assertAuthorized(ability, 'update', 'CateringOrder');
    await cateringService.assignTable(orderId, tableId);
    await auditLog(session, 'assign', 'CateringOrder', orderId, { after: { tableId } });
    revalidatePath(`/meetings/${meetingId}/catering`);
    return { ok: true, data: { id: orderId } };
  } catch (e) {
    return handleError(e);
  }
}

export async function deleteCateringOrder(
  orderId: string,
  meetingId: string,
): Promise<ActionResult<{ id: string }>> {
  try {
    const { session, ability } = await getContext();
    assertAuthorized(ability, 'delete', 'CateringOrder');
    await cateringService.delete(orderId);
    await auditLog(session, 'delete', 'CateringOrder', orderId);
    revalidatePath(`/meetings/${meetingId}/catering`);
    revalidatePath(`/meetings/${meetingId}/resources`);
    return { ok: true, data: { id: orderId } };
  } catch (e) {
    return handleError(e);
  }
}

export async function createDiningTable(input: {
  meetingId: string;
  name: string;
  capacity: number;
  type: string;
}): Promise<ActionResult<{ id: string }>> {
  try {
    const { session, ability } = await getContext();
    assertAuthorized(ability, 'create', 'CateringOrder');
    const { prisma } = await import('@/lib/db/client');
    const table = await prisma.diningTable.create({
      data: {
        meetingId: input.meetingId,
        name: input.name,
        capacity: input.capacity,
        type: input.type as never,
      },
    });
    await auditLog(session, 'create', 'DiningTable', table.id, { after: input });
    revalidatePath(`/meetings/${input.meetingId}/resources`);
    revalidatePath(`/meetings/${input.meetingId}/catering`);
    return { ok: true, data: { id: table.id } };
  } catch (e) {
    return handleError(e);
  }
}

export async function deleteDiningTable(
  tableId: string,
  meetingId: string,
): Promise<ActionResult<{ id: string }>> {
  try {
    const { session, ability } = await getContext();
    assertAuthorized(ability, 'delete', 'CateringOrder');
    const { prisma } = await import('@/lib/db/client');
    await prisma.diningTable.delete({ where: { id: tableId } });
    await auditLog(session, 'delete', 'DiningTable', tableId);
    revalidatePath(`/meetings/${meetingId}/resources`);
    revalidatePath(`/meetings/${meetingId}/catering`);
    return { ok: true, data: { id: tableId } };
  } catch (e) {
    return handleError(e);
  }
}
