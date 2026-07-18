import ExcelJS from 'exceljs';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/client';
import { auth } from '@/lib/auth/index';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, { params }: RouteParams) {
  const session = await auth();
  if (!session?.user) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') ?? 'summary';

  const meeting = await prisma.meeting.findUnique({ where: { id } });
  if (!meeting) {
    return new NextResponse('Meeting not found', { status: 404 });
  }

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'CMMS';
  workbook.created = new Date();

  if (type === 'guests') {
    await exportGuests(workbook, id);
  } else if (type === 'fees') {
    await exportFees(workbook, id);
  } else {
    await exportSummary(workbook, id);
  }

  const buf = await workbook.xlsx.writeBuffer();
  const fileName = `${meeting.code}-${type}-${new Date().toISOString().slice(0, 10)}.xlsx`;

  return new NextResponse(Buffer.from(buf), {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${fileName}"`,
    },
  });
}

async function exportSummary(workbook: ExcelJS.Workbook, meetingId: string) {
  const meeting = await prisma.meeting.findUnique({ where: { id: meetingId } });
  const guestCount = await prisma.meetingGuest.count({ where: { meetingId } });
  const transportCount = await prisma.transportOrder.count({ where: { meetingId } });
  const lodgingCount = await prisma.lodgingOrder.count({ where: { meetingId } });
  const cateringCount = await prisma.cateringOrder.count({ where: { meetingId } });
  const giftCount = await prisma.giftOrder.count({ where: { meetingId } });
  const feeResult = await prisma.feeRecord.aggregate({
    where: { meetingId },
    _sum: { amount: true },
  });

  const sheet = workbook.addWorksheet('会议概览');
  sheet.columns = [
    { header: '项目', key: 'item', width: 20 },
    { header: '数值', key: 'value', width: 30 },
  ];

  sheet.addRow({ item: '会议名称', value: meeting?.name });
  sheet.addRow({ item: '会议编号', value: meeting?.code });
  sheet.addRow({ item: '开始时间', value: meeting?.startAt.toLocaleString('zh-CN') });
  sheet.addRow({ item: '结束时间', value: meeting?.endAt.toLocaleString('zh-CN') });
  sheet.addRow({ item: '场地', value: meeting?.venue ?? '-' });
  sheet.addRow({ item: '参会嘉宾', value: guestCount });
  sheet.addRow({ item: '接送任务', value: transportCount });
  sheet.addRow({ item: '住宿订单', value: lodgingCount });
  sheet.addRow({ item: '餐饮安排', value: cateringCount });
  sheet.addRow({ item: '礼品订单', value: giftCount });
  sheet.addRow({ item: '费用合计', value: Number(feeResult._sum.amount ?? 0) });

  formatHeader(sheet);

  // Also add guests sheet
  await exportGuests(workbook, meetingId);
}

async function exportGuests(workbook: ExcelJS.Workbook, meetingId: string) {
  const sheet = workbook.addWorksheet('嘉宾名单');
  sheet.columns = [
    { header: '姓名', key: 'name', width: 12 },
    { header: '单位', key: 'company', width: 20 },
    { header: '职务', key: 'title', width: 15 },
    { header: '等级', key: 'level', width: 8 },
    { header: '手机', key: 'phone', width: 15 },
    { header: '角色', key: 'role', width: 10 },
    { header: '签到状态', key: 'reception', width: 10 },
    { header: '分组', key: 'tags', width: 20 },
  ];

  const guests = await prisma.meetingGuest.findMany({
    where: { meetingId },
    include: { guest: true },
    orderBy: { guest: { name: 'asc' } },
  });

  for (const mg of guests) {
    sheet.addRow({
      name: mg.guest.name,
      company: mg.guest.company ?? '-',
      title: mg.guest.title ?? '-',
      level: mg.levelOverride ?? mg.guest.level,
      phone: mg.guest.phone ?? '-',
      role: mg.entourageRole ?? '-',
      reception: mg.receptionStage,
      tags: (mg.groupTags ?? []).join(', '),
    });
  }

  formatHeader(sheet);
}

async function exportFees(workbook: ExcelJS.Workbook, meetingId: string) {
  const sheet = workbook.addWorksheet('费用明细');
  sheet.columns = [
    { header: '嘉宾', key: 'guest', width: 12 },
    { header: '类别', key: 'category', width: 10 },
    { header: '金额', key: 'amount', width: 10 },
    { header: '备注', key: 'notes', width: 30 },
    { header: '时间', key: 'time', width: 20 },
  ];

  const fees = await prisma.feeRecord.findMany({
    where: { meetingId },
    orderBy: { incurredAt: 'desc' },
  });

  // Batch load guest names
  const guestIds = [...new Set(fees.map((f) => f.meetingGuestId).filter(Boolean))] as string[];
  const guests = guestIds.length > 0
    ? await prisma.meetingGuest.findMany({
        where: { id: { in: guestIds } },
        include: { guest: true },
      })
    : [];
  const guestMap = new Map(guests.map((mg) => [mg.id, mg.guest.name]));

  for (const f of fees) {
    sheet.addRow({
      guest: f.meetingGuestId ? guestMap.get(f.meetingGuestId) ?? '-' : '-',
      category: f.category,
      amount: Number(f.amount),
      notes: f.notes ?? '-',
      time: f.incurredAt.toLocaleString('zh-CN'),
    });
  }

  formatHeader(sheet);
}

function formatHeader(sheet: ExcelJS.Worksheet) {
  const headerRow = sheet.getRow(1);
  headerRow.font = { bold: true };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE7E5E4' },
  };
}
