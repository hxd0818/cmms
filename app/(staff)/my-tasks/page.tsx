import { auth } from '@/lib/auth/index';
import { redirect } from 'next/navigation';
import { getMyTasks } from '@/app/actions/task-assignment.actions';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { dict } from '@/lib/shared/dictionary';
import { getBadgeStyle } from '@/lib/shared/badge-colors';
import { Car, Bed, UtensilsCrossed, Gift, ChevronRight } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export default async function MyTasksPage() {
  const session = await auth();
  if (!session) redirect('/login');

  const tasks = await getMyTasks();
  const total =
    tasks.transport.length + tasks.lodging.length + tasks.catering.length + tasks.gifts.length;

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-xl font-bold">我的任务</h1>
        <p className="text-sm text-stone-400 mt-0.5">
          {session.user.name} · 共 {total} 个任务
        </p>
      </div>

      {total === 0 && (
        <div className="cmms-card p-12 text-center">
          <p className="text-sm text-stone-400">暂无分配给你的任务</p>
        </div>
      )}

      {tasks.transport.length > 0 && (
        <TaskSection
          icon={Car}
          title="接送"
          items={tasks.transport.map((t) => ({
            id: t.id,
            meetingId: t.meetingId,
            meetingName: t.meetingName,
            guestName: t.meetingGuest.guest.name,
            status: t.status,
            info: `${t.pickupLocation} -> ${t.dropoffLocation}`,
            subInfo: new Date(t.pickupTime).toLocaleString('zh-CN', {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            }),
            statusType: 'transportStatus',
            path: 'transport',
          }))}
        />
      )}

      {tasks.lodging.length > 0 && (
        <TaskSection
          icon={Bed}
          title="住宿"
          items={tasks.lodging.map((l) => ({
            id: l.id,
            meetingId: l.meetingId,
            meetingName: l.meetingName,
            guestName: l.meetingGuest.guest.name,
            status: l.status,
            info: l.hotelRoom
              ? `${l.hotelRoom.hotel.name} ${l.hotelRoom.roomNumber}`
              : '待分配房间',
            subInfo: `${new Date(l.checkInAt).toLocaleDateString('zh-CN')} - ${new Date(l.checkOutAt).toLocaleDateString('zh-CN')}`,
            statusType: 'lodgingStatus',
            path: 'lodging',
          }))}
        />
      )}

      {tasks.catering.length > 0 && (
        <TaskSection
          icon={UtensilsCrossed}
          title="餐饮"
          items={tasks.catering.map((c) => ({
            id: c.id,
            meetingId: c.meetingId,
            meetingName: c.meetingName,
            guestName: c.meetingGuest.guest.name,
            status: c.status,
            info: dict.mealType[c.mealType] ?? c.mealType,
            subInfo: new Date(c.mealTime).toLocaleString('zh-CN', {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            }),
            statusType: 'cateringStatus',
            path: 'catering',
          }))}
        />
      )}

      {tasks.gifts.length > 0 && (
        <TaskSection
          icon={Gift}
          title="礼品"
          items={tasks.gifts.map((g) => ({
            id: g.id,
            meetingId: g.meetingId,
            meetingName: g.meetingName,
            guestName: g.meetingGuest.guest.name,
            status: g.status,
            info: `${g.gift.name} x${g.quantity}`,
            subInfo: '',
            statusType: 'giftStatus',
            path: 'gifts',
          }))}
        />
      )}
    </div>
  );
}

interface TaskItem {
  id: string;
  meetingId: string;
  meetingName: string;
  guestName: string;
  status: string;
  info: string;
  subInfo: string;
  statusType: string;
  path: string;
}

function TaskSection({
  icon: Icon,
  title,
  items,
}: {
  icon: LucideIcon;
  title: string;
  items: TaskItem[];
}) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <Icon size={16} className="text-stone-400" />
        <h2 className="text-sm font-semibold text-stone-600">{title}</h2>
        <Badge variant="secondary">{items.length}</Badge>
      </div>
      <div className="space-y-2">
        {items.map((item) => (
          <Link
            key={item.id}
            href={`/meetings/${item.meetingId}/${item.path}`}
            className="cmms-card cmms-card-hover flex items-center justify-between p-4 transition-all group"
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{item.guestName}</span>
                <span className="text-xs text-stone-400">{item.meetingName}</span>
              </div>
              <p className="text-xs text-stone-500 mt-0.5">{item.info}</p>
              {item.subInfo && <p className="text-xs text-stone-400 mt-0.5">{item.subInfo}</p>}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Badge className={getBadgeStyle(item.status)} variant="secondary">
                {dict[item.statusType as keyof typeof dict]?.[item.status] ?? item.status}
              </Badge>
              <ChevronRight size={15} className="text-stone-300 group-hover:text-stone-400" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
