'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { TransportOrder, Vehicle, MeetingGuest, Guest } from '@/lib/generated/prisma/client';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { assignVehicle, updateTransportStatus, deleteTransportOrder } from '@/app/actions/transport.actions';
import { toast } from 'sonner';

type OrderWithRelations = TransportOrder & {
  meetingGuest: MeetingGuest & { guest: Guest };
  vehicle: Vehicle | null;
};

const STATUS_LABEL: Record<string, string> = {
  UNASSIGNED: '待分配',
  ASSIGNED: '已分配',
  EN_ROUTE: '前往中',
  PICKED_UP: '已接到',
  COMPLETED: '已完成',
  REASSIGNED: '已改派',
  CANCELED: '已取消',
};

const STATUS_COLOR: Record<string, string> = {
  UNASSIGNED: 'bg-amber-100 text-amber-800',
  ASSIGNED: 'bg-blue-100 text-blue-800',
  EN_ROUTE: 'bg-cyan-100 text-cyan-800',
  PICKED_UP: 'bg-indigo-100 text-indigo-800',
  COMPLETED: 'bg-green-100 text-green-800',
  REASSIGNED: 'bg-orange-100 text-orange-800',
  CANCELED: 'bg-red-100 text-red-800',
};

const NEXT_STATUSES: Record<string, string[]> = {
  UNASSIGNED: ['CANCELED'],
  ASSIGNED: ['EN_ROUTE', 'REASSIGNED', 'CANCELED'],
  EN_ROUTE: ['PICKED_UP', 'CANCELED'],
  PICKED_UP: ['COMPLETED'],
  COMPLETED: [],
  REASSIGNED: ['CANCELED'],
  CANCELED: [],
};

const PICKUP_LABEL: Record<string, string> = {
  AIRPORT: '机场',
  TRAINSTATION: '火车站',
  HOTEL: '酒店',
  VENUE: '会议场地',
};

interface Props {
  meetingId: string;
  orders: OrderWithRelations[];
  vehicles: Vehicle[];
}

export function TransportList({ meetingId, orders, vehicles }: Props) {
  const router = useRouter();
  const [assignDialogFor, setAssignDialogFor] = useState<string | null>(null);
  const [selectedVehicle, setSelectedVehicle] = useState('');

  async function onAssign() {
    if (!assignDialogFor || !selectedVehicle) return;
    const r = await assignVehicle(assignDialogFor, selectedVehicle, meetingId);
    if (r.ok) {
      toast.success('已分配车辆');
      setAssignDialogFor(null);
      setSelectedVehicle('');
      router.refresh();
    } else {
      toast.error(r.error?.message ?? '分配失败');
    }
  }

  async function onStatusChange(orderId: string, status: string) {
    const r = await updateTransportStatus(orderId, status as never, meetingId);
    if (r.ok) {
      toast.success(`状态已切换: ${STATUS_LABEL[status]}`);
      router.refresh();
    } else {
      toast.error(r.error?.message ?? '状态切换失败');
    }
  }

  async function onDelete(orderId: string) {
    if (!confirm('确认删除该接送任务？')) return;
    const r = await deleteTransportOrder(orderId, meetingId);
    if (r.ok) {
      toast.success('已删除');
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
            <TableHead>嘉宾</TableHead>
            <TableHead>类型</TableHead>
            <TableHead>上车</TableHead>
            <TableHead>下车</TableHead>
            <TableHead>时间</TableHead>
            <TableHead>航班</TableHead>
            <TableHead>车辆</TableHead>
            <TableHead>状态</TableHead>
            <TableHead></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.length === 0 ? (
            <TableRow>
              <TableCell colSpan={9} className="text-center text-slate-500 py-8">
                暂无接送任务
              </TableCell>
            </TableRow>
          ) : (
            orders.map((o) => (
              <TableRow key={o.id}>
                <TableCell className="font-medium">
                  {o.meetingGuest.guest.name}
                </TableCell>
                <TableCell className="text-sm">
                  {PICKUP_LABEL[o.pickupType]}
                </TableCell>
                <TableCell className="text-sm">{o.pickupLocation}</TableCell>
                <TableCell className="text-sm">{o.dropoffLocation}</TableCell>
                <TableCell className="text-sm">
                  {new Date(o.pickupTime).toLocaleString('zh-CN')}
                </TableCell>
                <TableCell className="text-sm font-mono">
                  {o.flightNo ?? '-'}
                </TableCell>
                <TableCell>
                  {o.vehicle ? (
                    <span className="text-sm font-mono">
                      {o.vehicle.plateNo}
                      <span className="text-xs text-slate-500 ml-1">
                        ({o.vehicle.driverName})
                      </span>
                    </span>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setAssignDialogFor(o.id)}
                    >
                      分配车辆
                    </Button>
                  )}
                </TableCell>
                <TableCell>
                  <Badge className={STATUS_COLOR[o.status]} variant="secondary">
                    {STATUS_LABEL[o.status]}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex gap-1 items-center">
                    {(NEXT_STATUSES[o.status] ?? []).length > 0 && (
                      <Select
                        value=""
                        onValueChange={(v) => v && onStatusChange(o.id, v)}
                      >
                        <SelectTrigger className="h-7 w-24 text-xs">
                          <SelectValue placeholder="切换" />
                        </SelectTrigger>
                        <SelectContent>
                          {(NEXT_STATUSES[o.status] ?? []).map((s) => (
                            <SelectItem key={s} value={s}>
                              {STATUS_LABEL[s]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onDelete(o.id)}
                    >
                      删除
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      <Dialog open={!!assignDialogFor} onOpenChange={(o) => !o && setAssignDialogFor(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>分配车辆</DialogTitle>
          </DialogHeader>
          <Select value={selectedVehicle} onValueChange={(v) => setSelectedVehicle(v ?? '')}>
            <SelectTrigger>
              <SelectValue placeholder="选择车辆" />
            </SelectTrigger>
            <SelectContent>
              {vehicles.map((v) => (
                <SelectItem key={v.id} value={v.id}>
                  {v.plateNo} · {v.driverName} · {v.capacity}人
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignDialogFor(null)}>
              取消
            </Button>
            <Button onClick={onAssign} disabled={!selectedVehicle}>
              确认分配
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
