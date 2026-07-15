import { meetingService } from '@/lib/domain/meeting/service';
import { MeetingList } from './MeetingList';
import { buttonVariants } from '@/components/ui/button';
import Link from 'next/link';

interface PageProps {
  searchParams: Promise<{ search?: string; status?: string; page?: string }>;
}

export default async function MeetingsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const result = await meetingService.list({
    search: params.search,
    status: params.status as
      | 'DRAFT'
      | 'PLANNING'
      | 'ONGOING'
      | 'COMPLETED'
      | 'CANCELED'
      | undefined,
    page: params.page ? Number(params.page) : 1,
    pageSize: 20,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">会议管理</h1>
          <p className="text-sm text-slate-500">共 {result.total} 场会议</p>
        </div>
        <Link href="/meetings/new" className={buttonVariants()}>
          新建会议
        </Link>
      </div>
      <MeetingList
        items={result.items}
        page={result.page}
        pageSize={result.pageSize}
        total={result.total}
      />
    </div>
  );
}
