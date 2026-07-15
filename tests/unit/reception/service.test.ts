import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('@/lib/domain/meeting-guest/repository', () => ({
  meetingGuestRepository: {
    findById: vi.fn(),
    updateReceptionStage: vi.fn(),
    findByMeeting: vi.fn(),
  },
}));

vi.mock('@/lib/domain/agenda/repository', () => ({
  agendaRepository: {
    findByMeeting: vi.fn().mockResolvedValue([]),
  },
}));

vi.mock('@/lib/domain/transport/repository', () => ({
  transportRepository: {
    findByMeeting: vi.fn().mockResolvedValue([]),
  },
}));

vi.mock('@/lib/domain/lodging/repository', () => ({
  lodgingRepository: {
    findByMeeting: vi.fn().mockResolvedValue([]),
  },
}));

vi.mock('@/lib/domain/catering/repository', () => ({
  cateringRepository: {
    findByMeeting: vi.fn().mockResolvedValue([]),
  },
}));

vi.mock('@/lib/domain/gift/repository', () => ({
  giftRepository: {
    findOrdersByMeeting: vi.fn().mockResolvedValue([]),
  },
}));

import { receptionService } from '@/lib/domain/reception/service';
import { meetingGuestRepository } from '@/lib/domain/meeting-guest/repository';
import { NotFoundError, ValidationError } from '@/lib/shared/errors';

describe('receptionService', () => {
  beforeEach(() => vi.clearAllMocks());

  describe('checkIn', () => {
    it('rejects unknown meeting guest', async () => {
      vi.mocked(meetingGuestRepository.findById).mockResolvedValue(null);
      await expect(receptionService.checkIn('missing')).rejects.toThrow(NotFoundError);
    });

    it('rejects invalid transition (DEPARTED -> CHECKED_IN)', async () => {
      vi.mocked(meetingGuestRepository.findById).mockResolvedValue({
        id: 'mg1',
        receptionStage: 'DEPARTED',
      } as never);
      await expect(receptionService.checkIn('mg1')).rejects.toThrow(ValidationError);
    });

    it('allows NOT_ARRIVED -> CHECKED_IN', async () => {
      vi.mocked(meetingGuestRepository.findById).mockResolvedValue({
        id: 'mg1',
        receptionStage: 'NOT_ARRIVED',
      } as never);
      vi.mocked(meetingGuestRepository.updateReceptionStage).mockResolvedValue({} as never);
      await receptionService.checkIn('mg1');
      expect(meetingGuestRepository.updateReceptionStage).toHaveBeenCalledWith('mg1', 'CHECKED_IN');
    });

    it('markNoShow allows only from NOT_ARRIVED', async () => {
      vi.mocked(meetingGuestRepository.findById).mockResolvedValue({
        id: 'mg1',
        receptionStage: 'NOT_ARRIVED',
      } as never);
      vi.mocked(meetingGuestRepository.updateReceptionStage).mockResolvedValue({} as never);
      await receptionService.markNoShow('mg1');

      vi.mocked(meetingGuestRepository.findById).mockResolvedValue({
        id: 'mg2',
        receptionStage: 'CHECKED_IN',
      } as never);
      await expect(receptionService.markNoShow('mg2')).rejects.toThrow(ValidationError);
    });

    it('markDeparted allows only from IN_HOUSE', async () => {
      vi.mocked(meetingGuestRepository.findById).mockResolvedValue({
        id: 'mg1',
        receptionStage: 'IN_HOUSE',
      } as never);
      vi.mocked(meetingGuestRepository.updateReceptionStage).mockResolvedValue({} as never);
      await receptionService.markDeparted('mg1');

      vi.mocked(meetingGuestRepository.findById).mockResolvedValue({
        id: 'mg2',
        receptionStage: 'CHECKED_IN',
      } as never);
      await expect(receptionService.markDeparted('mg2')).rejects.toThrow(ValidationError);
    });
  });
});
