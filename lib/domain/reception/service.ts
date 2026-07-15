import { meetingGuestRepository } from '@/lib/domain/meeting-guest/repository';
import { agendaRepository } from '@/lib/domain/agenda/repository';
import { transportRepository } from '@/lib/domain/transport/repository';
import { lodgingRepository } from '@/lib/domain/lodging/repository';
import { cateringRepository } from '@/lib/domain/catering/repository';
import { giftRepository } from '@/lib/domain/gift/repository';
import { NotFoundError, ValidationError } from '@/lib/shared/errors';
import type { ReceptionStage } from '@/lib/generated/prisma/enums';

const STAGE_TRANSITIONS: Record<ReceptionStage, ReceptionStage[]> = {
  NOT_ARRIVED: ['CHECKED_IN', 'NO_SHOW'],
  CHECKED_IN: ['IN_HOUSE'],
  IN_HOUSE: ['DEPARTED'],
  DEPARTED: [],
  NO_SHOW: [],
};

function assertTransition(current: ReceptionStage, target: ReceptionStage): void {
  if (!STAGE_TRANSITIONS[current].includes(target)) {
    throw new ValidationError(`Invalid reception stage transition: ${current} -> ${target}`);
  }
}

export const receptionService = {
  async checkIn(meetingGuestId: string) {
    const mg = await meetingGuestRepository.findById(meetingGuestId);
    if (!mg) throw new NotFoundError('MeetingGuest', meetingGuestId);
    assertTransition(mg.receptionStage as ReceptionStage, 'CHECKED_IN');
    return meetingGuestRepository.updateReceptionStage(meetingGuestId, 'CHECKED_IN');
  },

  async markNoShow(meetingGuestId: string) {
    const mg = await meetingGuestRepository.findById(meetingGuestId);
    if (!mg) throw new NotFoundError('MeetingGuest', meetingGuestId);
    assertTransition(mg.receptionStage as ReceptionStage, 'NO_SHOW');
    return meetingGuestRepository.updateReceptionStage(meetingGuestId, 'NO_SHOW');
  },

  async markDeparted(meetingGuestId: string) {
    const mg = await meetingGuestRepository.findById(meetingGuestId);
    if (!mg) throw new NotFoundError('MeetingGuest', meetingGuestId);
    assertTransition(mg.receptionStage as ReceptionStage, 'DEPARTED');
    return meetingGuestRepository.updateReceptionStage(meetingGuestId, 'DEPARTED');
  },

  async promoteToInHouse(meetingGuestId: string) {
    const mg = await meetingGuestRepository.findById(meetingGuestId);
    if (!mg) throw new NotFoundError('MeetingGuest', meetingGuestId);
    assertTransition(mg.receptionStage as ReceptionStage, 'IN_HOUSE');
    return meetingGuestRepository.updateReceptionStage(meetingGuestId, 'IN_HOUSE');
  },

  /**
   * Guest 360 view: aggregates all reception tasks for a MeetingGuest.
   * Includes transport, lodging, catering, gift, and agenda items.
   */
  async getGuest360(meetingGuestId: string) {
    const mg = await meetingGuestRepository.findById(meetingGuestId);
    if (!mg) throw new NotFoundError('MeetingGuest', meetingGuestId);

    const [agendaItems, allTransport, allLodging, allCatering, allGift] = await Promise.all([
      agendaRepository.findByMeeting(mg.meetingId),
      transportRepository.findByMeeting(mg.meetingId),
      lodgingRepository.findByMeeting(mg.meetingId),
      cateringRepository.findByMeeting(mg.meetingId),
      giftRepository.findOrdersByMeeting(mg.meetingId),
    ]);

    const transport = allTransport.filter((t) => t.meetingGuestId === meetingGuestId);
    const lodging = allLodging.filter((l) => l.meetingGuestId === meetingGuestId);
    const catering = allCatering.filter((c) => c.meetingGuestId === meetingGuestId);
    const gift = allGift.filter((g) => g.meetingGuestId === meetingGuestId);

    const totalTasks = transport.length + lodging.length + catering.length + gift.length;
    const isCompleted = (status: string) =>
      ['COMPLETED', 'CHECKED_OUT', 'FINISHED', 'DELIVERED'].includes(status);
    const completedTasks =
      transport.filter((t) => isCompleted(t.status)).length +
      lodging.filter((l) => isCompleted(l.status)).length +
      catering.filter((c) => isCompleted(c.status)).length +
      gift.filter((g) => isCompleted(g.status)).length;

    return {
      meetingGuest: mg,
      agenda: agendaItems.filter((a) => a.speakerIds.includes(meetingGuestId)),
      transport,
      lodging,
      catering,
      gift,
      stats: {
        totalTasks,
        completedTasks,
        pendingTasks: totalTasks - completedTasks,
      },
    };
  },

  async getKanbanData(meetingId: string) {
    const all = await meetingGuestRepository.findByMeeting({
      meetingId,
      pageSize: 500,
    });
    return {
      notArrived: all.filter((mg) => mg.receptionStage === 'NOT_ARRIVED'),
      checkedIn: all.filter((mg) => mg.receptionStage === 'CHECKED_IN'),
      inHouse: all.filter((mg) => mg.receptionStage === 'IN_HOUSE'),
      departed: all.filter(
        (mg) => mg.receptionStage === 'DEPARTED' || mg.receptionStage === 'NO_SHOW',
      ),
    };
  },
};
