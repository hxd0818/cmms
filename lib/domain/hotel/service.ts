import { hotelRepository } from './repository';
import { NotFoundError } from '@/lib/shared/errors';
import type { RoomType } from '@/lib/generated/prisma/enums';

export const hotelService = {
  async create(data: { meetingId: string; name: string; address: string; contactPhone?: string }) {
    return hotelRepository.create(data);
  },

  async findById(id: string) {
    const hotel = await hotelRepository.findById(id);
    if (!hotel) throw new NotFoundError('Hotel', id);
    return hotel;
  },

  async listByMeeting(meetingId: string) {
    return hotelRepository.listByMeeting(meetingId);
  },

  async findRoomsByMeeting(meetingId: string) {
    return hotelRepository.findRoomsByMeeting(meetingId);
  },

  async addRoom(hotelId: string, roomNumber: string, roomType: RoomType) {
    await this.findById(hotelId);
    return hotelRepository.addRoom(hotelId, roomNumber, roomType);
  },
};
