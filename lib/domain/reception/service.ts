import { meetingGuestRepository } from '@/lib/domain/meeting-guest/repository';
import { agendaRepository } from '@/lib/domain/agenda/repository';
import { NotFoundError, ValidationError } from '@/lib/shared/errors';
import type { ReceptionStage } from '@/lib/generated/prisma/enums';

const STAGE_TRANSITIONS: Record<ReceptionStage, ReceptionStage[]> = {
  NOT_ARRIVED: ['CHECKED_IN', 'NO_SHOW'],
  CHECKED_IN: ['IN_HOUSE'],
  IN_HOUSE: ['DEPARTED'],
  DEPARTED: [],
  NO_SHOW: [],
};

function assertTransition(
  current: ReceptionStage,
  target: ReceptionStage,
): void {
  if (!STAGE_TRANSITIONS[current].includes(target)) {
    throw new ValidationError(
      `Invalid reception stage transition: ${current} -> ${target}`,
    );
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
   * Guest 360 view: aggregates meeting guest info + agenda items where this
   * guest is a speaker. Phase 3 will expand to include transport/lodging/
   * catering/gift/companion/fee.
   */
  async getGuest360(meetingGuestId: string) {
    const mg = await meetingGuestRepository.findById(meetingGuestId);
    if (!mg) throw new NotFoundError('MeetingGuest', meetingGuestId);

    const agendaItems = await agendaRepository.findByMeeting(mg.meetingId);

    return {
      meetingGuest: mg,
      agenda: agendaItems.filter((a) => a.speakerIds.includes(meetingGuestId)),
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
