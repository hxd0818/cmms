'use client';

import { useState, useMemo, useEffect } from 'react';
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
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  assignVehicle,
  getVehicleSeatInfo,
  updateTransportStatus,
  deleteTransportOrder,
} from '@/app/actions/transport.actions';
import { toast } from 'sonner';
import { dict } from '@/lib/shared/dictionary';

type OrderWithRelations = TransportOrder & {
  meetingGuest: MeetingGuest & { guest: Guest };
  vehicle: Vehicle | null;
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

interface Props {
  meetingId: string;
  orders: OrderWithRelations[];
  vehicles: Vehicle[];
}

export function TransportList({ meetingId, orders, vehicles }: Props) {
  const router = useRouter();
  const [assignDialogFor, setAssignDialogFor] = useState<{
    orderId: string;
    pickupTime: string;
  } | null>(null);
  const [selectedVehicle, setSelectedVehicle] = useState('');

  async function onAssign() {
    if (!assignDialogFor || !selectedVehicle) return;
    const r = await assignVehicle(assignDialogFor.orderId, selectedVehicle, meetingId);
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
      toast.success(`状态已切换: ${dict.transportStatus[status]}`);
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
    <div className="cmms-card overflow-hidden">
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
                <TableCell className="font-medium">{o.meetingGuest.guest.name}</TableCell>
                <TableCell className="text-sm">{dict.pickupType[o.pickupType]}</TableCell>
                <TableCell className="text-sm">{o.pickupLocation}</TableCell>
                <TableCell className="text-sm">{o.dropoffLocation}</TableCell>
                <TableCell className="text-sm">
                  {new Date(o.pickupTime).toLocaleString('zh-CN')}
                </TableCell>
                <TableCell className="text-sm font-mono">{o.flightNo ?? '-'}</TableCell>
                <TableCell>
                  {o.vehicle ? (
                    <span className="text-sm font-mono">
                      {o.vehicle.plateNo}
                      <span className="text-xs text-slate-500 ml-1">({o.vehicle.driverName})</span>
                    </span>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        setAssignDialogFor({
                          orderId: o.id,
                          pickupTime: o.pickupTime.toISOString(),
                        })
                      }
                    >
                      分配车辆
                    </Button>
                  )}
                </TableCell>
                <TableCell>
                  <Badge className={STATUS_COLOR[o.status]} variant="secondary">
                    {dict.transportStatus[o.status]}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex gap-1 items-center">
                    {(NEXT_STATUSES[o.status] ?? []).length > 0 && (
                      <Select value="" onValueChange={(v) => v && onStatusChange(o.id, v)}>
                        <SelectTrigger className="h-7 w-24 text-xs">
                          <span className="text-stone-400">切换</span>
                        </SelectTrigger>
                        <SelectContent>
                          {(NEXT_STATUSES[o.status] ?? []).map((s) => (
                            <SelectItem key={s} value={s}>
                              {dict.transportStatus[s]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                    <Button size="sm" variant="ghost" onClick={() => onDelete(o.id)}>
                      删除
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      <VehicleAssignDialog
        open={!!assignDialogFor}
        pickupTime={assignDialogFor?.pickupTime ?? ''}
        onClose={() => setAssignDialogFor(null)}
        vehicles={vehicles}
        selectedVehicle={selectedVehicle}
        onSelect={setSelectedVehicle}
        onConfirm={onAssign}
      />
    </div>
  );
}

function VehicleAssignDialog({
  open,
  pickupTime,
  onClose,
  vehicles,
  selectedVehicle,
  onSelect,
  onConfirm,
}: {
  open: boolean;
  pickupTime: string;
  onClose: () => void;
  vehicles: Vehicle[];
  selectedVehicle: string;
  onSelect: (id: string) => void;
  onConfirm: () => void;
}) {
  const [search, setSearch] = useState('');
  const [seatInfo, setSeatInfo] = useState<{
    capacity: number;
    occupied: number;
    remaining: number;
    hasOthers: boolean;
  } | null>(null);
  const [needConfirm, setNeedConfirm] = useState(false);

  // Fetch seat info when a vehicle is selected
  useEffect(() => {
    if (!selectedVehicle || !pickupTime) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSeatInfo(null);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setNeedConfirm(false);
      return;
    }
    getVehicleSeatInfo(selectedVehicle, pickupTime).then((r) => {
      if (r.ok && r.data) {
        setSeatInfo(r.data);
        setNeedConfirm(r.data.hasOthers);
      }
    });
  }, [selectedVehicle, pickupTime]);

  function handleSelect(id: string) {
    onSelect(id);
    setNeedConfirm(false);
  }

  function handleConfirm() {
    if (needConfirm && !confirm('此车辆已有其他嘉宾，确认拼车？')) return;
    onConfirm();
  }

  const filtered = useMemo(() => {
    if (!search.trim()) return vehicles;
    const q = search.toLowerCase();
    return vehicles.filter(
      (v) =>
        v.plateNo.toLowerCase().includes(q) ||
        v.driverName.toLowerCase().includes(q) ||
        (v.belongs ?? '').toLowerCase().includes(q) ||
        dict.vehicleType[v.type]?.includes(search),
    );
  }, [vehicles, search]);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>分配车辆</DialogTitle>
        </DialogHeader>

        <Input
          placeholder="搜索车牌 / 司机 / 车队 / 车型..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="mb-2"
        />

        <div className="max-h-72 overflow-y-auto space-y-1.5">
          {filtered.length === 0 ? (
            <p className="text-sm text-stone-400 text-center py-8">无匹配车辆</p>
          ) : (
            filtered.map((v) => (
              <button
                key={v.id}
                onClick={() => handleSelect(v.id)}
                className={cn(
                  'w-full text-left p-3 rounded-lg border transition-all',
                  selectedVehicle === v.id
                    ? 'border-stone-800 bg-stone-50 ring-1 ring-stone-800'
                    : 'border-stone-200 hover:border-stone-300 hover:bg-stone-50',
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-sm">{v.plateNo}</span>
                    <Badge variant="outline" className="text-xs">
                      {dict.vehicleType[v.type]}
                    </Badge>
                    <span className="text-xs text-stone-400">{v.capacity} 座</span>
                  </div>
                  {selectedVehicle === v.id && (
                    <CheckCircle2 size={16} className="text-stone-800" />
                  )}
                </div>
                <div className="flex items-center gap-3 mt-1.5 text-xs text-stone-500">
                  <span>{v.driverName}</span>
                  <span className="font-mono">{v.driverPhone}</span>
                  {v.belongs && <span>· {v.belongs}</span>}
                </div>
              </button>
            ))
          )}
        </div>

        {/* Seat info when selected */}
        {seatInfo && selectedVehicle && (
          <div
            className={cn(
              'rounded-lg p-3 text-sm',
              seatInfo.hasOthers
                ? 'bg-amber-50 border border-amber-200'
                : 'bg-stone-50 border border-stone-200',
            )}
          >
            {seatInfo.hasOthers ? (
              <p className="text-amber-700">
                此车辆在该时间段已有其他嘉宾，已占 {seatInfo.occupied}/{seatInfo.capacity} 座，剩余{' '}
                {seatInfo.remaining} 座。点击确认后将拼车。
              </p>
            ) : (
              <p className="text-stone-500">车辆空闲，{seatInfo.capacity} 座全部可用。</p>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            取消
          </Button>
          <Button onClick={handleConfirm} disabled={!selectedVehicle}>
            {needConfirm ? '确认拼车' : '确认分配'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
