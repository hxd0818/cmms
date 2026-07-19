import { meetingService } from '@/lib/domain/meeting/service';
import { cateringService } from '@/lib/domain/catering/service';
import { meetingGuestService } from '@/lib/domain/meeting-guest/service';
import { prisma } from '@/lib/db/client';
import { notFound } from 'next/navigation';
import { CateringList } from './CateringList';
import { CateringBoard } from './CateringBoard';
import { NewOrderForm } from './NewOrderForm';
import { MeetingTabs } from '@/components/layout/MeetingTabs';
import { ViewToggle } from '@/components/shared/ViewToggle';

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ view?: string }>;
}

export default async function CateringPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const { view } = await searchParams;
  const boardMode = view === 'board';

  let meeting;
  try {
    meeting = await meetingService.findById(id);
  } catch {
    notFound();
  }

  const [orders, diningTables, meetingGuests] = await Promise.all([
    cateringService.listByMeeting(id),
    prisma.diningTable.findMany({ where: { meetingId: id }, orderBy: { name: 'asc' } }),
    meetingGuestService.listByMeeting({ meetingId: id, pageSize: 500 }),
  ]);

  // Filter unassigned orders for the board
  const unassignedOrders = orders.filter((o) => o.diningTableId === null);

  // Compute occupied count per table from all orders (across all meal times for simplicity)
  const occupiedByTable = new Map<string, number>();
  for (const o of orders) {
    if (o.diningTableId) {
      occupiedByTable.set(o.diningTableId, (occupiedByTable.get(o.diningTableId) ?? 0) + 1);
    }
  }

  return (
    <div className="space-y-6">
      <MeetingTabs meetingId={id} meetingName={meeting.name} />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">餐饮管理</h1>
          <p className="text-sm text-stone-400">
            共 {orders.length} 个餐饮订单 · 待分配 {unassignedOrders.length} · 餐桌{' '}
            {diningTables.length}
          </p>
        </div>
        <ViewToggle basePath={`/meetings/${id}/catering`} boardMode={boardMode} />
      </div>

      {boardMode ? (
        <>
          {unassignedOrders.length > 0 ? (
            <CateringBoard
              meetingId={id}
              orders={unassignedOrders.map((o) => ({
                id: o.id,
                guestName: o.meetingGuest.guest.name,
                mealType: o.mealType,
                mealTime: o.mealTime.toISOString(),
                dietaryTags: o.specialDietary,
              }))}
              tables={diningTables.map((t) => ({
                id: t.id,
                name: t.name,
                capacity: t.capacity,
                type: t.type,
                occupiedCount: occupiedByTable.get(t.id) ?? 0,
              }))}
            />
          ) : (
            <div className="cmms-card p-8 text-center">
              <p className="text-sm text-stone-400">全部订单已分配餐桌</p>
            </div>
          )}
        </>
      ) : (
        <>
          <NewOrderForm
            meetingId={id}
            guests={meetingGuests.map((mg) => ({
              id: mg.id,
              name: mg.guest.name,
            }))}
          />

          <CateringList meetingId={id} orders={orders} tables={diningTables} />
        </>
      )}
    </div>
  );
}
