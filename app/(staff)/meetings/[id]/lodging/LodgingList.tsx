'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type {
  LodgingOrder,
  HotelRoom,
  Hotel,
  MeetingGuest,
  Guest,
} from '@/lib/generated/prisma/client';
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
import { assignRoom, updateLodgingStatus, deleteLodgingOrder } from '@/app/actions/lodging.actions';
import { toast } from 'sonner';

type OrderWithRelations = LodgingOrder & {
  meetingGuest: MeetingGuest & { guest: Guest };
  hotelRoom: (HotelRoom & { hotel: Hotel }) | null;
};

const STATUS_LABEL: Record<string, string> = {
  UNASSIGNED: '待分配',
  RESERVED: '已预订',
  CHECKED_IN: '已入住',
  CHECKED_OUT: '已退房',
  ROOM_CHANGED: '换房中',
  CANCELED: '已取消',
};

const STATUS_COLOR: Record<string, string> = {
  UNASSIGNED: 'bg-amber-100 text-amber-800',
  RESERVED: 'bg-blue-100 text-blue-800',
  CHECKED_IN: 'bg-green-100 text-green-800',
  CHECKED_OUT: 'bg-slate-100 text-slate-800',
  ROOM_CHANGED: 'bg-orange-100 text-orange-800',
  CANCELED: 'bg-red-100 text-red-800',
};

const NEXT_STATUSES: Record<string, string[]> = {
  UNASSIGNED: ['CANCELED'],
  RESERVED: ['CHECKED_IN', 'CANCELED'],
  CHECKED_IN: ['CHECKED_OUT'],
  CHECKED_OUT: [],
  ROOM_CHANGED: ['CHECKED_IN', 'CHECKED_OUT'],
  CANCELED: [],
};

interface Props {
  meetingId: string;
  orders: OrderWithRelations[];
  rooms: (HotelRoom & { hotel: Hotel })[];
}

export function LodgingList({ meetingId, orders, rooms }: Props) {
  const router = useRouter();
  const [assignDialogFor, setAssignDialogFor] = useState<string | null>(null);
  const [selectedRoom, setSelectedRoom] = useState('');

  async function onAssign() {
    if (!assignDialogFor || !selectedRoom) return;
    const r = await assignRoom(assignDialogFor, selectedRoom, meetingId);
    if (r.ok) {
      toast.success('已分配房间');
      setAssignDialogFor(null);
      setSelectedRoom('');
      router.refresh();
    } else {
      toast.error(r.error?.message ?? '分配失败');
    }
  }

  async function onStatusChange(orderId: string, status: string) {
    const r = await updateLodgingStatus(orderId, status as never, meetingId);
    if (r.ok) {
      toast.success(`状态已切换: ${STATUS_LABEL[status]}`);
      router.refresh();
    } else {
      toast.error(r.error?.message ?? '状态切换失败');
    }
  }

  async function onDelete(orderId: string) {
    if (!confirm('确认删除该住宿订单？')) return;
    const r = await deleteLodgingOrder(orderId, meetingId);
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
            <TableHead>入住时间</TableHead>
            <TableHead>退房时间</TableHead>
            <TableHead>房间</TableHead>
            <TableHead>状态</TableHead>
            <TableHead></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-slate-500 py-8">
                暂无住宿订单
              </TableCell>
            </TableRow>
          ) : (
            orders.map((o) => (
              <TableRow key={o.id}>
                <TableCell className="font-medium">{o.meetingGuest.guest.name}</TableCell>
                <TableCell className="text-sm">
                  {new Date(o.checkInAt).toLocaleString('zh-CN')}
                </TableCell>
                <TableCell className="text-sm">
                  {new Date(o.checkOutAt).toLocaleString('zh-CN')}
                </TableCell>
                <TableCell>
                  {o.hotelRoom ? (
                    <span className="text-sm">
                      {o.hotelRoom.hotel.name} - {o.hotelRoom.roomNumber}
                      <span className="text-xs text-slate-500 ml-1">({o.hotelRoom.roomType})</span>
                    </span>
                  ) : (
                    <Button size="sm" variant="outline" onClick={() => setAssignDialogFor(o.id)}>
                      分配房间
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
                      <Select value="" onValueChange={(v) => v && onStatusChange(o.id, v)}>
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

      <Dialog open={!!assignDialogFor} onOpenChange={(o) => !o && setAssignDialogFor(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>分配房间</DialogTitle>
          </DialogHeader>
          <Select value={selectedRoom} onValueChange={(v) => setSelectedRoom(v ?? '')}>
            <SelectTrigger>
              <SelectValue placeholder="选择房间" />
            </SelectTrigger>
            <SelectContent>
              {rooms.map((r) => (
                <SelectItem key={r.id} value={r.id}>
                  {r.hotel.name} - {r.roomNumber} ({r.roomType})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignDialogFor(null)}>
              取消
            </Button>
            <Button onClick={onAssign} disabled={!selectedRoom}>
              确认分配
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
