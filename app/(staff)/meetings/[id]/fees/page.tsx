import { meetingService } from '@/lib/domain/meeting/service';
import { feeService } from '@/lib/domain/fee/service';
import { meetingGuestService } from '@/lib/domain/meeting-guest/service';
import { notFound } from 'next/navigation';
import { FeeList } from './FeeList';
import { NewFeeForm } from './NewFeeForm';

interface PageProps {
  params: Promise<{ id: string }>;
}

const CATEGORY_LABEL: Record<string, string> = {
  TRANSPORT: '交通',
  LODGING: '住宿',
  MEAL: '餐饮',
  GIFT: '礼品',
  OTHER: '其他',
};

export default async function FeesPage({ params }: PageProps) {
  const { id } = await params;

  let meeting;
  try {
    meeting = await meetingService.findById(id);
  } catch {
    notFound();
  }

  const [records, summary, meetingGuests] = await Promise.all([
    feeService.listByMeeting(id),
    feeService.summary(id),
    meetingGuestService.listByMeeting({ meetingId: id, pageSize: 500 }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">费用管理 · {meeting.name}</h1>
        <p className="text-sm text-slate-500">
          共 {summary.count} 条记录 · 总计{' '}
          {summary.total.toLocaleString('zh-CN', {
            style: 'currency',
            currency: 'CNY',
          })}
        </p>
      </div>

      {/* Summary by category */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
        {Object.entries(summary.byCategory).map(([cat, amount]) => (
          <div key={cat} className="bg-white rounded-md border p-3">
            <p className="text-xs text-slate-500">{CATEGORY_LABEL[cat] ?? cat}</p>
            <p className="text-lg font-bold">
              {Number(amount).toLocaleString('zh-CN', {
                style: 'currency',
                currency: 'CNY',
              })}
            </p>
          </div>
        ))}
      </div>

      <NewFeeForm
        meetingId={id}
        guests={meetingGuests.map((mg) => ({
          id: mg.id,
          name: mg.guest.name,
        }))}
      />

      <FeeList meetingId={id} records={records} />
    </div>
  );
}
