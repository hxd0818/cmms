import { verifyDriverToken } from '@/lib/auth/tokens';
import { transportService } from '@/lib/domain/transport/service';
import { prisma } from '@/lib/db/client';
import { notFound } from 'next/navigation';
import { DriverActions } from './DriverActions';

interface PageProps {
  params: Promise<{ token: string }>;
}

export default async function DriverPage({ params }: PageProps) {
  const { token } = await params;
  const verified = await verifyDriverToken(token);
  if (!verified) notFound();

  const currentOrder = await transportService.findById(verified.transportOrderId);

  // Resolve vehicle; if assigned, pull all transport orders for the same vehicle on the same day
  const dayOrders: Array<{
    id: string;
    pickupTime: Date;
    pickupLocation: string;
    dropoffLocation: string;
    flightNo: string | null;
    status: string;
    meetingGuest: { guest: { name: string } };
  }> = [];

  let vehicleLabel = '待分配';
  if (currentOrder.vehicleId) {
    const vehicle = await prisma.vehicle.findUnique({
      where: { id: currentOrder.vehicleId },
    });
    if (vehicle) {
      vehicleLabel = `${vehicle.plateNo} · ${vehicle.driverName} ${vehicle.driverPhone}`;
    }
    const siblings = await transportService.listByVehicleOnSameDay(
      currentOrder.vehicleId,
      currentOrder.pickupTime,
    );
    for (const o of siblings) {
      dayOrders.push({
        id: o.id,
        pickupTime: o.pickupTime,
        pickupLocation: o.pickupLocation,
        dropoffLocation: o.dropoffLocation,
        flightNo: o.flightNo,
        status: o.status,
        meetingGuest: { guest: { name: o.meetingGuest.guest.name } },
      });
    }
  } else {
    // No vehicle assigned yet — only show the current order
    const mg = await prisma.meetingGuest.findUnique({
      where: { id: currentOrder.meetingGuestId },
      include: { guest: true },
    });
    dayOrders.push({
      id: currentOrder.id,
      pickupTime: currentOrder.pickupTime,
      pickupLocation: currentOrder.pickupLocation,
      dropoffLocation: currentOrder.dropoffLocation,
      flightNo: currentOrder.flightNo,
      status: currentOrder.status,
      meetingGuest: { guest: { name: mg?.guest.name ?? '-' } },
    });
  }

  return (
    <main className="min-h-screen bg-stone-50 p-4">
      <div className="max-w-md mx-auto space-y-4">
        <div className="cmms-card p-5">
          <h1 className="text-lg font-bold mb-2">司机任务</h1>
          <p className="text-xs text-slate-500 mb-1">车辆: {vehicleLabel}</p>
          <p className="text-xs text-slate-400">
            当日任务: {dayOrders.length} 个 · 当前任务高亮显示
          </p>
        </div>

        {dayOrders.map((o) => {
          const isCurrent = o.id === currentOrder.id;
          return (
            <div
              key={o.id}
              className={'cmms-card p-4 ' + (isCurrent ? 'ring-2 ring-blue-400 bg-blue-50/40' : '')}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-700">
                  {isCurrent ? '当前任务' : '同车任务'}
                </span>
                <span className="text-xs text-slate-500">{o.status}</span>
              </div>

              <div className="space-y-2">
                <div>
                  <p className="text-xs text-slate-500">嘉宾</p>
                  <p className="font-medium">{o.meetingGuest.guest.name}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">接送时间</p>
                  <p className="font-medium">{new Date(o.pickupTime).toLocaleString('zh-CN')}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">上车地点</p>
                  <p className="font-medium">{o.pickupLocation}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">下车地点</p>
                  <p className="font-medium">{o.dropoffLocation}</p>
                </div>
                {o.flightNo && (
                  <div>
                    <p className="text-xs text-slate-500">航班/车次</p>
                    <p className="font-medium font-mono">{o.flightNo}</p>
                  </div>
                )}
              </div>

              {isCurrent && (
                <div className="mt-3">
                  <DriverActions orderId={o.id} status={o.status} token={token} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </main>
  );
}
