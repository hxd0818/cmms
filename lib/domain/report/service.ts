import { prisma } from '@/lib/db/client';

export const reportService = {
  async getMeetingSummary(meetingId: string) {
    const [meeting, meetingGuests, transportOrders, lodgingOrders, feeRecords] = await Promise.all([
      prisma.meeting.findUnique({ where: { id: meetingId } }),
      prisma.meetingGuest.findMany({
        where: { meetingId },
        include: { guest: true },
      }),
      prisma.transportOrder.findMany({ where: { meetingId } }),
      prisma.lodgingOrder.findMany({ where: { meetingId } }),
      prisma.feeRecord.findMany({ where: { meetingId } }),
    ]);

    if (!meeting) return null;

    const guestStats = {
      total: meetingGuests.length,
      primary: meetingGuests.filter((mg) => !mg.primaryMeetingGuestId).length,
      entourage: meetingGuests.filter((mg) => mg.primaryMeetingGuestId).length,
      checkedIn: meetingGuests.filter((mg) =>
        ['CHECKED_IN', 'IN_HOUSE', 'DEPARTED'].includes(mg.receptionStage),
      ).length,
      noShow: meetingGuests.filter((mg) => mg.receptionStage === 'NO_SHOW').length,
    };

    const feeTotal = feeRecords.reduce((sum, f) => sum + Number(f.amount), 0);
    const feeByCategory: Record<string, number> = {};
    for (const f of feeRecords) {
      const cat = f.category as string;
      feeByCategory[cat] = (feeByCategory[cat] ?? 0) + Number(f.amount);
    }

    return {
      meeting,
      guestStats,
      resourceStats: {
        transport: {
          total: transportOrders.length,
          assigned: transportOrders.filter((t) => t.vehicleId).length,
          completed: transportOrders.filter((t) => t.status === 'COMPLETED').length,
        },
        lodging: {
          total: lodgingOrders.length,
          assigned: lodgingOrders.filter((l) => l.hotelRoomId).length,
          checkedIn: lodgingOrders.filter((l) => ['CHECKED_IN', 'CHECKED_OUT'].includes(l.status))
            .length,
        },
      },
      feeSummary: {
        total: feeTotal,
        byCategory: feeByCategory,
        count: feeRecords.length,
      },
    };
  },

  async getDashboardStats() {
    const now = new Date();
    const upcoming = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const [totalGuests, totalMeetings, upcomingMeetings, ongoingMeetings] = await Promise.all([
      prisma.guest.count({ where: { deletedAt: null } }),
      prisma.meeting.count(),
      prisma.meeting.findMany({
        where: {
          startAt: { gte: now, lte: upcoming },
          status: { in: ['DRAFT', 'PLANNING', 'ONGOING'] },
        },
        orderBy: { startAt: 'asc' },
        take: 5,
      }),
      prisma.meeting.count({ where: { status: 'ONGOING' } }),
    ]);

    return {
      totalGuests,
      totalMeetings,
      ongoingMeetings,
      upcoming: upcomingMeetings,
    };
  },

  async getGuestHistory(guestId: string) {
    const meetingGuests = await prisma.meetingGuest.findMany({
      where: { guestId },
      include: {
        meeting: true,
        guest: true,
      },
      orderBy: { meeting: { startAt: 'desc' } },
    });

    if (meetingGuests.length === 0) return null;

    const guest = meetingGuests[0]!.guest;
    const history = meetingGuests.map((mg) => ({
      meetingId: mg.meetingId,
      meetingName: mg.meeting.name,
      meetingStartAt: mg.meeting.startAt,
      receptionStage: mg.receptionStage,
      entourageRole: mg.entourageRole,
    }));

    return {
      guest,
      totalMeetings: meetingGuests.length,
      history,
    };
  },

  async getGuestFullProfile(guestId: string) {
    const guest = await prisma.guest.findUnique({ where: { id: guestId } });
    if (!guest) return null;

    const meetingGuests = await prisma.meetingGuest.findMany({
      where: { guestId },
      include: { meeting: true },
      orderBy: { meeting: { startAt: 'desc' } },
    });

    const mgIds = meetingGuests.map((mg) => mg.id);

    const [transport, lodging, catering, gifts, companions, fees] = await Promise.all([
      prisma.transportOrder.findMany({
        where: { meetingGuestId: { in: mgIds } },
        include: { vehicle: true },
      }),
      prisma.lodgingOrder.findMany({
        where: { meetingGuestId: { in: mgIds } },
        include: { hotelRoom: { include: { hotel: true } } },
      }),
      prisma.cateringOrder.findMany({
        where: { meetingGuestId: { in: mgIds } },
        include: { diningTable: true },
      }),
      prisma.giftOrder.findMany({
        where: { meetingGuestId: { in: mgIds } },
        include: { gift: true },
      }),
      prisma.companionAssignment.findMany({
        where: { meetingGuestId: { in: mgIds } },
        include: { companion: true },
      }),
      prisma.feeRecord.findMany({
        where: { meetingGuestId: { in: mgIds } },
      }),
    ]);

    // Group items by meetingGuestId without generic helper (avoids type narrowing)
    const groupBy = <A>(arr: A[], keyFn: (item: A) => string): Map<string, A[]> => {
      const map = new Map<string, A[]>();
      for (const item of arr) {
        const k = keyFn(item);
        const list = map.get(k) ?? [];
        list.push(item);
        map.set(k, list);
      }
      return map;
    };

    const transportMap = groupBy(transport, (x) => x.meetingGuestId);
    const lodgingMap = groupBy(lodging, (x) => x.meetingGuestId);
    const cateringMap = groupBy(catering, (x) => x.meetingGuestId);
    const giftMap = groupBy(gifts, (x) => x.meetingGuestId);
    const companionMap = groupBy(companions, (x) => x.meetingGuestId);
    const feeMap = groupBy(
      fees.filter((f) => f.meetingGuestId),
      (x) => x.meetingGuestId!,
    );

    const meetings = meetingGuests.map((mg) => {
      const mgFees = feeMap.get(mg.id) ?? [];
      const totalFee = mgFees.reduce((s, f) => s + Number(f.amount), 0);
      const tList = transportMap.get(mg.id) ?? [];
      const lList = lodgingMap.get(mg.id) ?? [];
      const cList = cateringMap.get(mg.id) ?? [];
      const gList = giftMap.get(mg.id) ?? [];
      const compList = companionMap.get(mg.id) ?? [];
      const pendingCount =
        tList.filter((t) => !['COMPLETED', 'CANCELED'].includes(t.status)).length +
        lList.filter((l) => !['CHECKED_OUT', 'CANCELED'].includes(l.status)).length +
        gList.filter((g) => g.status === 'PENDING').length;

      return {
        meetingGuestId: mg.id,
        meeting: mg.meeting,
        entourageRole: mg.entourageRole,
        receptionStage: mg.receptionStage,
        transport: tList,
        lodging: lList,
        catering: cList,
        gifts: gList,
        companions: compList,
        fees: mgFees,
        totalFee,
        pendingCount,
      };
    });

    const totalFeeAll = fees.reduce((s, f) => s + Number(f.amount), 0);
    const totalPending = meetings.reduce((s, m) => s + m.pendingCount, 0);

    return {
      guest,
      meetings,
      stats: {
        totalMeetings: meetingGuests.length,
        totalFee: totalFeeAll,
        totalPendingTasks: totalPending,
      },
    };
  },
};
