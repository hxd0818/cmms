import { prisma } from '@/lib/db/client';
import { logger } from '@/lib/utils/logger';
import type { FeeCategory } from '@/lib/generated/prisma/enums';

export const feeService = {
  async create(data: {
    meetingId: string;
    meetingGuestId?: string;
    category: FeeCategory;
    amount: number;
    notes?: string;
    createdBy: string;
  }) {
    return prisma.feeRecord.create({ data });
  },

  async listByMeeting(meetingId: string) {
    const records = await prisma.feeRecord.findMany({
      where: { meetingId },
      orderBy: { incurredAt: 'desc' },
    });
    // Manually join meeting guest info (optional field, not a Prisma relation)
    const guestMap = new Map();
    for (const r of records) {
      if (r.meetingGuestId && !guestMap.has(r.meetingGuestId)) {
        const mg = await prisma.meetingGuest.findUnique({
          where: { id: r.meetingGuestId },
          include: { guest: true },
        });
        if (mg) guestMap.set(r.meetingGuestId, mg);
      }
    }
    return records.map((r) => ({
      ...r,
      meetingGuest: r.meetingGuestId ? (guestMap.get(r.meetingGuestId) ?? null) : null,
    }));
  },

  async summary(meetingId: string) {
    const records = await prisma.feeRecord.findMany({
      where: { meetingId },
      select: { category: true, amount: true },
    });
    const byCategory: Record<string, number> = {};
    let total = 0;
    for (const r of records) {
      const cat = r.category as string;
      byCategory[cat] = (byCategory[cat] ?? 0) + Number(r.amount);
      total += Number(r.amount);
    }
    return { byCategory, total, count: records.length };
  },

  async delete(id: string) {
    return prisma.feeRecord.delete({ where: { id } });
  },
};
