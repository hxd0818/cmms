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
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  assignRoom,
  assignRoommates,
  updateLodgingStatus,
  deleteLodgingOrder,
} from '@/app/actions/lodging.actions';
import { toast } from 'sonner';
import { dict } from '@/lib/shared/dictionary';

type OrderWithRelations = LodgingOrder & {
  meetingGuest: MeetingGuest & { guest: Guest };
  hotelRoom: (HotelRoom & { hotel: Hotel }) | null;
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

  // Build candidate list (other lodging orders in same meeting, for roommate picker)
  const candidates = orders.map((o) => ({
    id: o.id,
    name: o.meetingGuest.guest.name,
  }));

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
      toast.success(`状态已切换: ${dict.lodgingStatus[status]}`);
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
    <div className="cmms-card overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>嘉宾</TableHead>
            <TableHead>入住时间</TableHead>
            <TableHead>退房时间</TableHead>
            <TableHead>房间</TableHead>
            <TableHead>室友</TableHead>
            <TableHead>状态</TableHead>
            <TableHead></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center text-slate-500 py-8">
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
                      <span className="text-xs text-slate-500 ml-1">
                        ({dict.roomType[o.hotelRoom.roomType] ?? o.hotelRoom.roomType})
                      </span>
                    </span>
                  ) : (
                    <Button size="sm" variant="outline" onClick={() => setAssignDialogFor(o.id)}>
                      分配房间
                    </Button>
                  )}
                </TableCell>
                <TableCell>
                  <RoommateCell
                    meetingId={meetingId}
                    orderId={o.id}
                    initialRoommateIds={o.roommateIds}
                    candidates={candidates.filter((c) => c.id !== o.id)}
                  />
                </TableCell>
                <TableCell>
                  <Badge className={STATUS_COLOR[o.status]} variant="secondary">
                    {dict.lodgingStatus[o.status]}
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
                              {dict.lodgingStatus[s]}
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
              <span className={selectedRoom ? '' : 'text-stone-400'}>
                {selectedRoom
                  ? (() => {
                      const r = rooms.find((rm) => rm.id === selectedRoom);
                      return r ? `${r.hotel.name} - ${r.roomNumber}` : selectedRoom;
                    })()
                  : '选择房间'}
              </span>
            </SelectTrigger>
            <SelectContent>
              {rooms.map((r) => (
                <SelectItem key={r.id} value={r.id}>
                  {r.hotel.name} - {r.roomNumber} ({dict.roomType[r.roomType] ?? r.roomType})
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

/**
 * Roommate cell: click to open a multi-select dialog. Persists via assignRoommates action.
 * roommateIds reference other LodgingOrder IDs in the same meeting.
 */
function RoommateCell({
  meetingId,
  orderId,
  initialRoommateIds,
  candidates,
}: {
  meetingId: string;
  orderId: string;
  initialRoommateIds: string[];
  candidates: Array<{ id: string; name: string }>;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set(initialRoommateIds));
  const [saving, setSaving] = useState(false);

  const selectedNames = candidates.filter((c) => selected.has(c.id)).map((c) => c.name);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function onSave() {
    setSaving(true);
    const r = await assignRoommates(orderId, Array.from(selected), meetingId);
    setSaving(false);
    if (r.ok) {
      toast.success('室友已更新');
      setOpen(false);
      router.refresh();
    } else {
      toast.error(r.error?.message ?? '保存失败');
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-xs text-stone-600 hover:text-stone-900 underline-offset-2 hover:underline min-h-[20px]"
      >
        {selectedNames.length > 0 ? selectedNames.join('、') : '点击选择'}
      </button>
      <Dialog open={open} onOpenChange={(o) => !o && setOpen(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>选择室友</DialogTitle>
          </DialogHeader>
          <div className="max-h-72 overflow-auto space-y-1">
            {candidates.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-4">
                无可选嘉宾（需先创建住宿订单）
              </p>
            ) : (
              candidates.map((c) => {
                const checked = selected.has(c.id);
                return (
                  <label
                    key={c.id}
                    className="flex items-center gap-2 p-2 rounded border hover:bg-slate-50 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggle(c.id)}
                      className="rounded"
                    />
                    <span className="text-sm">{c.name}</span>
                  </label>
                );
              })
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              取消
            </Button>
            <Button onClick={onSave} disabled={saving}>
              {saving ? '保存中...' : '保存'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
