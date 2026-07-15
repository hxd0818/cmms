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
};
