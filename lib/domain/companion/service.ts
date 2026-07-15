import { prisma } from '@/lib/db/client';
import { NotFoundError } from '@/lib/shared/errors';

export const companionService = {
  async create(data: { name: string; phone?: string; languages: string[]; role: string }) {
    return prisma.companion.create({ data });
  },

  async list() {
    return prisma.companion.findMany({ orderBy: { name: 'asc' } });
  },

  async assign(data: {
    meetingId: string;
    meetingGuestId: string;
    companionId: string;
    assignmentScope: string;
  }) {
    const companion = await prisma.companion.findUnique({
      where: { id: data.companionId },
    });
    if (!companion) throw new NotFoundError('Companion', data.companionId);

    return prisma.companionAssignment.create({ data });
  },

  async listAssignmentsByMeeting(meetingId: string) {
    const assignments = await prisma.companionAssignment.findMany({
      where: { meetingId },
      include: { companion: true },
      orderBy: { createdAt: 'desc' },
    });
    // Manually join meeting guest info
    const guestMap = new Map();
    for (const a of assignments) {
      if (!guestMap.has(a.meetingGuestId)) {
        const mg = await prisma.meetingGuest.findUnique({
          where: { id: a.meetingGuestId },
          include: { guest: true },
        });
        if (mg) guestMap.set(a.meetingGuestId, mg);
      }
    }
    return assignments.map((a) => ({
      ...a,
      meetingGuest: guestMap.get(a.meetingGuestId) ?? null,
    }));
  },

  async unassign(id: string) {
    return prisma.companionAssignment.delete({ where: { id } });
  },
};
