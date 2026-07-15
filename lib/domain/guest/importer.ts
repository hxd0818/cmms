import ExcelJS from 'exceljs';
import { guestRepository } from './repository';
import { logger } from '@/lib/utils/logger';
import type { GuestCreateData } from './types';
import type { GuestLevel } from '@/lib/generated/prisma/enums';

const COLUMN_MAP = {
  姓名: 'name',
  性别: 'gender',
  手机: 'phone',
  邮箱: 'email',
  单位: 'company',
  职务: 'title',
  等级: 'level',
  身份证号: 'idNumber',
  饮食标签: 'dietaryTags',
  备注: 'notes',
} as const;

const LEVEL_MAP: Record<string, GuestLevel> = {
  'VIP-A': 'VIP_A',
  'VIP-B': 'VIP_B',
  A: 'A',
  B: 'B',
  C: 'C',
};

const GENDER_MAP: Record<string, 'MALE' | 'FEMALE' | 'OTHER'> = {
  男: 'MALE',
  女: 'FEMALE',
  其他: 'OTHER',
};

export interface ImportResult {
  total: number;
  created: number;
  skipped: number;
  errors: { row: number; reason: string }[];
}

export async function processGuestImport(data: {
  filePath: string;
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

  for (let r = 2; r <= sheet.rowCount; r++) {
    result.total++;
    const row = sheet.getRow(r);
    const record: Record<string, unknown> = {};
    for (const [col, field] of Object.entries(headerMap)) {
      record[field] = row.getCell(Number(col)).value;
    }

    try {
      const name = String(record.name ?? '').trim();
      if (!name) {
        result.errors.push({ row: r, reason: '姓名必填' });
        continue;
      }

      const phone = record.phone ? String(record.phone).trim() : undefined;

      if (phone) {
        const existing = await guestRepository.findByPhone(phone);
        if (existing) {
          result.skipped++;
          continue;
        }
      }

      const levelRaw = String(record.level ?? 'C').trim();
      const level = LEVEL_MAP[levelRaw] ?? 'C';
      const genderRaw = record.gender ? String(record.gender).trim() : '';
      const gender = GENDER_MAP[genderRaw];

      const guestData: GuestCreateData = {
        name,
        gender,
        phone,
        email: record.email ? String(record.email).trim() : undefined,
        company: record.company ? String(record.company).trim() : undefined,
        title: record.title ? String(record.title).trim() : undefined,
        level,
        idNumber: record.idNumber ? String(record.idNumber).trim() : undefined,
        dietaryTags: record.dietaryTags
          ? String(record.dietaryTags)
              .split(/[,，]/)
              .map((s) => s.trim())
              .filter(Boolean)
          : [],
        notes: record.notes ? String(record.notes).trim() : undefined,
      };

      await guestRepository.create(guestData);
      result.created++;
    } catch (e) {
      result.errors.push({
        row: r,
        reason: e instanceof Error ? e.message : 'unknown error',
      });
    }
  }

  logger.info({ result, userId: data.userId }, 'guest import completed');
  return result;
}
