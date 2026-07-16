import { meetingService } from '@/lib/domain/meeting/service';
import { giftService } from '@/lib/domain/gift/service';
import { meetingGuestService } from '@/lib/domain/meeting-guest/service';
import { notFound } from 'next/navigation';
import { GiftList } from './GiftList';
import { NewOrderForm } from './NewOrderForm';
import { MeetingTabs } from '@/components/layout/MeetingTabs';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function GiftsPage({ params }: PageProps) {
  const { id } = await params;

  let meeting;
  try {
    meeting = await meetingService.findById(id);
  } catch {
    notFound();
  }

  const [orders, gifts, meetingGuests] = await Promise.all([
    giftService.listOrdersByMeeting(id),
    giftService.listGifts(),
    meetingGuestService.listByMeeting({ meetingId: id, pageSize: 500 }),
  ]);

  // Convert Decimal fields to plain numbers for client components
  const plainOrders = orders.map((o) => ({
    ...o,
    gift: {
      ...o.gift,
      unitPrice: o.gift.unitPrice ? Number(o.gift.unitPrice) : null,
    },
  }));

  return (
    <div className="space-y-6">
      <MeetingTabs meetingId={id} meetingName={meeting.name} />
      <div>
        <h1 className="text-xl font-bold">礼品管理 · {meeting.name}</h1>
        <p className="text-sm text-stone-400">共 {orders.length} 个礼品订单</p>
      </div>

      <NewOrderForm
        meetingId={id}
        guests={meetingGuests.map((mg) => ({
          id: mg.id,
          name: mg.guest.name,
        }))}
        gifts={gifts.map((g) => ({
          id: g.id,
          name: g.name,
          stock: g.stock,
        }))}
      />

      <GiftList meetingId={id} orders={plainOrders} />
    </div>
  );
}
