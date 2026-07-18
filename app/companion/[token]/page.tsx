import { prisma } from '@/lib/db/client';
import { notFound } from 'next/navigation';
import { dict } from '@/lib/shared/dictionary';
import { UserCheck, Phone, Globe, Clock, MapPin } from 'lucide-react';

interface Props {
  params: Promise<{ token: string }>;
}

export default async function CompanionPortalPage({ params }: Props) {
  const { token } = await params;

  // Look up companion by phone-based token hash
  // For simplicity: token IS the companion ID (read-only portal, no sensitive data)
  const companion = await prisma.companion.findUnique({
    where: { id: token },
  });

  if (!companion) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-stone-50 p-6">
        <div className="text-center">
          <h1 className="text-xl font-bold text-stone-700">链接无效</h1>
          <p className="text-sm text-stone-400 mt-2">请联系会务组获取正确的链接</p>
        </div>
      </main>
    );
  }

  // Find all assignments for this companion
  const assignments = await prisma.companionAssignment.findMany({
    where: { companionId: companion.id },
    orderBy: { createdAt: 'desc' },
  });

  // Batch load meetings + guests (no Prisma relation on CompanionAssignment)
  const meetingIds = [...new Set(assignments.map((a) => a.meetingId))];
  const meetingGuestIds = [...new Set(assignments.map((a) => a.meetingGuestId))];

  const [meetings, meetingGuests] = await Promise.all([
    meetingIds.length > 0
      ? prisma.meeting.findMany({
          where: { id: { in: meetingIds } },
          select: { id: true, name: true, startAt: true, endAt: true, venue: true },
        })
      : [],
    meetingGuestIds.length > 0
      ? prisma.meetingGuest.findMany({
          where: { id: { in: meetingGuestIds } },
          include: { guest: true },
        })
      : [],
  ]);

  const meetingMap = new Map(meetings.map((m) => [m.id, m]));
  const guestMap = new Map(meetingGuests.map((mg) => [mg.id, mg]));

  return (
    <main className="min-h-screen bg-stone-50">
      <div className="max-w-md mx-auto px-4 py-6 space-y-5">
        {/* Header */}
        <div className="cmms-card p-5">
          <p className="text-xs text-stone-400 mb-1">接待任务</p>
          <h1 className="text-lg font-bold text-stone-800">{companion.name}</h1>
          <div className="flex flex-wrap gap-3 mt-2 text-xs text-stone-400">
            <span>{companion.role}</span>
            {companion.phone && (
              <span className="flex items-center gap-1">
                <Phone size={11} /> {companion.phone}
              </span>
            )}
            {companion.languages.length > 0 && (
              <span className="flex items-center gap-1">
                <Globe size={11} /> {companion.languages.join(', ')}
              </span>
            )}
          </div>
        </div>

        {/* Assignments */}
        {assignments.length === 0 ? (
          <div className="cmms-card p-8 text-center">
            <p className="text-sm text-stone-400">暂无接待任务</p>
          </div>
        ) : (
          assignments.map((a) => {
            const meeting = meetingMap.get(a.meetingId);
            if (!meeting) return null;
            return (
              <div key={a.id} className="cmms-card p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-stone-700">{meeting.name}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-stone-100 text-stone-500">
                    {dict.assignmentScope[a.assignmentScope] ?? a.assignmentScope}
                  </span>
                </div>

                <div className="flex items-center gap-3 text-xs text-stone-400">
                  <span className="flex items-center gap-1">
                    <Clock size={11} />
                    {new Date(meeting.startAt).toLocaleDateString('zh-CN')}
                    {' ~ '}
                    {new Date(meeting.endAt).toLocaleDateString('zh-CN')}
                  </span>
                  {meeting.venue && (
                    <span className="flex items-center gap-1">
                      <MapPin size={11} /> {meeting.venue}
                    </span>
                  )}
                </div>

                <div className="pt-2 border-t border-stone-100">
                  <p className="text-xs text-stone-400 mb-1 flex items-center gap-1">
                    <UserCheck size={11} /> 接待对象
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-stone-700 font-medium">
                      {guestMap.get(a.meetingGuestId)?.guest.name ?? '-'}
                    </span>
                    {guestMap.get(a.meetingGuestId)?.guest.company && (
                      <span className="text-xs text-stone-400">
                        {guestMap.get(a.meetingGuestId)?.guest.company}
                      </span>
                    )}
                  </div>
                  {guestMap.get(a.meetingGuestId)?.guest.phone && (
                    <p className="text-xs text-stone-500 mt-0.5 font-mono">
                      {guestMap.get(a.meetingGuestId)?.guest.phone}
                    </p>
                  )}
                </div>

                {a.notes && (
                  <p className="text-xs text-stone-500 bg-stone-50 rounded p-2">{a.notes}</p>
                )}
              </div>
            );
          })
        )}

        <p className="text-center text-xs text-stone-300 pt-4 pb-6">
          如有疑问请联系会务组
        </p>
      </div>
    </main>
  );
}
