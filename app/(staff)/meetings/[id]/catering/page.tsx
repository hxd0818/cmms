import { meetingService } from '@/lib/domain/meeting/service';
import { cateringService } from '@/lib/domain/catering/service';
import { meetingGuestService } from '@/lib/domain/meeting-guest/service';
import { prisma } from '@/lib/db/client';
import { notFound } from 'next/navigation';
import { CateringList } from './CateringList';
import { NewOrderForm } from './NewOrderForm';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function CateringPage({ params }: PageProps) {
  const { id } = await params;

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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">餐饮管理 · {meeting.name}</h1>
        <p className="text-sm text-slate-500">共 {orders.length} 个餐饮订单</p>
      </div>

      <NewOrderForm
        meetingId={id}
        guests={meetingGuests.map((mg) => ({
          id: mg.id,
          name: mg.guest.name,
        }))}
      />

      <CateringList meetingId={id} orders={orders} tables={diningTables} />
    </div>
  );
}
