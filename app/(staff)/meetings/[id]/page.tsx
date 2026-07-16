import { meetingService } from '@/lib/domain/meeting/service';
import { prisma } from '@/lib/db/client';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { getBadgeStyle } from '@/lib/shared/badge-colors';
import { MeetingStatusButton } from './MeetingStatusButton';
import { MeetingTabs } from '@/components/layout/MeetingTabs';
import {
  Users,
  CalendarDays,
  CheckSquare,
  Car,
  Bed,
  UtensilsCrossed,
  Gift,
  UserCheck,
  Receipt,
  ChevronRight,
  Pencil,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface PageProps {
  params: Promise<{ id: string }>;
}

const STATUS_LABEL: Record<string, string> = {
  DRAFT: '草稿',
  PLANNING: '筹备中',
  ONGOING: '进行中',
  COMPLETED: '已结束',
  CANCELED: '已取消',
};

export default async function MeetingDetailPage({ params }: PageProps) {
  const { id } = await params;
  let meeting;
  try {
    meeting = await meetingService.findById(id);
  } catch {
    notFound();
  }

  // Parallel count queries for all task areas
  const [
    guestCount,
    agendaCount,
    pendingCheckIn,
    checkedIn,
    transportTotal,
    transportAssigned,
    lodgingTotal,
    lodgingAssigned,
    cateringTotal,
    giftPending,
    companionCount,
    feeResult,
  ] = await Promise.all([
    prisma.meetingGuest.count({ where: { meetingId: id } }),
    prisma.agendaItem.count({ where: { meetingId: id } }),
    prisma.meetingGuest.count({ where: { meetingId: id, receptionStage: 'NOT_ARRIVED' } }),
    prisma.meetingGuest.count({
      where: { meetingId: id, receptionStage: { in: ['CHECKED_IN', 'IN_HOUSE', 'DEPARTED'] } },
    }),
    prisma.transportOrder.count({ where: { meetingId: id } }),
    prisma.transportOrder.count({ where: { meetingId: id, vehicleId: { not: null } } }),
    prisma.lodgingOrder.count({ where: { meetingId: id } }),
    prisma.lodgingOrder.count({ where: { meetingId: id, hotelRoomId: { not: null } } }),
    prisma.cateringOrder.count({ where: { meetingId: id } }),
    prisma.giftOrder.count({ where: { meetingId: id, status: 'PENDING' } }),
    prisma.companionAssignment.count({ where: { meetingId: id } }),
    prisma.feeRecord.aggregate({ where: { meetingId: id }, _sum: { amount: true } }),
  ]);

  const totalFee = Number(feeResult._sum.amount ?? 0);

  const taskCards: TaskCardData[] = [
    {
      icon: Users,
      title: '嘉宾管理',
      href: `/meetings/${id}/guests`,
      stats: [{ label: '参会嘉宾', value: String(guestCount) }],
    },
    {
      icon: CalendarDays,
      title: '议程',
      href: `/meetings/${id}/agenda`,
      stats: [{ label: '议程项', value: String(agendaCount) }],
    },
    {
      icon: CheckSquare,
      title: '签到',
      href: `/meetings/${id}/reception`,
      stats: [
        { label: '待签到', value: String(pendingCheckIn), highlight: pendingCheckIn > 0 },
        { label: '已签到', value: String(checkedIn) },
      ],
    },
    {
      icon: Car,
      title: '接送',
      href: `/meetings/${id}/transport`,
      stats: [
        {
          label: '已分配',
          value: transportTotal > 0 ? `${transportAssigned}/${transportTotal}` : '0',
        },
      ],
      alert: transportTotal > transportAssigned,
    },
    {
      icon: Bed,
      title: '住宿',
      href: `/meetings/${id}/lodging`,
      stats: [
        {
          label: '已分配',
          value: lodgingTotal > 0 ? `${lodgingAssigned}/${lodgingTotal}` : '0',
        },
      ],
      alert: lodgingTotal > lodgingAssigned,
    },
    {
      icon: UtensilsCrossed,
      title: '餐饮',
      href: `/meetings/${id}/catering`,
      stats: [{ label: '已安排', value: String(cateringTotal) }],
    },
    {
      icon: Gift,
      title: '礼品',
      href: `/meetings/${id}/gifts`,
      stats: [{ label: '待发放', value: String(giftPending), highlight: giftPending > 0 }],
    },
    {
      icon: UserCheck,
      title: '陪同',
      href: `/meetings/${id}/companions`,
      stats: [{ label: '陪同安排', value: String(companionCount) }],
    },
    {
      icon: Receipt,
      title: '费用',
      href: `/meetings/${id}/fees`,
      stats: [{ label: '累计', value: totalFee > 0 ? `${totalFee.toFixed(0)} 元` : '-' }],
    },
  ];

  return (
    <div className="space-y-6 max-w-5xl">
      <MeetingTabs meetingId={id} meetingName={meeting.name} />
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold">{meeting.name}</h1>
            <Badge className={getBadgeStyle(meeting.status)} variant="secondary">
              {STATUS_LABEL[meeting.status]}
            </Badge>
          </div>
          <p className="text-sm text-stone-400 mt-0.5">
            {new Date(meeting.startAt).toLocaleDateString('zh-CN')}
            {' ~ '}
            {new Date(meeting.endAt).toLocaleDateString('zh-CN')}
            {meeting.venue ? ' · ' + meeting.venue : ''}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/meetings/${meeting.id}/edit`}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg border border-stone-200 text-stone-600 hover:bg-stone-50 transition-colors"
          >
            <Pencil size={13} /> 编辑
          </Link>
          <MeetingStatusButton meetingId={meeting.id} currentStatus={meeting.status} />
        </div>
      </div>

      {/* Task cards grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {taskCards.map((card) => (
          <TaskCard key={card.title} {...card} />
        ))}
      </div>
    </div>
  );
}

interface TaskStat {
  label: string;
  value: string;
  highlight?: boolean;
}

interface TaskCardData {
  icon: LucideIcon;
  title: string;
  href: string;
  stats: TaskStat[];
  alert?: boolean;
}

function TaskCard({ icon: Icon, title, href, stats, alert }: TaskCardData) {
  return (
    <Link
      href={href}
      className={cn(
        'cmms-card cmms-card-hover block p-4 transition-all group',
        alert && 'border-amber-200',
      )}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-stone-100 flex items-center justify-center text-stone-500">
            <Icon size={14} />
          </div>
          <span className="text-sm font-semibold text-stone-700">{title}</span>
        </div>
        <ChevronRight
          size={15}
          className="text-stone-300 group-hover:text-stone-400 transition-colors"
        />
      </div>
      <div className="flex gap-4">
        {stats.map((s) => (
          <div key={s.label}>
            <p className="text-[10px] text-stone-400">{s.label}</p>
            <p
              className={cn(
                'text-lg font-bold tracking-tight',
                s.highlight ? 'text-amber-600' : 'text-stone-800',
              )}
            >
              {s.value}
            </p>
          </div>
        ))}
      </div>
    </Link>
  );
}
