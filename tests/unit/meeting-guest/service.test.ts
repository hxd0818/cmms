import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('@/lib/domain/meeting-guest/repository', () => ({
  meetingGuestRepository: {
    create: vi.fn(),
    update: vi.fn(),
    findById: vi.fn(),
    findByMeetingAndGuest: vi.fn(),
    findByMeeting: vi.fn(),
    findSubordinates: vi.fn(),
    delete: vi.fn(),
  },
}));

import { meetingGuestService } from '@/lib/domain/meeting-guest/service';
import { meetingGuestRepository } from '@/lib/domain/meeting-guest/repository';
import { NotFoundError, ValidationError } from '@/lib/shared/errors';

describe('meetingGuestService', () => {
  beforeEach(() => vi.clearAllMocks());

  describe('create', () => {
    it('rejects duplicate (same guest in same meeting)', async () => {
      vi.mocked(meetingGuestRepository.findByMeetingAndGuest).mockResolvedValue({
        id: 'existing',
      } as never);
      await expect(
        meetingGuestService.create({
          meetingId: 'm1',
          guestId: 'g1',
          groupTags: [],
          inheritLodging: true,
          inheritTransport: true,
        }),
      ).rejects.toThrow(ValidationError);
    });

    it('creates when no duplicate', async () => {
      vi.mocked(meetingGuestRepository.findByMeetingAndGuest).mockResolvedValue(null);
      vi.mocked(meetingGuestRepository.create).mockResolvedValue({ id: 'mg1' } as never);
      const r = await meetingGuestService.create({
        meetingId: 'm1',
        guestId: 'g1',
        groupTags: [],
        inheritLodging: true,
        inheritTransport: true,
      });
      expect(r.id).toBe('mg1');
    });

    it('rejects subordinate when primary is in different meeting', async () => {
      vi.mocked(meetingGuestRepository.findByMeetingAndGuest).mockResolvedValue(null);
      vi.mocked(meetingGuestRepository.findById).mockResolvedValue({
        id: 'primary-mg',
        meetingId: 'other-meeting',
      } as never);
      await expect(
        meetingGuestService.create({
          meetingId: 'm1',
          guestId: 'g1',
          groupTags: [],
          inheritLodging: true,
          inheritTransport: true,
          primaryMeetingGuestId: 'primary-mg',
          entourageRole: 'SECRETARY',
        }),
      ).rejects.toThrow(ValidationError);
    });

    it('rejects subordinate when primary not found', async () => {
      vi.mocked(meetingGuestRepository.findByMeetingAndGuest).mockResolvedValue(null);
      vi.mocked(meetingGuestRepository.findById).mockResolvedValue(null);
      await expect(
        meetingGuestService.create({
          meetingId: 'm1',
          guestId: 'g1',
          groupTags: [],
          inheritLodging: true,
          inheritTransport: true,
          primaryMeetingGuestId: 'missing',
          entourageRole: 'SECRETARY',
        }),
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('delete', () => {
    it('rejects deletion of PRIMARY with subordinates', async () => {
      vi.mocked(meetingGuestRepository.findById).mockResolvedValue({
        id: 'mg1',
        entourageRole: 'PRIMARY',
      } as never);
      vi.mocked(meetingGuestRepository.findSubordinates).mockResolvedValue([
        { id: 'sub1' } as never,
      ]);
      await expect(meetingGuestService.delete('mg1')).rejects.toThrow(ValidationError);
    });

    it('allows deletion when no subordinates', async () => {
      vi.mocked(meetingGuestRepository.findById).mockResolvedValue({
        id: 'mg1',
        entourageRole: 'SECRETARY',
      } as never);
      vi.mocked(meetingGuestRepository.findSubordinates).mockResolvedValue([]);
      vi.mocked(meetingGuestRepository.delete).mockResolvedValue({} as never);
      await meetingGuestService.delete('mg1');
      expect(meetingGuestRepository.delete).toHaveBeenCalledWith('mg1');
    });
  });
});
