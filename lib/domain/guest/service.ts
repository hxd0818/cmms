import { guestRepository } from './repository';
import { ConflictError, NotFoundError } from '@/lib/shared/errors';
import type { GuestCreateData, GuestListParams, GuestUpdateData } from './types';

export const guestService = {
  async create(data: GuestCreateData) {
    if (data.phone) {
      const existing = await guestRepository.findByPhone(data.phone);
      if (existing) {
        throw new ConflictError(`Guest with phone ${data.phone} already exists`);
      }
    }
    return guestRepository.create(data);
  },

  async update(id: string, data: GuestUpdateData) {
    const existing = await guestRepository.findById(id);
    if (!existing) throw new NotFoundError('Guest', id);

    if (data.phone && data.phone !== existing.phone) {
      const dupe = await guestRepository.findByPhone(data.phone);
      if (dupe) throw new ConflictError(`Phone ${data.phone} already in use`);
    }

    return guestRepository.update(id, data);
  },

  async findById(id: string) {
    const guest = await guestRepository.findById(id);
    if (!guest) throw new NotFoundError('Guest', id);
    return guest;
  },

  async list(params: GuestListParams) {
    return guestRepository.list(params);
  },

  async delete(id: string) {
    const existing = await guestRepository.findById(id);
    if (!existing) throw new NotFoundError('Guest', id);
    return guestRepository.softDelete(id);
  },
};
