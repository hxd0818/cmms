import { listGuests } from '@/app/actions/guest.actions';
import { GuestList } from './GuestList';
import { buttonVariants } from '@/components/ui/button';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface PageProps {
  searchParams: Promise<{ search?: string; level?: string; page?: string }>;
}

export default async function GuestsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const result = await listGuests({
    search: params.search,
    level: params.level as 'VIP_A' | 'VIP_B' | 'A' | 'B' | 'C' | undefined,
    page: params.page ? Number(params.page) : 1,
    pageSize: 20,
  });

  if (!result.ok || !result.data) {
    return (
      <div className="cmms-card p-12 text-center text-sm text-stone-500">
        {result.error?.message ?? '加载失败'}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">嘉宾库</h1>
          <p className="text-sm text-slate-500">共 {result.data.total} 位嘉宾</p>
        </div>
        <div className="flex gap-2">
          <Link href="/guests/import" className={cn(buttonVariants({ variant: 'outline' }))}>
            批量导入
          </Link>
          <Link href="/guests/new" className={buttonVariants()}>
            新增嘉宾
          </Link>
        </div>
      </div>
      <GuestList
        items={result.data.items}
        page={result.data.page}
        pageSize={result.data.pageSize}
        total={result.data.total}
      />
    </div>
  );
}
