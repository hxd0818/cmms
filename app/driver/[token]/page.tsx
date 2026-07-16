import { verifyDriverToken } from '@/lib/auth/tokens';
import { transportService } from '@/lib/domain/transport/service';
import { meetingGuestService } from '@/lib/domain/meeting-guest/service';
import { notFound } from 'next/navigation';
import { DriverActions } from './DriverActions';

interface PageProps {
  params: Promise<{ token: string }>;
}

export default async function DriverPage({ params }: PageProps) {
  const { token } = await params;
  const verified = await verifyDriverToken(token);
  if (!verified) notFound();

  const order = await transportService.findById(verified.transportOrderId);

  // Get all transport orders for the same vehicle + meeting on the same day
  // For simplicity: just show this one order (Phase 4 can expand to daily list)
  const meetingGuest = await meetingGuestService.findById(order.meetingGuestId);

  return (
    <main className="min-h-screen bg-stone-50 p-4">
      <div className="max-w-md mx-auto space-y-4">
        <div className="cmms-card p-5">
          <h1 className="text-lg font-bold mb-2">司机任务</h1>
          <p className="text-xs text-slate-500 mb-4">
            车牌: {order.vehicleId ? '已分配' : '待分配'}
          </p>

          <div className="space-y-3">
            <div>
              <p className="text-xs text-slate-500">嘉宾</p>
              <p className="font-medium">{meetingGuest.guest.name}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">接送时间</p>
              <p className="font-medium">{new Date(order.pickupTime).toLocaleString('zh-CN')}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">上车地点</p>
              <p className="font-medium">{order.pickupLocation}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">下车地点</p>
              <p className="font-medium">{order.dropoffLocation}</p>
            </div>
            {order.flightNo && (
              <div>
                <p className="text-xs text-slate-500">航班/车次</p>
                <p className="font-medium font-mono">{order.flightNo}</p>
              </div>
            )}
            <div>
              <p className="text-xs text-slate-500">当前状态</p>
              <p className="font-medium text-blue-600">{order.status}</p>
            </div>
          </div>
        </div>

        <DriverActions orderId={order.id} status={order.status} token={token} />
      </div>
    </main>
  );
}
