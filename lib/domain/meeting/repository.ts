import { prisma } from '@/lib/db/client';
import type { MeetingStatus } from '@/lib/generated/prisma/enums';
import type {
  MeetingCreateData,
  MeetingListParams,
  MeetingListResult,
  MeetingUpdateData,
} from './types';

export const meetingRepository = {
  async create(data: MeetingCreateData) {
    return prisma.meeting.create({
      data: {
        name: data.name,
        code: data.code,
        startAt: data.startAt,
        endAt: data.endAt,
        venue: data.venue,
        description: data.description,
      },
    });
  },

  async update(id: string, data: MeetingUpdateData) {
    return prisma.meeting.update({ where: { id }, data });
  },

  async updateStatus(id: string, status: MeetingStatus) {
    return prisma.meeting.update({ where: { id }, data: { status } });
  },

  async findById(id: string) {
    return prisma.meeting.findUnique({ where: { id } });
  },

  async findByCode(code: string) {
    return prisma.meeting.findUnique({ where: { code } });
  },

  async list(params: MeetingListParams): Promise<MeetingListResult> {
    const { search, status, page = 1, pageSize = 20 } = params;

    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
        { venue: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      prisma.meeting.findMany({
        where,
        orderBy: { startAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.meeting.count({ where }),
    ]);

    return { items, total, page, pageSize };
  },
};
