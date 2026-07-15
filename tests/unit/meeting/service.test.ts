import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('@/lib/domain/meeting/repository', () => ({
  meetingRepository: {
    create: vi.fn(),
    update: vi.fn(),
    updateStatus: vi.fn(),
    findById: vi.fn(),
    findByCode: vi.fn(),
    list: vi.fn(),
  },
}));

import { meetingService } from '@/lib/domain/meeting/service';
import { meetingRepository } from '@/lib/domain/meeting/repository';
import { ConflictError, NotFoundError, ValidationError } from '@/lib/shared/errors';

describe('meetingService', () => {
  beforeEach(() => vi.clearAllMocks());

  describe('create', () => {
    it('rejects duplicate code', async () => {
      vi.mocked(meetingRepository.findByCode).mockResolvedValue({ id: 'existing' } as never);
      await expect(
        meetingService.create({
          name: 'X',
          code: 'DUP',
          startAt: new Date('2026-08-01'),
          endAt: new Date('2026-08-03'),
        }),
      ).rejects.toThrow(ConflictError);
    });

    it('creates when code is unique', async () => {
      vi.mocked(meetingRepository.findByCode).mockResolvedValue(null);
      vi.mocked(meetingRepository.create).mockResolvedValue({ id: 'm1' } as never);
      const r = await meetingService.create({
        name: 'X',
        code: 'UNIQUE',
        startAt: new Date('2026-08-01'),
        endAt: new Date('2026-08-03'),
      });
      expect(r.id).toBe('m1');
    });
  });

  describe('updateStatus', () => {
    it('rejects unknown meeting', async () => {
      vi.mocked(meetingRepository.findById).mockResolvedValue(null);
      await expect(meetingService.updateStatus('m1', 'ONGOING')).rejects.toThrow(NotFoundError);
    });

    it('rejects invalid transition (COMPLETED -> ONGOING)', async () => {
      vi.mocked(meetingRepository.findById).mockResolvedValue({
        id: 'm1',
        status: 'COMPLETED',
      } as never);
      await expect(meetingService.updateStatus('m1', 'ONGOING')).rejects.toThrow(ValidationError);
    });

    it('rejects transition from CANCELED', async () => {
      vi.mocked(meetingRepository.findById).mockResolvedValue({
        id: 'm1',
        status: 'CANCELED',
      } as never);
      await expect(meetingService.updateStatus('m1', 'ONGOING')).rejects.toThrow(ValidationError);
    });

    it('allows DRAFT -> PLANNING', async () => {
      vi.mocked(meetingRepository.findById).mockResolvedValue({
        id: 'm1',
        status: 'DRAFT',
      } as never);
      vi.mocked(meetingRepository.updateStatus).mockResolvedValue({} as never);
      await meetingService.updateStatus('m1', 'PLANNING');
      expect(meetingRepository.updateStatus).toHaveBeenCalledWith('m1', 'PLANNING');
    });

    it('allows any -> CANCELED', async () => {
      vi.mocked(meetingRepository.findById).mockResolvedValue({
        id: 'm1',
        status: 'ONGOING',
      } as never);
      vi.mocked(meetingRepository.updateStatus).mockResolvedValue({} as never);
      await meetingService.updateStatus('m1', 'CANCELED');
    });

    it('rejects same status (no-op)', async () => {
      vi.mocked(meetingRepository.findById).mockResolvedValue({
        id: 'm1',
        status: 'ONGOING',
      } as never);
      await expect(meetingService.updateStatus('m1', 'ONGOING')).rejects.toThrow(ValidationError);
    });
  });
});
