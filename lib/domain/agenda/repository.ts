import { prisma } from '@/lib/db/client';
import type { AgendaCreateData, AgendaUpdateData } from './types';

export const agendaRepository = {
  async create(data: AgendaCreateData) {
    return prisma.agendaItem.create({
      data: {
        meetingId: data.meetingId,
        title: data.title,
        type: data.type,
        startAt: data.startAt,
        endAt: data.endAt,
        venue: data.venue,
        speakerIds: data.speakerIds ?? [],
        notes: data.notes,
      },
    });
  },

  async update(id: string, data: AgendaUpdateData) {
    return prisma.agendaItem.update({ where: { id }, data });
  },

  async findById(id: string) {
    return prisma.agendaItem.findUnique({ where: { id } });
  },

  async findByMeeting(meetingId: string) {
    return prisma.agendaItem.findMany({
      where: { meetingId },
      orderBy: { startAt: 'asc' },
    });
  },

  /**
   * Find agenda items where any of the given speakers is present, and the
   * time range [startAt, endAt) overlaps with [rangeStart, rangeEnd).
   *
   * Used by service for conflict detection. Overlap rule:
   *   existing.start < newEnd AND existing.end > newStart
   */
  async findSpeakerItemsInRange(
    speakerIds: string[],
    rangeStart: Date,
    rangeEnd: Date,
    excludeItemId?: string,
  ) {
    if (speakerIds.length === 0) return [];
    return prisma.agendaItem.findMany({
      where: {
        id: excludeItemId ? { not: excludeItemId } : undefined,
        speakerIds: { hasSome: speakerIds },
        AND: [{ startAt: { lt: rangeEnd } }, { endAt: { gt: rangeStart } }],
      },
    });
  },

  async delete(id: string) {
    return prisma.agendaItem.delete({ where: { id } });
  },
};
