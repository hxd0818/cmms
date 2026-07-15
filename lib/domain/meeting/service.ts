import { meetingRepository } from './repository';
import { ConflictError, NotFoundError, ValidationError } from '@/lib/shared/errors';
import type { MeetingStatus } from '@/lib/generated/prisma/enums';
import type { MeetingCreateData, MeetingListParams, MeetingUpdateData } from './types';

const STATUS_TRANSITIONS: Record<MeetingStatus, MeetingStatus[]> = {
  DRAFT: ['PLANNING', 'CANCELED'],
  PLANNING: ['ONGOING', 'CANCELED'],
  ONGOING: ['COMPLETED', 'CANCELED'],
  COMPLETED: [],
  CANCELED: [],
};

export const meetingService = {
  async create(data: MeetingCreateData) {
    const existing = await meetingRepository.findByCode(data.code);
    if (existing) {
      throw new ConflictError(`Meeting with code ${data.code} already exists`);
    }
    return meetingRepository.create(data);
  },

  async update(id: string, data: MeetingUpdateData) {
    const existing = await meetingRepository.findById(id);
    if (!existing) throw new NotFoundError('Meeting', id);

    if (data.code && data.code !== existing.code) {
      const dupe = await meetingRepository.findByCode(data.code);
      if (dupe) throw new ConflictError(`Code ${data.code} already in use`);
    }

    return meetingRepository.update(id, data);
  },

  async updateStatus(id: string, target: MeetingStatus) {
    const existing = await meetingRepository.findById(id);
    if (!existing) throw new NotFoundError('Meeting', id);

    const current = existing.status as MeetingStatus;
    if (current === target) {
      throw new ValidationError(`Meeting already in status ${current}`);
    }
    if (!STATUS_TRANSITIONS[current].includes(target)) {
      throw new ValidationError(`Invalid status transition: ${current} -> ${target}`);
    }
    return meetingRepository.updateStatus(id, target);
  },

  async findById(id: string) {
    const meeting = await meetingRepository.findById(id);
    if (!meeting) throw new NotFoundError('Meeting', id);
    return meeting;
  },

  async list(params: MeetingListParams) {
    return meetingRepository.list(params);
  },
};
