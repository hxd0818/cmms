import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('@/lib/domain/transport/repository', () => ({
  transportRepository: {
    create: vi.fn(),
    update: vi.fn(),
    findById: vi.fn(),
    findByMeeting: vi.fn(),
    findVehicleBookingsInRange: vi.fn(),
    updateStatus: vi.fn(),
    assign: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock('@/lib/domain/vehicle/repository', () => ({
  vehicleRepository: {
    findById: vi.fn(),
  },
}));

vi.mock('@/lib/domain/meeting-guest/repository', () => ({
  meetingGuestRepository: {
    findSubordinates: vi.fn(),
    findById: vi.fn(),
  },
}));

vi.mock('@/lib/domain/fee/service', () => ({
  feeService: {
    create: vi.fn().mockResolvedValue({}),
  },
}));

import { transportService } from '@/lib/domain/transport/service';
import { transportRepository } from '@/lib/domain/transport/repository';
import { vehicleRepository } from '@/lib/domain/vehicle/repository';
import { meetingGuestRepository } from '@/lib/domain/meeting-guest/repository';
import { NotFoundError, ValidationError } from '@/lib/shared/errors';

describe('transportService', () => {
  beforeEach(() => vi.clearAllMocks());

  describe('assign', () => {
    it('rejects unknown order', async () => {
      vi.mocked(transportRepository.findById).mockResolvedValue(null);
      await expect(transportService.assign('missing', 'v1')).rejects.toThrow(NotFoundError);
    });

    it('allows ride-sharing when vehicle has existing bookings but capacity available', async () => {
      vi.mocked(transportRepository.findById).mockResolvedValue({
        id: 'o1',
        meetingGuestId: 'mg1',
        meetingId: 'm1',
        pickupTime: new Date('2026-08-01T10:00:00Z'),
        status: 'UNASSIGNED',
      } as never);
      vi.mocked(transportRepository.findVehicleBookingsInRange).mockResolvedValue([
        { id: 'other', meetingGuestId: 'mg2' } as never,
      ]);
      vi.mocked(meetingGuestRepository.findSubordinates).mockResolvedValue([]);
      vi.mocked(vehicleRepository.findById).mockResolvedValue({
        id: 'v1',
        capacity: 7,
      } as never);
      vi.mocked(transportRepository.assign).mockResolvedValue({ id: 'o1', vehicleId: 'v1' } as never);
      // 1 existing + 1 new = 2 ≤ 7 capacity, should succeed
      const result = await transportService.assign('o1', 'v1');
      expect(result).toBeDefined();
    });

    it('rejects when vehicle capacity < guests + inheritTransport subordinates', async () => {
      vi.mocked(transportRepository.findById).mockResolvedValue({
        id: 'o1',
        meetingGuestId: 'mg1',
        pickupTime: new Date('2026-08-01T10:00:00Z'),
        status: 'UNASSIGNED',
      } as never);
      vi.mocked(transportRepository.findVehicleBookingsInRange).mockResolvedValue([]);
      vi.mocked(meetingGuestRepository.findSubordinates).mockResolvedValue([
        { id: 'sub1', inheritTransport: true } as never,
        { id: 'sub2', inheritTransport: true } as never,
      ]);
      vi.mocked(vehicleRepository.findById).mockResolvedValue({
        id: 'v1',
        capacity: 2,
      } as never);
      // Need 3 seats (1 main + 2 inheritTransport subs), vehicle has 2
      await expect(transportService.assign('o1', 'v1')).rejects.toThrow(ValidationError);
    });

    it('allows when capacity sufficient', async () => {
      vi.mocked(transportRepository.findById).mockResolvedValue({
        id: 'o1',
        meetingGuestId: 'mg1',
        pickupTime: new Date('2026-08-01T10:00:00Z'),
        status: 'UNASSIGNED',
      } as never);
      vi.mocked(transportRepository.findVehicleBookingsInRange).mockResolvedValue([]);
      vi.mocked(meetingGuestRepository.findSubordinates).mockResolvedValue([]);
      vi.mocked(vehicleRepository.findById).mockResolvedValue({
        id: 'v1',
        capacity: 4,
      } as never);
      vi.mocked(transportRepository.assign).mockResolvedValue({} as never);
      await transportService.assign('o1', 'v1');
      expect(transportRepository.assign).toHaveBeenCalledWith('o1', 'v1');
    });
  });

  describe('updateStatus', () => {
    it('rejects invalid transition', async () => {
      vi.mocked(transportRepository.findById).mockResolvedValue({
        id: 'o1',
        status: 'COMPLETED',
      } as never);
      await expect(transportService.updateStatus('o1', 'ASSIGNED')).rejects.toThrow(
        ValidationError,
      );
    });

    it('allows UNASSIGNED -> ASSIGNED', async () => {
      vi.mocked(transportRepository.findById).mockResolvedValue({
        id: 'o1',
        status: 'UNASSIGNED',
      } as never);
      vi.mocked(transportRepository.updateStatus).mockResolvedValue({} as never);
      await transportService.updateStatus('o1', 'ASSIGNED');
    });
  });
});
