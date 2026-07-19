import { meetingService } from '@/lib/domain/meeting/service';
import { companionService } from '@/lib/domain/companion/service';
import { meetingGuestService } from '@/lib/domain/meeting-guest/service';
import { notFound } from 'next/navigation';
import { CompanionList } from './CompanionList';
import { CompanionRoster } from './CompanionRoster';
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

  // Deduplicated roster of companions working this meeting
  const assignedCompanionIds = new Set(assignments.map((a) => a.companionId));
  const meetingCompanions = companions.filter((c) => assignedCompanionIds.has(c.id));
  const assignmentCount = new Map<string, number>();
  for (const a of assignments) {
    assignmentCount.set(a.companionId, (assignmentCount.get(a.companionId) ?? 0) + 1);
  }

  return (
    <div className="space-y-6">
      <MeetingTabs meetingId={id} meetingName={meeting.name} />
      <div>
        <h1 className="text-xl font-bold">接待管理</h1>
        <p className="text-sm text-stone-400">
          接待人员 {meetingCompanions.length} 名 · 分配 {assignments.length} 个
        </p>
      </div>

      {/* Companion roster */}
      {meetingCompanions.length > 0 && (
        <CompanionRoster
          companions={meetingCompanions.map((c) => ({
            id: c.id,
            name: c.name,
            role: c.role,
            languages: c.languages,
            phone: c.phone,
            count: assignmentCount.get(c.id) ?? 0,
          }))}
        />
      )}

      <AssignForm
        meetingId={id}
        guests={meetingGuests.map((mg) => ({ id: mg.id, name: mg.guest.name }))}
        companions={companions.map((c) => ({ id: c.id, name: c.name, role: c.role }))}
      />

      <CompanionList meetingId={id} assignments={assignments} />
    </div>
  );
}
