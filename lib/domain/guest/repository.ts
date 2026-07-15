import { prisma } from '@/lib/db/client';
import type {
  GuestCreateData,
  GuestListParams,
  GuestListResult,
  GuestUpdateData,
} from './types';

export const guestRepository = {
  async create(data: GuestCreateData) {
    return prisma.guest.create({
      data: {
        name: data.name,
        gender: data.gender,
        phone: data.phone,
        email: data.email,
        company: data.company,
        title: data.title,
        level: data.level,
        avatarUrl: data.avatarUrl,
        idNumber: data.idNumber,
        dietaryTags: data.dietaryTags ?? [],
        notes: data.notes,
      },
    });
  },

  async update(id: string, data: GuestUpdateData) {
    return prisma.guest.update({ where: { id }, data });
  },

  async findById(id: string) {
    return prisma.guest.findUnique({ where: { id } });
  },

  async findByPhone(phone: string) {
    return prisma.guest.findUnique({ where: { phone } });
  },

  async list(params: GuestListParams): Promise<GuestListResult> {
    const {
      search,
      level,
      company,
      page = 1,
      pageSize = 20,
      includeDeleted = false,
    } = params;

    const where: Record<string, unknown> = {};
    if (!includeDeleted) where.deletedAt = null;
    if (level) where.level = level;
    if (company) where.company = { contains: company, mode: 'insensitive' };
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } },
        { company: { contains: search, mode: 'insensitive' } },
        { title: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      prisma.guest.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.guest.count({ where }),
    ]);

    return { items, total, page, pageSize };
  },

  async softDelete(id: string) {
    return prisma.guest.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  },
};
