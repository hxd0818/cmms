import { meetingService } from '@/lib/domain/meeting/service';
import { MeetingForm } from '@/components/meetings/MeetingForm';
import { notFound } from 'next/navigation';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditMeetingPage({ params }: PageProps) {
  const { id } = await params;
  let meeting;
  try {
    meeting = await meetingService.findById(id);
  } catch {
    notFound();
  }

  // datetime-local input expects 'YYYY-MM-DDTHH:mm' format (local time)
  const toLocalInput = (d: Date) => {
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">编辑会议</h1>
      <MeetingForm
        mode="edit"
        meetingId={meeting.id}
        defaultValues={{
          name: meeting.name,
          code: meeting.code,
          startAt: toLocalInput(meeting.startAt),
          endAt: toLocalInput(meeting.endAt),
          venue: meeting.venue ?? undefined,
          description: meeting.description ?? undefined,
        }}
      />
    </div>
  );
}
