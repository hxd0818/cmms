'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select';
import { createHotel, addHotelRoom } from '@/app/actions/hotel.actions';
import { dict } from '@/lib/shared/dictionary';
import { toast } from 'sonner';
import { Bed, Plus, Trash2 } from 'lucide-react';

interface HotelWithCount {
  id: string;
  name: string;
  address: string;
  contactPhone: string | null;
  _count?: { rooms: number };
}

interface RoomWithHotel {
  id: string;
  hotelId: string;
  roomNumber: string;
  roomType: string;
  hotel: { name: string };
}

export function HotelRoomManager({
  meetingId,
  initialHotels,
  initialRooms,
}: {
  meetingId: string;
  initialHotels: HotelWithCount[];
  initialRooms: RoomWithHotel[];
}) {
  return (
    <div className="cmms-card overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b bg-stone-50">
        <div className="flex items-center gap-2">
          <Bed size={16} className="text-stone-500" />
          <h2 className="text-sm font-semibold text-stone-700">酒店房间</h2>
          <Badge variant="secondary">{initialRooms.length} 间</Badge>
        </div>
        <AddHotelButton meetingId={meetingId} />
      </div>

      <div className="divide-y divide-stone-100">
        {initialHotels.length === 0 ? (
          <p className="text-sm text-stone-400 text-center py-8">暂无酒店，点击右上角添加</p>
        ) : (
          initialHotels.map((hotel) => {
            const rooms = initialRooms.filter((r) => r.hotelId === hotel.id);
            return (
              <div key={hotel.id} className="px-4 py-3">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <span className="text-sm font-medium">{hotel.name}</span>
                    <span className="text-xs text-stone-400 ml-2">{hotel.address}</span>
                    {hotel.contactPhone && (
                      <span className="text-xs text-stone-400 ml-2 font-mono">
                        {hotel.contactPhone}
                      </span>
                    )}
                  </div>
                  <AddRoomButton meetingId={meetingId} hotelId={hotel.id} hotelName={hotel.name} />
                </div>
                {rooms.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {rooms.map((r) => (
                      <Badge key={r.id} variant="outline" className="text-xs">
                        {r.roomNumber} ({dict.roomType[r.roomType] ?? r.roomType})
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

function AddHotelButton({ meetingId }: { meetingId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    const r = await createHotel({ meetingId, name, address, contactPhone: phone || undefined });
    setSubmitting(false);
    if (r.ok) {
      toast.success('酒店已添加');
      setOpen(false);
      setName('');
      setAddress('');
      setPhone('');
      router.refresh();
    } else {
      toast.error(r.error?.message ?? '添加失败');
    }
  }

  if (!open) {
    return (
      <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
        <Plus size={14} className="mr-1" /> 添加酒店
      </Button>
    );
  }

  return (
    <form onSubmit={onSubmit} className="flex items-center gap-2">
      <Input
        className="h-7 w-32 text-xs"
        placeholder="酒店名称"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
      />
      <Input
        className="h-7 w-40 text-xs"
        placeholder="地址"
        value={address}
        onChange={(e) => setAddress(e.target.value)}
        required
      />
      <Input
        className="h-7 w-28 text-xs"
        placeholder="联系电话"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
      />
      <Button size="sm" type="submit" disabled={submitting}>
        {submitting ? '...' : '确认'}
      </Button>
      <Button size="sm" type="button" variant="outline" onClick={() => setOpen(false)}>
        取消
      </Button>
    </form>
  );
}

function AddRoomButton({
  meetingId,
  hotelId,
  hotelName,
}: {
  meetingId: string;
  hotelId: string;
  hotelName: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [roomNumber, setRoomNumber] = useState('');
  const [roomType, setRoomType] = useState('SINGLE');
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    const r = await addHotelRoom({ hotelId, roomNumber, roomType: roomType as never, meetingId });
    setSubmitting(false);
    if (r.ok) {
      toast.success('房间已添加');
      setOpen(false);
      setRoomNumber('');
      router.refresh();
    } else {
      toast.error(r.error?.message ?? '添加失败');
    }
  }

  if (!open) {
    return (
      <Button size="sm" variant="ghost" onClick={() => setOpen(true)}>
        <Plus size={12} className="mr-0.5" /> 添加房间
      </Button>
    );
  }

  return (
    <form onSubmit={onSubmit} className="flex items-center gap-2">
      <Input
        className="h-7 w-24 text-xs"
        placeholder="房号"
        value={roomNumber}
        onChange={(e) => setRoomNumber(e.target.value)}
        required
      />
      <Select value={roomType} onValueChange={(v) => setRoomType(v ?? 'SINGLE')}>
        <SelectTrigger className="h-7 w-28 text-xs">
          <span>{dict.roomType[roomType] ?? roomType}</span>
        </SelectTrigger>
        <SelectContent>
          {Object.entries(dict.roomType).map(([v, l]) => (
            <SelectItem key={v} value={v}>
              {l}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button size="sm" type="submit" disabled={submitting}>
        确认
      </Button>
      <Button size="sm" type="button" variant="outline" onClick={() => setOpen(false)}>
        取消
      </Button>
    </form>
  );
}
