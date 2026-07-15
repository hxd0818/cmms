import type { Guest } from '@/lib/generated/prisma/client';
import type { GuestLevel, Gender } from '@/lib/generated/prisma/enums';

export type GuestEntity = Guest;

export interface GuestListParams {
  search?: string;
  level?: GuestLevel;
  company?: string;
  page?: number;
  pageSize?: number;
  includeDeleted?: boolean;
}

export interface GuestListResult {
  items: Guest[];
  total: number;
  page: number;
  pageSize: number;
}

export interface GuestCreateData {
  name: string;
  gender?: Gender;
  phone?: string;
  email?: string;
  company?: string;
  title?: string;
  level: GuestLevel;
  avatarUrl?: string;
  idNumber?: string;
  dietaryTags?: string[];
  notes?: string;
}

export interface GuestUpdateData {
  name?: string;
  gender?: Gender | null;
  phone?: string | null;
  email?: string | null;
  company?: string | null;
  title?: string | null;
  level?: GuestLevel;
  avatarUrl?: string | null;
  idNumber?: string | null;
  dietaryTags?: string[];
  notes?: string | null;
}
