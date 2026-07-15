import { prisma } from '@/lib/db/client';
import type {
  EntourageRole,
  ReceptionStage,
} from '@/lib/generated/prisma/enums';
import type {
  MeetingGuestCreateData,
  MeetingGuestListParams,
  MeetingGuestUpdateData,
} from './types';

export const meetingGuestRepository = {
  async create(data: MeetingGuestCreateData) {
    return prisma.meetingGuest.create({
      data: {
        meetingId: data.meetingId,
        guestId: data.guestId,
        groupTags: data.groupTags ?? [],
        primaryMeetingGuestId: data.primaryMeetingGuestId,
        entourageRole: data.entourageRole,
        levelOverride: data.levelOverride,
        inheritLodging: data.inheritLodging ?? true,
        inheritTransport: data.inheritTransport ?? true,
      },
    });
  },

  async update(id: string, data: MeetingGuestUpdateData) {
    return prisma.meetingGuest.update({ where: { id }, data });
  },

  async findById(id: string) {
    return prisma.meetingGuest.findUnique({ where: { id } });
  },

  async findByIdWithRelations(id: string) {
    return prisma.meetingGuest.findUnique({
      where: { id },
      include: {
        guest: true,
        meeting: true,
        primary: { include: { guest: true } },
        subordinates: { include: { guest: true } },
      },
    });
  },

  async findByMeetingAndGuest(meetingId: string, guestId: string) {
    return prisma.meetingGuest.findUnique({
      where: { meetingId_guestId: { meetingId, guestId } },
    });
  },

  async findByMeeting(
    params: MeetingGuestListParams,
  ) {
    const {
      meetingId,
      receptionStage,
      entourageRole,
      search,
      page = 1,
      pageSize = 100,
    } = params;

    const where: Record<string, unknown> = { meetingId };
    if (receptionStage) where.receptionStage = receptionStage;
    if (entourageRole) where.entourageRole = entourageRole;
    if (search) {
      where.guest = {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { phone: { contains: search } },
          { company: { contains: search, mode: 'insensitive' } },
        ],
      };
    }

    return prisma.meetingGuest.findMany({
      where,
      include: {
        guest: true,
        primary: { include: { guest: true } },
      },
      orderBy: [{ entourageRole: 'asc' }, { createdAt: 'asc' }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    });
  },

  async findSubordinates(primaryMeetingGuestId: string) {
    return prisma.meetingGuest.findMany({
      where: { primaryMeetingGuestId },
    });
  },

  async updateReceptionStage(id: string, stage: ReceptionStage) {
    return prisma.meetingGuest.update({
      where: { id },
      data: { receptionStage: stage },
    });
  },

  async delete(id: string) {
    return prisma.meetingGuest.delete({ where: { id } });
  },
};

export type EntourageRoleType = EntourageRole;
