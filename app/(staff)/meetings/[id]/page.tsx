import { meetingService } from '@/lib/domain/meeting/service';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { buttonVariants } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { MeetingStatusButton } from './MeetingStatusButton';

interface PageProps {
  params: Promise<{ id: string }>;
}

const STATUS_LABEL: Record<string, string> = {
  DRAFT: '草稿',
  PLANNING: '筹备中',
  ONGOING: '进行中',
  COMPLETED: '已结束',
  CANCELED: '已取消',
};

export default async function MeetingDetailPage({ params }: PageProps) {
  const { id } = await params;
  let meeting;
  try {
    meeting = await meetingService.findById(id);
  } catch {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{meeting.name}</h1>
            <Badge variant="secondary">{STATUS_LABEL[meeting.status]}</Badge>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            编号 <span className="font-mono">{meeting.code}</span>
            {meeting.venue ? ` · ${meeting.venue}` : ''}
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href={`/meetings/${meeting.id}/edit`}
            className={cn(buttonVariants({ variant: 'outline' }))}
          >
            编辑
          </Link>
          <Link
            href={`/meetings/${meeting.id}/guests`}
            className={cn(buttonVariants({ variant: 'outline' }))}
          >
            嘉宾管理
          </Link>
          <MeetingStatusButton meetingId={meeting.id} currentStatus={meeting.status} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 bg-white rounded-md border p-6">
        <Field label="开始时间">{new Date(meeting.startAt).toLocaleString('zh-CN')}</Field>
        <Field label="结束时间">{new Date(meeting.endAt).toLocaleString('zh-CN')}</Field>
        <Field label="场地">{meeting.venue ?? '-'}</Field>
        <Field label="创建时间">
          {new Date(meeting.createdAt).toLocaleString('zh-CN')}
        </Field>
        <Field label="会议说明" full>
          {meeting.description ?? '-'}
        </Field>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
  full,
}: {
  label: string;
  children: React.ReactNode;
  full?: boolean;
}) {
  return (
    <div className={full ? 'col-span-2' : ''}>
      <p className="text-xs text-slate-500 mb-1">{label}</p>
      <div className="text-sm">{children}</div>
    </div>
  );
}
