import type { Meeting } from '@/lib/generated/prisma/client';
import type { MeetingStatus } from '@/lib/generated/prisma/enums';

export type MeetingEntity = Meeting;

export interface MeetingListParams {
  search?: string;
  status?: MeetingStatus;
  page?: number;
  pageSize?: number;
}

export interface MeetingListResult {
  items: Meeting[];
  total: number;
  page: number;
  pageSize: number;
}

export interface MeetingCreateData {
  name: string;
  code: string;
  startAt: Date;
  endAt: Date;
  venue?: string;
  description?: string;
}

export interface MeetingUpdateData {
  name?: string;
  code?: string;
  startAt?: Date;
  endAt?: Date;
  venue?: string;
  description?: string;
}
