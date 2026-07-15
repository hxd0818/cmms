import ExcelJS from 'exceljs';
import { prisma } from '@/lib/db/client';
import { meetingGuestRepository } from './repository';
import { logger } from '@/lib/utils/logger';
import type { EntourageRole } from '@/lib/generated/prisma/enums';

const COLUMN_MAP = {
  姓名: 'name',
  手机: 'phone',
  分组标签: 'groupTags',
  随行角色: 'entourageRole',
  主嘉宾手机: 'primaryPhone',
} as const;

const ROLE_MAP: Record<string, EntourageRole> = {
  主嘉宾: 'PRIMARY',
  秘书: 'SECRETARY',
  安保: 'SECURITY',
  翻译: 'INTERPRETER',
  家属: 'FAMILY',
  助理: 'AIDE',
  司机: 'DRIVER',
};

export interface ImportResult {
  total: number;
  created: number;
  skipped: number;
  errors: { row: number; reason: string }[];
}

export async function processMeetingGuestImport(data: {
  filePath: string;
  meetingId: string;
  userId: string;
}): Promise<ImportResult> {
  const result: ImportResult = { total: 0, created: 0, skipped: 0, errors: [] };
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(data.filePath);

  const sheet = workbook.worksheets[0];
  if (!sheet) throw new Error('Excel file has no sheets');

  const headerMap: Record<number, string> = {};
  sheet.getRow(1).eachCell((cell, col) => {
    const header = String(cell.value ?? '').trim();
    if (header in COLUMN_MAP) {
      headerMap[col] = COLUMN_MAP[header as keyof typeof COLUMN_MAP];
    }
  });

  // First pass: collect rows
  const rows: Record<string, string>[] = [];
  for (let r = 2; r <= sheet.rowCount; r++) {
    const row = sheet.getRow(r);
    const record: Record<string, string> = {};
    for (const [col, field] of Object.entries(headerMap)) {
      const v = row.getCell(Number(col)).value;
      record[field] = v == null ? '' : String(v).trim();
    }
    rows.push(record);
  }

  // Resolve primary phones to MeetingGuest ids (second pass needed for subordinates)
  // Strategy: process PRIMARYs first, then subordinates
  const primaryFirst = [...rows].sort((a, b) => {
    const aIsPrimary = !a.primaryPhone;
    const bIsPrimary = !b.primaryPhone;
    return (aIsPrimary ? 0 : 1) - (bIsPrimary ? 0 : 1);
  });

  // Cache: phone -> MeetingGuest id (for this meeting)
  const primaryCache = new Map<string, string>();

  for (let i = 0; i < primaryFirst.length; i++) {
    const record = primaryFirst[i];
    if (!record) continue;
    result.total++;

    try {
      const phone = record.phone;
      const name = record.name;
      if (!name && !phone) {
        result.errors.push({ row: i + 2, reason: '姓名和手机都为空' });
        continue;
      }

      // Find Guest by phone (prefer) or name
      let guest;
      if (phone) {
        guest = await prisma.guest.findUnique({ where: { phone } });
      }
      if (!guest && name) {
        const candidates = await prisma.guest.findMany({
          where: { name, deletedAt: null },
          take: 2,
        });
        if (candidates.length === 1) guest = candidates[0];
        else if (candidates.length > 1) {
          result.errors.push({
            row: i + 2,
            reason: `姓名「${name}」匹配到多个嘉宾，请用手机号区分`,
          });
          continue;
        }
      }
      if (!guest) {
        result.errors.push({
          row: i + 2,
          reason: `未找到嘉宾${phone ? `（手机 ${phone}）` : `（姓名 ${name}）`}，请先在嘉宾库中创建`,
        });
        continue;
      }

      // Check if already in meeting
      const existing = await meetingGuestRepository.findByMeetingAndGuest(data.meetingId, guest.id);
      if (existing) {
        result.skipped++;
        // Cache for subordinate lookup
        if (phone) primaryCache.set(phone, existing.id);
        continue;
      }

      // Resolve primary if specified
      let primaryMeetingGuestId: string | undefined;
      let entourageRole: EntourageRole | undefined;
      if (record.primaryPhone) {
        primaryMeetingGuestId = primaryCache.get(record.primaryPhone);
        if (!primaryMeetingGuestId) {
          result.errors.push({
            row: i + 2,
            reason: `主嘉宾手机 ${record.primaryPhone} 不在会议中（请确保主嘉宾先出现）`,
          });
          continue;
        }
        entourageRole = record.entourageRole
          ? (ROLE_MAP[record.entourageRole] ?? 'SECRETARY')
          : 'SECRETARY';
      } else {
        entourageRole = record.entourageRole
          ? (ROLE_MAP[record.entourageRole] ?? 'PRIMARY')
          : 'PRIMARY';
      }

      const groupTags = record.groupTags
        ? record.groupTags
            .split(/[,，]/)
            .map((s) => s.trim())
            .filter(Boolean)
        : [];

      const mg = await meetingGuestRepository.create({
        meetingId: data.meetingId,
        guestId: guest.id,
        groupTags,
        primaryMeetingGuestId,
        entourageRole,
      });
      if (phone) primaryCache.set(phone, mg.id);
      result.created++;
    } catch (e) {
      result.errors.push({
        row: i + 2,
        reason: e instanceof Error ? e.message : 'unknown error',
      });
    }
  }

  logger.info(
    { result, meetingId: data.meetingId, userId: data.userId },
    'meeting-guest import done',
  );
  return result;
}
