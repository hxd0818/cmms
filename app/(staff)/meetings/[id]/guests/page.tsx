import { meetingGuestService } from '@/lib/domain/meeting-guest/service';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { GuestManager } from './GuestManager';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function MeetingGuestsPage({ params }: PageProps) {
  const { id } = await params;

  let meetingGuests;
  try {
    meetingGuests = await meetingGuestService.listByMeeting({
      meetingId: id,
      pageSize: 500,
    });
  } catch {
    notFound();
  }

  const primary = meetingGuests.filter((mg) => !mg.primaryMeetingGuestId);
  const subordinate = meetingGuests.filter((mg) => mg.primaryMeetingGuestId);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">嘉宾管理</h1>
          <p className="text-sm text-slate-500">
            主嘉宾 {primary.length} 位，随行 {subordinate.length} 位
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href={`/meetings/${id}/guests/import`}
            className={cn(buttonVariants({ variant: 'outline' }))}
          >
            批量导入
          </Link>
        </div>
      </div>
      <GuestManager meetingId={id} meetingGuests={meetingGuests} />
    </div>
  );
}
