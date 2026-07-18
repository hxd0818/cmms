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

  const [staff, users] = await Promise.all([
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

  return (
    <div className="space-y-6">
      <MeetingTabs meetingId={id} meetingName={meeting.name} />

      <div>
        <h1 className="text-xl font-bold">人员管理</h1>
        <p className="text-sm text-stone-400 mt-0.5">分配会议角色 · 共 {staff.length} 名工作人员</p>
      </div>

      <StaffManager meetingId={id} staff={plainStaff} users={plainUsers} />
    </div>
  );
}
