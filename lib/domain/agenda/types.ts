import type { AgendaItem } from '@/lib/generated/prisma/client';
import type { AgendaType } from '@/lib/generated/prisma/enums';

export type AgendaItemEntity = AgendaItem;

export interface AgendaCreateData {
  meetingId: string;
  title: string;
  type: AgendaType;
  startAt: Date;
  endAt: Date;
  venue?: string;
  speakerIds?: string[];
  notes?: string;
}

export interface AgendaUpdateData {
  title?: string;
  type?: AgendaType;
  startAt?: Date;
  endAt?: Date;
  venue?: string | null;
  speakerIds?: string[];
  notes?: string | null;
}
