import { prisma } from '@/lib/db/client';
import type { VehicleCreateData, VehicleListParams, VehicleUpdateData } from './types';

export const vehicleRepository = {
  async create(data: VehicleCreateData) {
    return prisma.vehicle.create({ data });
  },

  async update(id: string, data: VehicleUpdateData) {
    return prisma.vehicle.update({ where: { id }, data });
  },

  async findById(id: string) {
    return prisma.vehicle.findUnique({ where: { id } });
  },

  async findByPlateNo(plateNo: string) {
    return prisma.vehicle.findUnique({ where: { plateNo } });
  },

  async list(params: VehicleListParams) {
    const { search, page = 1, pageSize = 20 } = params;
    const where: Record<string, unknown> = {};
    if (search) {
      where.OR = [
        { plateNo: { contains: search, mode: 'insensitive' } },
        { driverName: { contains: search, mode: 'insensitive' } },
        { belongs: { contains: search, mode: 'insensitive' } },
      ];
    }
    const [items, total] = await Promise.all([
      prisma.vehicle.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.vehicle.count({ where }),
    ]);
    return { items, total, page, pageSize };
  },

  async delete(id: string) {
    return prisma.vehicle.delete({ where: { id } });
  },
};
