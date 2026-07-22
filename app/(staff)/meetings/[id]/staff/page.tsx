import { meetingService } from '@/lib/domain/meeting/service';
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

  const [staff, users, managers] = await Promise.all([
    prisma.meetingStaff.findMany({
      where: { meetingId: id },
      include: {
        user: {
          select: { id: true, name: true, email: true, role: true },
        },
      },
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
  ]);

  const plainStaff = staff.map((s) => ({
    id: s.id,
    role: s.role,
    createdAt: s.createdAt.toISOString(),
    user: s.user,
  }));

  const plainUsers = users.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
  }));

  const plainManagers = managers.map((m) => ({
    id: m.id,
    name: m.name,
    phone: m.phone,
    scope: m.scope,
    issuedAt: m.issuedAt.toISOString(),
    expiresAt: m.expiresAt.toISOString(),
    revokedAt: m.revokedAt?.toISOString() ?? null,
    accessCount: m.accessCount,
    lastAccessedAt: m.lastAccessedAt?.toISOString() ?? null,
  }));

  return (
    <div className="space-y-6">
      <MeetingTabs meetingId={id} meetingName={meeting.name} />

      <div>
        <h1 className="text-xl font-bold">人员管理</h1>
        <p className="text-sm text-stone-400 mt-0.5">
          工作人员 {staff.length} 名 · 嘉宾维护 {plainManagers.filter((m) => !m.revokedAt).length} 名
        </p>
      </div>

      <StaffManager meetingId={id} staff={plainStaff} users={plainUsers} managers={plainManagers} />
    </div>
  );
}
