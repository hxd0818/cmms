'use client';

import type { Vehicle } from '@/lib/generated/prisma/client';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { deleteVehicle } from '@/app/actions/vehicle.actions';
import { toast } from 'sonner';

const TYPE_LABEL: Record<string, string> = {
  SEDAN: '轿车',
  MPV: '商务车',
  BUS: '大巴',
  OTHER: '其他',
};

export function VehicleList({ items }: { items: Vehicle[] }) {
  const router = useRouter();

  async function onDelete(id: string, plateNo: string) {
    if (!confirm(`确认删除车辆「${plateNo}」？`)) return;
    const r = await deleteVehicle(id);
    if (r.ok) {
      toast.success(`已删除 ${plateNo}`);
      router.refresh();
    } else {
      toast.error(r.error?.message ?? '删除失败');
    }
  }

  return (
    <div className="rounded-md border bg-white">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>车牌号</TableHead>
            <TableHead>类型</TableHead>
            <TableHead>容量</TableHead>
            <TableHead>司机</TableHead>
            <TableHead>电话</TableHead>
            <TableHead>所属</TableHead>
            <TableHead></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center text-slate-500 py-8">
                暂无车辆，点击右上角添加
              </TableCell>
            </TableRow>
          ) : (
            items.map((v) => (
              <TableRow key={v.id}>
                <TableCell className="font-mono font-medium">{v.plateNo}</TableCell>
                <TableCell>
                  <Badge variant="secondary">{TYPE_LABEL[v.type]}</Badge>
                </TableCell>
                <TableCell>{v.capacity} 人</TableCell>
                <TableCell>{v.driverName}</TableCell>
                <TableCell className="font-mono text-sm">{v.driverPhone}</TableCell>
                <TableCell className="text-sm">{v.belongs ?? '-'}</TableCell>
                <TableCell>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onDelete(v.id, v.plateNo)}
                  >
                    删除
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
