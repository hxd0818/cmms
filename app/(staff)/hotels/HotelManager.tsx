'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
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
import { createHotel, getHotelDetail, addHotelRoom } from '@/app/actions/hotel.actions';
import { toast } from 'sonner';

type HotelWithCount = {
  id: string;
  name: string;
  address: string;
  contactPhone: string | null;
  _count: { rooms: number };
};

type RoomInfo = {
  id: string;
  roomNumber: string;
  roomType: string;
  status: string;
};

const ROOM_TYPE_LABEL: Record<string, string> = {
  SINGLE: '单人间',
  DOUBLE: '双人间',
  SUITE: '套房',
};

const ROOM_STATUS_LABEL: Record<string, string> = {
  AVAILABLE: '可用',
  RESERVED: '已预订',
  OCCUPIED: '使用中',
  MAINTENANCE: '维护中',
};

const ROOM_STATUS_COLOR: Record<string, string> = {
  AVAILABLE: 'bg-green-100 text-green-800',
  RESERVED: 'bg-blue-100 text-blue-800',
  OCCUPIED: 'bg-orange-100 text-orange-800',
  MAINTENANCE: 'bg-red-100 text-red-800',
};

export function HotelManager({ initialHotels }: { initialHotels: HotelWithCount[] }) {
  const router = useRouter();
  const [showHotelForm, setShowHotelForm] = useState(false);
  const [expandedHotel, setExpandedHotel] = useState<string | null>(null);
  const [rooms, setRooms] = useState<RoomInfo[]>([]);
  const [showRoomForm, setShowRoomForm] = useState(false);
  const [loadingRooms, setLoadingRooms] = useState(false);

  // Hotel form state
  const [hotelName, setHotelName] = useState('');
  const [hotelAddress, setHotelAddress] = useState('');
  const [hotelPhone, setHotelPhone] = useState('');
  const [submittingHotel, setSubmittingHotel] = useState(false);

  // Room form state
  const [roomNumber, setRoomNumber] = useState('');
  const [roomType, setRoomType] = useState('SINGLE');
  const [submittingRoom, setSubmittingRoom] = useState(false);

  async function onCreateHotel(e: React.FormEvent) {
    e.preventDefault();
    if (!hotelName || !hotelAddress) {
      toast.error('请填写酒店名称和地址');
      return;
    }
    setSubmittingHotel(true);
    const r = await createHotel({
      name: hotelName,
      address: hotelAddress,
      contactPhone: hotelPhone || undefined,
    });
    setSubmittingHotel(false);
    if (r.ok) {
      toast.success('酒店已创建');
      setShowHotelForm(false);
      setHotelName('');
      setHotelAddress('');
      setHotelPhone('');
      router.refresh();
    } else {
      toast.error(r.error?.message ?? '创建失败');
    }
  }

  async function onLoadRooms(hotelId: string) {
    if (expandedHotel === hotelId) {
      setExpandedHotel(null);
      return;
    }
    setExpandedHotel(hotelId);
    setLoadingRooms(true);
    const r = await getHotelDetail(hotelId);
    setLoadingRooms(false);
    if (r.ok && r.data) {
      setRooms(r.data.rooms);
    } else {
      toast.error(r.error?.message ?? '加载房间失败');
    }
  }

  async function onAddRoom(e: React.FormEvent) {
    e.preventDefault();
    if (!expandedHotel || !roomNumber) {
      toast.error('请填写房号');
      return;
    }
    setSubmittingRoom(true);
    const r = await addHotelRoom({
      hotelId: expandedHotel,
      roomNumber,
      roomType,
    });
    setSubmittingRoom(false);
    if (r.ok) {
      toast.success('房间已添加');
      setShowRoomForm(false);
      setRoomNumber('');
      setRoomType('SINGLE');
      // Reload rooms for this hotel
      const detail = await getHotelDetail(expandedHotel);
      if (detail.ok && detail.data) {
        setRooms(detail.data.rooms);
      }
      router.refresh();
    } else {
      toast.error(r.error?.message ?? '添加失败');
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setShowHotelForm(true)} variant="outline">
          新增酒店
        </Button>
      </div>

      {/* Hotel list */}
      <div className="rounded-md border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>酒店名称</TableHead>
              <TableHead>地址</TableHead>
              <TableHead>联系电话</TableHead>
              <TableHead>房间数</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {initialHotels.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-slate-500 py-8">
                  暂无酒店
                </TableCell>
              </TableRow>
            ) : (
              initialHotels.map((h) => (
                <TableRow key={h.id}>
                  <TableCell className="font-medium">{h.name}</TableCell>
                  <TableCell className="text-sm">{h.address}</TableCell>
                  <TableCell className="text-sm">{h.contactPhone ?? '-'}</TableCell>
                  <TableCell className="text-sm">{h._count.rooms}</TableCell>
                  <TableCell>
                    <Button size="sm" variant="outline" onClick={() => onLoadRooms(h.id)}>
                      {expandedHotel === h.id ? '收起' : '管理房间'}
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Expanded room panel */}
      {expandedHotel && (
        <div className="bg-white rounded-md border p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">房间列表</h3>
            <Button size="sm" variant="outline" onClick={() => setShowRoomForm(!showRoomForm)}>
              {showRoomForm ? '取消' : '添加房间'}
            </Button>
          </div>

          {showRoomForm && (
            <form
              onSubmit={onAddRoom}
              className="bg-slate-50 rounded-md border p-3 flex gap-3 items-end"
            >
              <div>
                <Label htmlFor="roomNumber">房号</Label>
                <Input
                  id="roomNumber"
                  value={roomNumber}
                  onChange={(e) => setRoomNumber(e.target.value)}
                  className="w-32"
                />
              </div>
              <div>
                <Label>房型</Label>
                <Select value={roomType} onValueChange={(v) => setRoomType(v ?? 'SINGLE')}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SINGLE">单人间</SelectItem>
                    <SelectItem value="DOUBLE">双人间</SelectItem>
                    <SelectItem value="SUITE">套房</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" disabled={submittingRoom}>
                {submittingRoom ? '添加中...' : '添加'}
              </Button>
            </form>
          )}

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>房号</TableHead>
                <TableHead>房型</TableHead>
                <TableHead>状态</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loadingRooms ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-slate-500 py-4">
                    加载中...
                  </TableCell>
                </TableRow>
              ) : rooms.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-slate-500 py-4">
                    暂无房间
                  </TableCell>
                </TableRow>
              ) : (
                rooms.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-mono text-sm">{r.roomNumber}</TableCell>
                    <TableCell className="text-sm">{ROOM_TYPE_LABEL[r.roomType]}</TableCell>
                    <TableCell>
                      <Badge className={ROOM_STATUS_COLOR[r.status]} variant="secondary">
                        {ROOM_STATUS_LABEL[r.status]}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Hotel create dialog */}
      <Dialog open={showHotelForm} onOpenChange={setShowHotelForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>新增酒店</DialogTitle>
          </DialogHeader>
          <form onSubmit={onCreateHotel} className="space-y-3">
            <div>
              <Label htmlFor="hotelName">酒店名称 *</Label>
              <Input
                id="hotelName"
                value={hotelName}
                onChange={(e) => setHotelName(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="hotelAddress">地址 *</Label>
              <Input
                id="hotelAddress"
                value={hotelAddress}
                onChange={(e) => setHotelAddress(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="hotelPhone">联系电话</Label>
              <Input
                id="hotelPhone"
                value={hotelPhone}
                onChange={(e) => setHotelPhone(e.target.value)}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowHotelForm(false)}>
                取消
              </Button>
              <Button type="submit" disabled={submittingHotel}>
                {submittingHotel ? '创建中...' : '创建'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
