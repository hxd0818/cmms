import { vehicleRepository } from './repository';
import { ConflictError, NotFoundError } from '@/lib/shared/errors';
import type { VehicleCreateData, VehicleListParams, VehicleUpdateData } from './types';

export const vehicleService = {
  async create(data: VehicleCreateData) {
    const existing = await vehicleRepository.findByPlateNo(data.plateNo);
    if (existing) {
      throw new ConflictError(`车辆 ${data.plateNo} 已存在`);
    }
    return vehicleRepository.create(data);
  },

  async update(id: string, data: VehicleUpdateData) {
    const existing = await vehicleRepository.findById(id);
    if (!existing) throw new NotFoundError('Vehicle', id);

    if (data.plateNo && data.plateNo !== existing.plateNo) {
      const dupe = await vehicleRepository.findByPlateNo(data.plateNo);
      if (dupe) throw new ConflictError(`车牌 ${data.plateNo} 已被使用`);
    }
    return vehicleRepository.update(id, data);
  },

  async findById(id: string) {
    const v = await vehicleRepository.findById(id);
    if (!v) throw new NotFoundError('Vehicle', id);
    return v;
  },

  async list(params: VehicleListParams) {
    return vehicleRepository.list(params);
  },

  async delete(id: string) {
    const existing = await vehicleRepository.findById(id);
    if (!existing) throw new NotFoundError('Vehicle', id);
    return vehicleRepository.delete(id);
  },
};
