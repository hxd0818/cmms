'use server';

import { hotelCreateSchema, hotelRoomCreateSchema } from '@/lib/shared/lodging';
import { hotelService } from '@/lib/domain/hotel/service';
import { assertAuthorized, getContext, handleError, type ActionResult } from '@/lib/actions/utils';
import { revalidatePath } from 'next/cache';

export async function createHotel(input: {
  name: string;
  address: string;
  contactPhone?: string;
}): Promise<ActionResult<{ id: string }>> {
  try {
    const { ability } = await getContext();
    assertAuthorized(ability, 'create', 'Hotel');
    const data = hotelCreateSchema.parse(input);
    const hotel = await hotelService.create(data);
    revalidatePath('/hotels');
    return { ok: true, data: { id: hotel.id } };
  } catch (e) {
    return handleError(e);
  }
}

export async function getHotelDetail(id: string): Promise<
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
}): Promise<ActionResult<{ id: string }>> {
  try {
    const { ability } = await getContext();
    assertAuthorized(ability, 'create', 'Hotel');
    const data = hotelRoomCreateSchema.parse(input);
    const room = await hotelService.addRoom(data.hotelId, data.roomNumber, data.roomType as never);
    revalidatePath('/hotels');
    return { ok: true, data: { id: room.id } };
  } catch (e) {
    return handleError(e);
  }
}
