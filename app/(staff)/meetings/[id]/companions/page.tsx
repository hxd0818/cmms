import { meetingService } from '@/lib/domain/meeting/service';
import { companionService } from '@/lib/domain/companion/service';
import { meetingGuestService } from '@/lib/domain/meeting-guest/service';
import { notFound } from 'next/navigation';
import { CompanionList } from './CompanionList';
import { CompanionRoster } from './CompanionRoster';
import { CompanionBoard } from './CompanionBoard';
import { AssignForm } from './AssignForm';
import { MeetingTabs } from '@/components/layout/MeetingTabs';
import { ViewToggle } from '@/components/shared/ViewToggle';

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ view?: string }>;
}

export default async function CompanionsPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const { view } = await searchParams;
  const boardMode = view === 'board';

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

  const assignedCompanionIds = new Set(assignments.map((a) => a.companionId));
  const assignmentCount = new Map<string, number>();
  for (const a of assignments) {
    assignmentCount.set(a.companionId, (assignmentCount.get(a.companionId) ?? 0) + 1);
  }

  // Guests who already have a companion
  const guestsWithCompanion = new Set(assignments.map((a) => a.meetingGuestId));
  const unassignedGuestCount = meetingGuests.filter((mg) => !guestsWithCompanion.has(mg.id)).length;

  return (
    <div className="space-y-6">
      <MeetingTabs meetingId={id} meetingName={meeting.name} />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">接待管理</h1>
          <p className="text-sm text-stone-400">
            接待人员 {companions.length} 名 · 待分配嘉宾 {unassignedGuestCount} 位 · 已分配 {assignments.length} 个
          </p>
        </div>
        <ViewToggle basePath={`/meetings/${id}/companions`} boardMode={boardMode} />
      </div>

      {boardMode ? (
        <CompanionBoard
          meetingId={id}
          guests={meetingGuests.map((mg) => ({
            id: mg.id,
            name: mg.guest.name,
            level: mg.levelOverride ?? mg.guest.level,
            company: mg.guest.company,
            hasCompanion: guestsWithCompanion.has(mg.id),
          }))}
          companions={companions.map((c) => ({
            id: c.id,
            name: c.name,
            role: c.role,
            languages: c.languages,
            phone: c.phone,
            assignmentCount: assignmentCount.get(c.id) ?? 0,
          }))}
        />
      ) : (
        <>
          <CompanionRoster
            companions={companions.map((c) => ({
              id: c.id,
              name: c.name,
              role: c.role,
              languages: c.languages,
              phone: c.phone,
              count: assignmentCount.get(c.id) ?? 0,
              assigned: assignedCompanionIds.has(c.id),
            }))}
          />

          <AssignForm
            meetingId={id}
            guests={meetingGuests.map((mg) => ({ id: mg.id, name: mg.guest.name }))}
            companions={companions.map((c) => ({ id: c.id, name: c.name, role: c.role }))}
          />

          <CompanionList meetingId={id} assignments={assignments} />
        </>
      )}
    </div>
  );
}
