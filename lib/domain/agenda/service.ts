import { agendaRepository } from './repository';
import { ConflictError, NotFoundError } from '@/lib/shared/errors';
import type { AgendaCreateData, AgendaUpdateData } from './types';

export const agendaService = {
  async create(data: AgendaCreateData) {
    // Check speaker conflicts
    if (data.speakerIds && data.speakerIds.length > 0) {
      const conflicts = await agendaRepository.findSpeakerItemsInRange(
        data.speakerIds,
        data.startAt,
        data.endAt,
      );
      if (conflicts.length > 0) {
        const c = conflicts[0]!;
        throw new ConflictError(
          `演讲嘉宾在 ${data.startAt.toISOString()} ~ ${data.endAt.toISOString()} 已有议程「${c.title}」`,
        );
      }
    }
    return agendaRepository.create(data);
  },

  async update(id: string, data: AgendaUpdateData) {
    const existing = await agendaRepository.findById(id);
    if (!existing) throw new NotFoundError('AgendaItem', id);

    const newStart = data.startAt ?? existing.startAt;
    const newEnd = data.endAt ?? existing.endAt;
    const newSpeakers = data.speakerIds ?? existing.speakerIds;

    if (newEnd <= newStart) {
      throw new ConflictError('结束时间必须晚于开始时间');
    }

    // Re-check conflicts if time or speakers changed
    if (
      (data.startAt || data.endAt || data.speakerIds) &&
      newSpeakers.length > 0
    ) {
      const conflicts = await agendaRepository.findSpeakerItemsInRange(
        newSpeakers,
        newStart,
        newEnd,
        id,
      );
      if (conflicts.length > 0) {
        const c = conflicts[0]!;
        throw new ConflictError(
          `演讲嘉宾在此时段已有其他议程「${c.title}」`,
        );
      }
    }

    return agendaRepository.update(id, data);
  },

  async findById(id: string) {
    const item = await agendaRepository.findById(id);
    if (!item) throw new NotFoundError('AgendaItem', id);
    return item;
  },

  async listByMeeting(meetingId: string) {
    return agendaRepository.findByMeeting(meetingId);
  },

  async delete(id: string) {
    const existing = await agendaRepository.findById(id);
    if (!existing) throw new NotFoundError('AgendaItem', id);
    return agendaRepository.delete(id);
  },
};
