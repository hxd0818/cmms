import type { MeetingGuest } from '@/lib/generated/prisma/client';
import type { EntourageRole, GuestLevel, ReceptionStage, RsvpStatus } from '@/lib/generated/prisma/enums';

export type MeetingGuestEntity = MeetingGuest;

export interface MeetingGuestCreateData {
  meetingId: string;
  guestId: string;
  groupTags?: string[];
  primaryMeetingGuestId?: string;
  entourageRole?: EntourageRole;
  levelOverride?: GuestLevel;
  inheritLodging?: boolean;
  inheritTransport?: boolean;
}

export interface MeetingGuestUpdateData {
  groupTags?: string[];
  receptionStage?: ReceptionStage;
  rsvpStatus?: RsvpStatus;
  primaryMeetingGuestId?: string | null;
  entourageRole?: EntourageRole | null;
  levelOverride?: GuestLevel | null;
  inheritLodging?: boolean;
  inheritTransport?: boolean;
}

export interface MeetingGuestListParams {
  meetingId: string;
  receptionStage?: ReceptionStage;
  entourageRole?: EntourageRole;
  search?: string;
  page?: number;
  pageSize?: number;
}
