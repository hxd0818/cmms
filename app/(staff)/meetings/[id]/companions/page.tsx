import { meetingService } from '@/lib/domain/meeting/service';
import { companionService } from '@/lib/domain/companion/service';
import { meetingGuestService } from '@/lib/domain/meeting-guest/service';
import { notFound } from 'next/navigation';
import { CompanionList } from './CompanionList';
import { AssignForm } from './AssignForm';
import { MeetingTabs } from '@/components/layout/MeetingTabs';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function CompanionsPage({ params }: PageProps) {
  const { id } = await params;

  let meeting;
  try {
    meeting = await meetingService.findById(id);
  } catch {
    notFound();
  }

  const [assignments, companions, meetingGuests] = await Promise.all([
    companionService.listAssignmentsByMeeting(id),
    companionService.list(),
    meetingGuestService.listByMeeting({ meetingId: id, pageSize: 500 }),
  ]);

  return (
    <div className="space-y-6">
      <MeetingTabs meetingId={id} meetingName={meeting.name} />
      <div>
        <h1 className="text-xl font-bold">陪同管理</h1>
        <p className="text-sm text-slate-500">共 {assignments.length} 个陪同分配</p>
      </div>

      <AssignForm
        meetingId={id}
        guests={meetingGuests.map((mg) => ({
          id: mg.id,
          name: mg.guest.name,
        }))}
        companions={companions.map((c) => ({
          id: c.id,
          name: c.name,
          role: c.role,
        }))}
      />

      <CompanionList meetingId={id} assignments={assignments} />
    </div>
  );
}
