import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('@/lib/domain/agenda/repository', () => ({
  agendaRepository: {
    create: vi.fn(),
    update: vi.fn(),
    findById: vi.fn(),
    findByMeeting: vi.fn(),
    findSpeakerItemsInRange: vi.fn(),
    delete: vi.fn(),
  },
}));

import { agendaService } from '@/lib/domain/agenda/service';
import { agendaRepository } from '@/lib/domain/agenda/repository';
import { ConflictError, NotFoundError } from '@/lib/shared/errors';

describe('agendaService', () => {
  beforeEach(() => vi.clearAllMocks());

  describe('create', () => {
    it('rejects when speaker has time conflict', async () => {
      vi.mocked(agendaRepository.findSpeakerItemsInRange).mockResolvedValue([
        { id: 'existing', title: '开幕式' } as never,
      ]);
      await expect(
        agendaService.create({
          meetingId: 'm1',
          title: '座谈会',
          type: 'PANEL',
          startAt: new Date('2026-08-01T09:00:00Z'),
          endAt: new Date('2026-08-01T10:00:00Z'),
          speakerIds: ['speaker-1'],
        }),
      ).rejects.toThrow(ConflictError);
    });

    it('creates when no conflict', async () => {
      vi.mocked(agendaRepository.findSpeakerItemsInRange).mockResolvedValue([]);
      vi.mocked(agendaRepository.create).mockResolvedValue({ id: 'a1' } as never);
      const r = await agendaService.create({
        meetingId: 'm1',
        title: '茶歇',
        type: 'BREAK',
        startAt: new Date('2026-08-01T10:00:00Z'),
        endAt: new Date('2026-08-01T10:30:00Z'),
        speakerIds: [],
      });
      expect(r.id).toBe('a1');
    });

    it('checks all speakers when multiple', async () => {
      // Repository takes all speakers in one query (hasSome)
      vi.mocked(agendaRepository.findSpeakerItemsInRange).mockResolvedValue([
        { id: 'conflict', title: '其他议程' } as never,
      ]);
      await expect(
        agendaService.create({
          meetingId: 'm1',
          title: '座谈',
          type: 'PANEL',
          startAt: new Date('2026-08-01T09:00:00Z'),
          endAt: new Date('2026-08-01T10:00:00Z'),
          speakerIds: ['speaker-1', 'speaker-2'],
        }),
      ).rejects.toThrow(ConflictError);
      // Single query with all speaker IDs (3 args on create)
      expect(agendaRepository.findSpeakerItemsInRange).toHaveBeenCalledWith(
        ['speaker-1', 'speaker-2'],
        expect.any(Date),
        expect.any(Date),
      );
    });
  });

  describe('update', () => {
    it('rejects unknown agenda', async () => {
      vi.mocked(agendaRepository.findById).mockResolvedValue(null);
      await expect(agendaService.update('missing', { title: 'X' })).rejects.toThrow(
        NotFoundError,
      );
    });

    it('checks conflict when time changes', async () => {
      vi.mocked(agendaRepository.findById).mockResolvedValue({
        id: 'a1',
        meetingId: 'm1',
        startAt: new Date('2026-08-01T09:00:00Z'),
        endAt: new Date('2026-08-01T10:00:00Z'),
        speakerIds: ['s1'],
      } as never);
      vi.mocked(agendaRepository.findSpeakerItemsInRange).mockResolvedValue([
        { id: 'other', title: '冲突议程' } as never,
      ]);
      await expect(
        agendaService.update('a1', {
          startAt: new Date('2026-08-01T11:00:00Z'),
          endAt: new Date('2026-08-01T12:00:00Z'),
        }),
      ).rejects.toThrow(ConflictError);
    });
  });
});
