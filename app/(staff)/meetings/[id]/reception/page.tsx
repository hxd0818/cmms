import { meetingService } from '@/lib/domain/meeting/service';
import { meetingGuestService } from '@/lib/domain/meeting-guest/service';
import { receptionService } from '@/lib/domain/reception/service';
import { notFound } from 'next/navigation';
import { CheckInSearch } from './CheckInSearch';
import { Kanban } from './Kanban';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ReceptionPage({ params }: PageProps) {
  const { id } = await params;

  let meeting;
  try {
    meeting = await meetingService.findById(id);
  } catch {
    notFound();
  }

  const kanbanData = await receptionService.getKanbanData(id);

  // For the CheckInSearch component: list all meeting guests with guest info
  const allGuests = await meetingGuestService.listByMeeting({
    meetingId: id,
    pageSize: 500,
  });

  const searchable = allGuests
    .filter((mg) => mg.receptionStage === 'NOT_ARRIVED')
    .map((mg) => ({
      id: mg.id,
      name: mg.guest.name,
      company: mg.guest.company,
      level: mg.levelOverride ?? mg.guest.level,
    }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">现场签到 · {meeting.name}</h1>
        <p className="text-sm text-slate-500">
          待签到 {kanbanData.notArrived.length} · 已签到 {kanbanData.checkedIn.length} · 在场{' '}
          {kanbanData.inHouse.length} · 已离场 {kanbanData.departed.length}
        </p>
      </div>

      <CheckInSearch pending={searchable} />

      <Kanban meetingId={id} initial={kanbanData} />
    </div>
  );
}
