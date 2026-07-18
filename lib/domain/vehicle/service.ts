import { vehicleRepository } from './repository';
import { NotFoundError } from '@/lib/shared/errors';
import type { VehicleCreateData } from './types';

export const vehicleService = {
  async create(data: VehicleCreateData & { meetingId: string }) {
    return vehicleRepository.create(data);
  },

  async findById(id: string) {
    const v = await vehicleRepository.findById(id);
    if (!v) throw new NotFoundError('Vehicle', id);
    return v;
  },

  async listByMeeting(meetingId: string) {
    return vehicleRepository.listByMeeting(meetingId);
  },

  async delete(id: string) {
    const existing = await vehicleRepository.findById(id);
    if (!existing) throw new NotFoundError('Vehicle', id);
    return vehicleRepository.delete(id);
  },
};
