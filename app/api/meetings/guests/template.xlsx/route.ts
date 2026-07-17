import ExcelJS from 'exceljs';
import { NextResponse } from 'next/server';

export async function GET() {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('会议嘉宾导入');

  sheet.columns = [
    { header: '姓名', key: 'name', width: 15 },
    { header: '手机', key: 'phone', width: 15 },
    { header: '分组标签', key: 'groupTags', width: 20 },
    { header: '随行角色', key: 'entourageRole', width: 12 },
    { header: '主嘉宾手机', key: 'primaryPhone', width: 18 },
    { header: '等级覆盖', key: 'levelOverride', width: 12 },
  ];

  // Example: main guest
  sheet.addRow({
    name: '张部长',
    phone: '13812345678',
    groupTags: 'VIP,演讲',
    entourageRole: '主嘉宾',
    primaryPhone: '',
    levelOverride: 'VIP-A',
  });

  // Example: subordinate (must come after primary in same file)
  sheet.addRow({
    name: '李某',
    phone: '13912345678',
    groupTags: '',
    entourageRole: '秘书',
    primaryPhone: '13812345678',
    levelOverride: '',
  });

  sheet.getRow(1).font = { bold: true };
  sheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE0E7FF' },
  };

  const buf = await workbook.xlsx.writeBuffer();
  return new NextResponse(Buffer.from(buf), {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="meeting-guest-import-template.xlsx"',
    },
  });
}
