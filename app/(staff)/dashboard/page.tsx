import { auth } from '@/lib/auth/index';
import { redirect } from 'next/navigation';
import { reportService } from '@/lib/domain/report/service';
import { PageHeader } from '@/components/layout/PageHeader';
import { getBadgeStyle } from '@/lib/shared/badge-colors';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { Users, CalendarDays, Activity, Plus, ChevronRight } from 'lucide-react';

const STATUS_LABEL: Record<string, string> = {
  DRAFT: '草稿',
  PLANNING: '筹备中',
  ONGOING: '进行中',
  COMPLETED: '已结束',
  CANCELED: '已取消',
};

export default async function DashboardPage() {
  const session = await auth();
  if (!session) redirect('/login');

  const stats = await reportService.getDashboardStats();

  return (
    <div className="max-w-6xl">
      <PageHeader title="控制台" description={`欢迎回来，${session.user.name}`}>
        <Link href="/meetings/new" className={cn(buttonVariants({ size: 'sm' }))}>
          <Plus size={15} className="mr-1" />
          新建会议
        </Link>
      </PageHeader>

      {/* Stat cards */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <StatCard
          icon={<Users size={18} />}
          label="嘉宾总数"
          value={stats.totalGuests}
          href="/guests"
        />
        <StatCard
          icon={<CalendarDays size={18} />}
          label="会议总数"
          value={stats.totalMeetings}
          href="/meetings"
        />
        <StatCard
          icon={<Activity size={18} />}
          label="进行中"
          value={stats.ongoingMeetings}
          href="/meetings?status=ONGOING"
          highlight={stats.ongoingMeetings > 0}
        />
      </div>

      {/* Upcoming meetings */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-stone-700">近期会议</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {stats.upcoming.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <p className="text-sm text-stone-400">未来 30 天暂无计划会议</p>
              <Link
                href="/meetings/new"
                className="inline-flex items-center gap-1 mt-3 text-xs font-medium text-teal-600 hover:text-teal-700"
              >
                创建第一场会议 <ChevronRight size={12} />
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-stone-100">
              {stats.upcoming.map((m) => (
                <Link
                  key={m.id}
                  href={`/meetings/${m.id}`}
                  className="flex items-center justify-between px-6 py-3.5 hover:bg-stone-50 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div>
                      <p className="text-sm font-medium text-stone-800">{m.name}</p>
                      <p className="text-xs text-stone-400 mt-0.5">
                        {new Date(m.startAt).toLocaleDateString('zh-CN', {
                          month: 'short',
                          day: 'numeric',
                          weekday: 'short',
                        })}
                        {m.venue ? ` · ${m.venue}` : ''}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={getBadgeStyle(m.status)} variant="secondary">
                      {STATUS_LABEL[m.status]}
                    </Badge>
                    <ChevronRight
                      size={15}
                      className="text-stone-300 group-hover:text-stone-400 transition-colors"
                    />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  href,
  highlight,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  href: string;
  highlight?: boolean;
}) {
  return (
    <Link href={href} className="cmms-card cmms-card-hover block p-5">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-medium text-stone-500">{label}</p>
        <div
          className={cn(
            'w-8 h-8 rounded-lg flex items-center justify-center',
            highlight ? 'bg-stone-800 text-white' : 'bg-stone-100 text-stone-400',
          )}
        >
          {icon}
        </div>
      </div>
      <p
        className={cn(
          'text-3xl font-bold tracking-tight',
          highlight ? 'text-stone-900' : 'text-stone-800',
        )}
      >
        {value}
      </p>
    </Link>
  );
}
