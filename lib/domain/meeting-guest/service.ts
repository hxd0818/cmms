import { meetingGuestRepository } from './repository';
import { NotFoundError, ValidationError } from '@/lib/shared/errors';
import type {
  MeetingGuestCreateData,
  MeetingGuestListParams,
  MeetingGuestUpdateData,
} from './types';

export const meetingGuestService = {
  async create(data: MeetingGuestCreateData) {
    const existing = await meetingGuestRepository.findByMeetingAndGuest(
      data.meetingId,
      data.guestId,
    );
    if (existing) {
      throw new ValidationError('该嘉宾已在此会议中');
    }

    if (data.primaryMeetingGuestId) {
      const primary = await meetingGuestRepository.findById(data.primaryMeetingGuestId);
      if (!primary) {
        throw new NotFoundError('MeetingGuest (primary)', data.primaryMeetingGuestId);
      }
      if (primary.meetingId !== data.meetingId) {
        throw new ValidationError('主嘉宾必须在同一会议中');
      }
    }

    return meetingGuestRepository.create(data);
  },

  async update(id: string, data: MeetingGuestUpdateData) {
    const existing = await meetingGuestRepository.findById(id);
    if (!existing) throw new NotFoundError('MeetingGuest', id);

    if (data.primaryMeetingGuestId) {
      const primary = await meetingGuestRepository.findById(data.primaryMeetingGuestId);
      if (!primary) {
        throw new NotFoundError('MeetingGuest (primary)', data.primaryMeetingGuestId);
      }
      if (primary.meetingId !== existing.meetingId) {
        throw new ValidationError('主嘉宾必须在同一会议中');
      }
    }

    return meetingGuestRepository.update(id, data);
  },

  async findById(id: string) {
    const mg = await meetingGuestRepository.findByIdWithRelations(id);
    if (!mg) throw new NotFoundError('MeetingGuest', id);
    return mg;
  },

  async listByMeeting(params: MeetingGuestListParams) {
    return meetingGuestRepository.findByMeeting(params);
  },

  async findSubordinates(primaryMeetingGuestId: string) {
    return meetingGuestRepository.findSubordinates(primaryMeetingGuestId);
  },

  async delete(id: string) {
    const existing = await meetingGuestRepository.findById(id);
    if (!existing) throw new NotFoundError('MeetingGuest', id);

    const subs = await meetingGuestRepository.findSubordinates(id);
    if (subs.length > 0) {
      throw new ValidationError(`该嘉宾有 ${subs.length} 位随行人员，请先迁移或删除随行`);
    }
    return meetingGuestRepository.delete(id);
  },
};
