import { meetingService } from '@/lib/domain/meeting/service';
import { companionService } from '@/lib/domain/companion/service';
import { prisma } from '@/lib/db/client';
import { notFound } from 'next/navigation';
import { MeetingTabs } from '@/components/layout/MeetingTabs';
import { StaffManager } from './StaffManager';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function MeetingStaffPage({ params }: PageProps) {
  const { id } = await params;

  let meeting;
  try {
    meeting = await meetingService.findById(id);
  } catch {
    notFound();
  }

  const [staff, users, managers, companions, assignments] = await Promise.all([
    prisma.meetingStaff.findMany({
      where: { meetingId: id },
      include: { user: { select: { id: true, name: true, email: true, role: true } } },
      orderBy: [{ createdAt: 'asc' }],
    }),
    prisma.user.findMany({
      select: { id: true, name: true, email: true, role: true },
      orderBy: { createdAt: 'asc' },
    }),
    prisma.guestManagerToken.findMany({
      where: { meetingId: id },
      orderBy: { issuedAt: 'desc' },
    }),
    companionService.list(),
    companionService.listAssignmentsByMeeting(id),
  ]);

  const assignmentCount = new Map<string, number>();
  for (const a of assignments) {
    assignmentCount.set(a.companionId, (assignmentCount.get(a.companionId) ?? 0) + 1);
  }
  const assignedCompanionIds = new Set(assignments.map((a) => a.companionId));

  return (
    <div className="space-y-6">
      <MeetingTabs meetingId={id} meetingName={meeting.name} />

      <div>
        <h1 className="text-xl font-bold">人员管理</h1>
        <p className="text-sm text-stone-400 mt-0.5">
          系统用户 {staff.length} · 嘉宾维护 {managers.filter((m) => !m.revokedAt).length} ·
          接待人员 {companions.length}
        </p>
      </div>

      <StaffManager
        meetingId={id}
        staff={staff.map((s) => ({
          id: s.id,
          role: s.role,
          createdAt: s.createdAt.toISOString(),
          user: s.user,
        }))}
        users={users.map((u) => ({ id: u.id, name: u.name, email: u.email, role: u.role }))}
        managers={managers.map((m) => ({
          id: m.id,
          name: m.name,
          phone: m.phone,
          scope: m.scope,
          revokedAt: m.revokedAt?.toISOString() ?? null,
          accessCount: m.accessCount,
        }))}
        companions={companions.map((c) => ({
          id: c.id,
          name: c.name,
          role: c.role,
          phone: c.phone,
          languages: c.languages,
          assigned: assignedCompanionIds.has(c.id),
          count: assignmentCount.get(c.id) ?? 0,
        }))}
      />
    </div>
  );
}
