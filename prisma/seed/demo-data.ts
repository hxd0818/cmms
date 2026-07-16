/**
 * Demo data seed — creates a complete meeting with ALL reception task types.
 * Run: pnpm exec tsx prisma/seed/demo-data.ts
 */
import 'dotenv/config';
import { prisma } from '../../lib/db/client';

async function main() {
  // 1. Get or create a meeting
  let meeting = await prisma.meeting.findFirst({
    where: { code: 'DEMO-2026' },
  });

  if (!meeting) {
    meeting = await prisma.meeting.create({
      data: {
        name: '2026 行业峰会（演示）',
        code: 'DEMO-2026',
        status: 'PLANNING',
        startAt: new Date('2026-09-01T09:00:00'),
        endAt: new Date('2026-09-03T18:00:00'),
        venue: '国际会议中心',
        description: '完整接待流程演示数据',
      },
    });
    console.log('Created meeting:', meeting.name);
  } else {
    console.log('Using existing meeting:', meeting.name);
  }

  // 2. Get guests from library
  const guests = await prisma.guest.findMany({
    where: { deletedAt: null },
    take: 5,
    orderBy: { createdAt: 'asc' },
  });

  if (guests.length < 3) {
    console.log('Not enough guests in library, creating some...');
    for (let i = guests.length; i < 5; i++) {
      const g = await prisma.guest.create({
        data: {
          name: '演示嘉宾 ' + (i + 1),
          phone: '1390000' + String(i + 1).padStart(4, '0'),
          company: '演示公司 ' + String.fromCharCode(65 + i),
          title: '总经理',
          level: i < 2 ? 'VIP_A' : 'B',
          dietaryTags: i % 2 === 0 ? ['清真'] : [],
        },
      });
      guests.push(g);
    }
  }

  // 3. Add guests to meeting as MeetingGuest
  const meetingGuests = [];
  for (let i = 0; i < guests.length; i++) {
    const existing = await prisma.meetingGuest.findUnique({
      where: { meetingId_guestId: { meetingId: meeting.id, guestId: guests[i]!.id } },
    });
    if (existing) {
      meetingGuests.push(existing);
    } else {
      const mg = await prisma.meetingGuest.create({
        data: {
          meetingId: meeting.id,
          guestId: guests[i]!.id,
          entourageRole: i === 0 ? 'PRIMARY' : i === 1 ? 'SECRETARY' : 'PRIMARY',
          groupTags: i < 2 ? ['VIP', 'SPEAKER'] : ['ATTENDEE'],
        },
      });
      meetingGuests.push(mg);
    }
  }
  console.log('Meeting guests:', meetingGuests.length);

  // 4. Create hotel + rooms
  let hotel = await prisma.hotel.findFirst({ where: { name: '国际大酒店' } });
  if (!hotel) {
    hotel = await prisma.hotel.create({
      data: { name: '国际大酒店', address: '会议中心路 1 号', contactPhone: '010-88888888' },
    });
    console.log('Created hotel:', hotel.name);
  }

  const roomTypes: Array<'SINGLE' | 'DOUBLE' | 'SUITE'> = ['SUITE', 'DOUBLE', 'DOUBLE', 'SINGLE', 'SINGLE'];
  const rooms = [];
  for (let i = 0; i < 5; i++) {
    const roomNumber = String(801 + i);
    let room = await prisma.hotelRoom.findUnique({
      where: { hotelId_roomNumber: { hotelId: hotel.id, roomNumber } },
    });
    if (!room) {
      room = await prisma.hotelRoom.create({
        data: { hotelId: hotel.id, roomNumber, roomType: roomTypes[i]! },
      });
    }
    rooms.push(room);
  }
  console.log('Rooms:', rooms.length);

  // 5. Create dining tables
  const tableNames = ['主桌', '1 号桌', '2 号桌', '3 号桌'];
  const tables = [];
  for (const name of tableNames) {
    let table = await prisma.diningTable.findFirst({
      where: { meetingId: meeting.id, name },
    });
    if (!table) {
      table = await prisma.diningTable.create({
        data: { meetingId: meeting.id, name, capacity: name === '主桌' ? 10 : 8, type: 'ROUND' },
      });
    }
    tables.push(table);
  }
  console.log('Dining tables:', tables.length);

  // 6. Create gifts
  const giftData = [
    { name: '纪念茶具', stock: 50, unitPrice: 128 },
    { name: '会议手册礼包', stock: 100, unitPrice: 35 },
  ];
  const gifts = [];
  for (const gd of giftData) {
    let gift = await prisma.gift.findFirst({ where: { name: gd.name } });
    if (!gift) {
      gift = await prisma.gift.create({ data: gd });
    }
    gifts.push(gift);
  }
  console.log('Gifts:', gifts.length);

  // 7. Create companions
  const companionData = [
    { name: '王翻译', phone: '13700000001', languages: ['英语', '日语'], role: '翻译' },
    { name: '李接待', phone: '13700000002', languages: ['英语'], role: '接待陪同' },
  ];
  const companions = [];
  for (const cd of companionData) {
    let comp = await prisma.companion.findFirst({ where: { name: cd.name } });
    if (!comp) {
      comp = await prisma.companion.create({ data: cd });
    }
    companions.push(comp);
  }
  console.log('Companions:', companions.length);

  // 8. Create transport orders (if not enough)
  const existingTransport = await prisma.transportOrder.count({
    where: { meetingId: meeting.id },
  });
  for (let i = existingTransport; i < meetingGuests.length; i++) {
    await prisma.transportOrder.create({
      data: {
        meetingId: meeting.id,
        meetingGuestId: meetingGuests[i]!.id,
        pickupType: i % 2 === 0 ? 'AIRPORT' : 'TRAINSTATION',
        pickupLocation: i % 2 === 0 ? '首都机场 T3' : '北京南站',
        pickupTime: new Date('2026-09-01T08:00:00'),
        dropoffLocation: '国际大酒店',
        flightNo: i % 2 === 0 ? 'CA1234' : 'G101',
      },
    });
  }
  const transportCount = await prisma.transportOrder.count({ where: { meetingId: meeting.id } });
  console.log('Transport orders:', transportCount);

  // 9. Create lodging orders
  for (let i = 0; i < meetingGuests.length; i++) {
    const existing = await prisma.lodgingOrder.count({
      where: { meetingId: meeting.id, meetingGuestId: meetingGuests[i]!.id },
    });
    if (existing > 0) continue;
    await prisma.lodgingOrder.create({
      data: {
        meetingId: meeting.id,
        meetingGuestId: meetingGuests[i]!.id,
        hotelRoomId: rooms[i % rooms.length]!.id,
        checkInAt: new Date('2026-09-01T14:00:00'),
        checkOutAt: new Date('2026-09-03T12:00:00'),
        status: 'RESERVED',
        specialRequests: i === 0 ? '无烟楼层' : undefined,
      },
    });
  }
  const lodgingCount = await prisma.lodgingOrder.count({ where: { meetingId: meeting.id } });
  console.log('Lodging orders:', lodgingCount);

  // 10. Create catering orders (welcome banquet)
  for (let i = 0; i < meetingGuests.length; i++) {
    const existing = await prisma.cateringOrder.count({
      where: { meetingId: meeting.id, meetingGuestId: meetingGuests[i]!.id },
    });
    if (existing > 0) continue;
    await prisma.cateringOrder.create({
      data: {
        meetingId: meeting.id,
        meetingGuestId: meetingGuests[i]!.id,
        diningTableId: i < 2 ? tables[0]!.id : tables[(i % 3) + 1]!.id,
        mealType: 'WELCOME_BANQUET',
        mealTime: new Date('2026-09-01T18:30:00'),
        specialDietary: guests[i]!.dietaryTags ?? [],
        status: 'SCHEDULED',
      },
    });
  }
  const cateringCount = await prisma.cateringOrder.count({ where: { meetingId: meeting.id } });
  console.log('Catering orders:', cateringCount);

  // 11. Create gift orders
  for (let i = 0; i < meetingGuests.length; i++) {
    const existing = await prisma.giftOrder.count({
      where: { meetingId: meeting.id, meetingGuestId: meetingGuests[i]!.id },
    });
    if (existing > 0) continue;
    await prisma.giftOrder.create({
      data: {
        meetingId: meeting.id,
        meetingGuestId: meetingGuests[i]!.id,
        giftId: gifts[i % gifts.length]!.id,
        quantity: 1,
        status: i < 2 ? 'DELIVERED' : 'PENDING',
        deliveredAt: i < 2 ? new Date() : undefined,
      },
    });
  }
  const giftOrderCount = await prisma.giftOrder.count({ where: { meetingId: meeting.id } });
  console.log('Gift orders:', giftOrderCount);

  // 12. Create companion assignments
  for (let i = 0; i < Math.min(2, meetingGuests.length); i++) {
    const existing = await prisma.companionAssignment.count({
      where: { meetingId: meeting.id, meetingGuestId: meetingGuests[i]!.id },
    });
    if (existing > 0) continue;
    await prisma.companionAssignment.create({
      data: {
        meetingId: meeting.id,
        meetingGuestId: meetingGuests[i]!.id,
        companionId: companions[i % companions.length]!.id,
        assignmentScope: '全程陪同',
      },
    });
  }
  const companionCount = await prisma.companionAssignment.count({
    where: { meetingId: meeting.id },
  });
  console.log('Companion assignments:', companionCount);

  // 13. Create fee records
  const feeCategories: Array<'TRANSPORT' | 'LODGING' | 'MEAL' | 'GIFT' | 'OTHER'> = [
    'TRANSPORT', 'LODGING', 'MEAL', 'GIFT',
  ];
  for (let i = 0; i < meetingGuests.length; i++) {
    for (const cat of feeCategories) {
      const existing = await prisma.feeRecord.count({
        where: { meetingId: meeting.id, meetingGuestId: meetingGuests[i]!.id, category: cat },
      });
      if (existing > 0) continue;
      const amounts: Record<string, number> = {
        TRANSPORT: 200, LODGING: 800, MEAL: 300, GIFT: 128, OTHER: 0,
      };
      await prisma.feeRecord.create({
        data: {
          meetingId: meeting.id,
          meetingGuestId: meetingGuests[i]!.id,
          category: cat,
          amount: amounts[cat] ?? 0,
          notes: cat + ' fee for ' + guests[i]!.name,
          createdBy: 'seed',
        },
      });
    }
  }
  const feeCount = await prisma.feeRecord.count({ where: { meetingId: meeting.id } });
  console.log('Fee records:', feeCount);

  // 14. Create agenda items
  const agendaData = [
    { title: '开幕式', type: 'KEYNOTE', start: '09:00', end: '10:30', venue: '主会场' },
    { title: '茶歇', type: 'BREAK', start: '10:30', end: '11:00', venue: '序厅' },
    { title: '行业圆桌', type: 'PANEL', start: '11:00', end: '12:30', venue: '主会场' },
    { title: '欢迎午宴', type: 'MEAL', start: '12:30', end: '14:00', venue: '宴会厅' },
    { title: '参观展厅', type: 'TOUR', start: '14:00', end: '17:00', venue: '展览中心' },
  ];
  for (const a of agendaData) {
    const existing = await prisma.agendaItem.findFirst({
      where: { meetingId: meeting.id, title: a.title },
    });
    if (existing) continue;
    await prisma.agendaItem.create({
      data: {
        meetingId: meeting.id,
        title: a.title,
        type: a.type as 'KEYNOTE' | 'BREAK' | 'PANEL' | 'MEAL' | 'TOUR',
        startAt: new Date('2026-09-01T' + a.start + ':00'),
        endAt: new Date('2026-09-01T' + a.end + ':00'),
        venue: a.venue,
        speakerIds: a.type === 'KEYNOTE' || a.type === 'PANEL' ? [meetingGuests[0]!.id] : [],
      },
    });
  }
  const agendaCount = await prisma.agendaItem.count({ where: { meetingId: meeting.id } });
  console.log('Agenda items:', agendaCount);

  console.log('\n========================================');
  console.log('  Demo data created for meeting:', meeting.name);
  console.log('  Code:', meeting.code);
  console.log('========================================');
  console.log('  Guests in meeting:', meetingGuests.length);
  console.log('  Agenda items:', agendaCount);
  console.log('  Transport orders:', transportCount);
  console.log('  Lodging orders:', lodgingCount);
  console.log('  Catering orders:', cateringCount);
  console.log('  Gift orders:', giftOrderCount);
  console.log('  Companion assignments:', companionCount);
  console.log('  Fee records:', feeCount);
  console.log('  Hotel rooms:', rooms.length);
  console.log('  Dining tables:', tables.length);
  console.log('========================================\n');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
