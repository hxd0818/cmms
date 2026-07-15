import { guestService } from '@/lib/domain/guest/service';
import { GuestList } from './GuestList';
import { buttonVariants } from '@/components/ui/button';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface PageProps {
  searchParams: Promise<{ search?: string; level?: string; page?: string }>;
}

export default async function GuestsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const result = await guestService.list({
    search: params.search,
    level: params.level as 'VIP_A' | 'VIP_B' | 'A' | 'B' | 'C' | undefined,
    page: params.page ? Number(params.page) : 1,
    pageSize: 20,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">嘉宾库</h1>
          <p className="text-sm text-slate-500">共 {result.total} 位嘉宾</p>
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
        items={result.items}
        page={result.page}
        pageSize={result.pageSize}
        total={result.total}
      />
    </div>
  );
}
