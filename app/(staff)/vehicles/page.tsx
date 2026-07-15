import { vehicleService } from '@/lib/domain/vehicle/service';
import { VehicleList } from './VehicleList';
import { buttonVariants } from '@/components/ui/button';
import Link from 'next/link';

interface PageProps {
  searchParams: Promise<{ search?: string; page?: string }>;
}

export default async function VehiclesPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const result = await vehicleService.list({
    search: params.search,
    page: params.page ? Number(params.page) : 1,
    pageSize: 20,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">车辆资源</h1>
          <p className="text-sm text-slate-500">共 {result.total} 辆车</p>
        </div>
        <Link href="/vehicles/new" className={buttonVariants()}>
          新增车辆
        </Link>
      </div>
      <VehicleList items={result.items} />
    </div>
  );
}
