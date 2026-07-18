'use server';

import { hotelCreateSchema, hotelRoomCreateSchema } from '@/lib/shared/lodging';
import { hotelService } from '@/lib/domain/hotel/service';
import { assertAuthorized, getContext, handleError, type ActionResult } from '@/lib/actions/utils';
import { auditLog } from '@/lib/audit/logger';
import { revalidatePath } from 'next/cache';

export async function createHotel(input: {
  meetingId: string;
  name: string;
  address: string;
  contactPhone?: string;
}): Promise<ActionResult<{ id: string }>> {
  try {
    const { session, ability } = await getContext();
    assertAuthorized(ability, 'create', 'Hotel');
    const data = hotelCreateSchema.parse({
      name: input.name,
      address: input.address,
      contactPhone: input.contactPhone,
    });
    const hotel = await hotelService.create({ ...data, meetingId: input.meetingId });
    await auditLog(session, 'create', 'Hotel', hotel.id, { after: input });
    revalidatePath(`/meetings/${input.meetingId}/lodging`);
    return { ok: true, data: { id: hotel.id } };
  } catch (e) {
    return handleError(e);
  }
}

export async function getHotelDetail(
  id: string,
  meetingId: string,
): Promise<
  ActionResult<{
    id: string;
    name: string;
    address: string;
    rooms: Array<{
      id: string;
      roomNumber: string;
      roomType: string;
      status: string;
    }>;
  }>
> {
  try {
    const { ability } = await getContext();
    assertAuthorized(ability, 'read', 'Hotel');
    const hotel = await hotelService.findById(id);
    void meetingId;
    return {
      ok: true,
      data: {
        id: hotel.id,
        name: hotel.name,
        address: hotel.address,
        rooms: hotel.rooms.map((r) => ({
          id: r.id,
          roomNumber: r.roomNumber,
          roomType: r.roomType,
          status: r.status,
        })),
      },
    };
  } catch (e) {
    return handleError(e);
  }
}

export async function addHotelRoom(input: {
  hotelId: string;
  roomNumber: string;
  roomType: string;
  meetingId: string;
}): Promise<ActionResult<{ id: string }>> {
  try {
    const { session, ability } = await getContext();
    assertAuthorized(ability, 'create', 'Hotel');
    const data = hotelRoomCreateSchema.parse({
      hotelId: input.hotelId,
      roomNumber: input.roomNumber,
      roomType: input.roomType,
    });
    const room = await hotelService.addRoom(data.hotelId, data.roomNumber, data.roomType as never);
    await auditLog(session, 'create', 'HotelRoom', room.id, { after: input });
    revalidatePath(`/meetings/${input.meetingId}/lodging`);
    return { ok: true, data: { id: room.id } };
  } catch (e) {
    return handleError(e);
  }
}
