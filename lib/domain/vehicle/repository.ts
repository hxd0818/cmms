import { prisma } from '@/lib/db/client';

export const vehicleRepository = {
  async create(data: {
    meetingId: string;
    plateNo: string;
    type: string;
    capacity: number;
    driverName: string;
    driverPhone: string;
    belongs?: string;
  }) {
    return prisma.vehicle.create({ data: data as never });
  },

  async findById(id: string) {
    return prisma.vehicle.findUnique({ where: { id } });
  },

  async listByMeeting(meetingId: string) {
    return prisma.vehicle.findMany({
      where: { meetingId },
      orderBy: { createdAt: 'desc' },
    });
  },

  async delete(id: string) {
    return prisma.vehicle.delete({ where: { id } });
  },
};
