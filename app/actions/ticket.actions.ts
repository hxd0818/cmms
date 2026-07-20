'use server';

import { ticketFormSchema } from '@/lib/shared/ticket';
import { ticketService } from '@/lib/domain/ticket/service';
import { assertAuthorized, getContext, handleError, type ActionResult } from '@/lib/actions/utils';
import { auditLog } from '@/lib/audit/logger';
import { revalidatePath } from 'next/cache';
import type { TicketStatus } from '@/lib/generated/prisma/enums';

export async function createTicket(input: {
  meetingId: string;
  meetingGuestId: string;
  ticketType: string;
  tripNo: string;
  departureCity: string;
  arrivalCity: string;
  departureAt: string;
  arrivalAt: string;
  cabinClass?: string;
  price?: number | string;
  paymentMethod?: string;
  notes?: string;
}): Promise<ActionResult<{ id: string; transportOrderId?: string }>> {
  try {
    const { session, ability } = await getContext();
    assertAuthorized(ability, 'create', 'TicketOrder');
    const data = ticketFormSchema.parse({
      ticketType: input.ticketType,
      tripNo: input.tripNo,
      departureCity: input.departureCity,
      arrivalCity: input.arrivalCity,
      departureAt: input.departureAt,
      arrivalAt: input.arrivalAt,
      cabinClass: input.cabinClass || undefined,
      price: input.price ?? undefined,
      paymentMethod: input.paymentMethod ?? 'COMPANY',
      notes: input.notes || undefined,
    });
    const ticket = await ticketService.create({
      meetingId: input.meetingId,
      meetingGuestId: input.meetingGuestId,
      ...data,
    });
    await auditLog(session, 'create', 'TicketOrder', ticket.id, {
      after: {
        ...input,
        transportOrderId: ticket.transportOrderId,
      },
    });
    revalidatePath(`/meetings/${input.meetingId}/tickets`);
    revalidatePath(`/meetings/${input.meetingId}/transport`);
    return {
      ok: true,
      data: {
        id: ticket.id,
        transportOrderId: ticket.transportOrderId ?? undefined,
      },
    };
  } catch (e) {
    return handleError(e);
  }
}

export async function updateTicketStatus(
  ticketId: string,
  status: TicketStatus,
  meetingId: string,
): Promise<ActionResult<{ id: string }>> {
  try {
    const { session, ability } = await getContext();
    assertAuthorized(ability, 'update', 'TicketOrder');
    await ticketService.updateStatus(ticketId, status);
    await auditLog(session, 'update', 'TicketOrder', ticketId, { after: { status } });
    revalidatePath(`/meetings/${meetingId}/tickets`);
    return { ok: true, data: { id: ticketId } };
  } catch (e) {
    return handleError(e);
  }
}

export async function deleteTicket(
  ticketId: string,
  meetingId: string,
): Promise<ActionResult<{ id: string }>> {
  try {
    const { session, ability } = await getContext();
    assertAuthorized(ability, 'delete', 'TicketOrder');
    await ticketService.delete(ticketId);
    await auditLog(session, 'delete', 'TicketOrder', ticketId);
    revalidatePath(`/meetings/${meetingId}/tickets`);
    revalidatePath(`/meetings/${meetingId}/transport`);
    return { ok: true, data: { id: ticketId } };
  } catch (e) {
    return handleError(e);
  }
}
