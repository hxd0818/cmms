import { auth } from '@/lib/auth/index';
import { redirect } from 'next/navigation';
import { reportService } from '@/lib/domain/report/service';
import Link from 'next/link';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

const STATUS_LABEL: Record<string, string> = {
  DRAFT: '草稿',
  PLANNING: '筹备中',
  ONGOING: '进行中',
  COMPLETED: '已结束',
  CANCELED: '已取消',
};

const STATUS_COLOR: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-700',
  PLANNING: 'bg-blue-100 text-blue-800',
  ONGOING: 'bg-green-100 text-green-800',
  COMPLETED: 'bg-slate-100 text-slate-700',
  CANCELED: 'bg-red-100 text-red-800',
};

export default async function DashboardPage() {
  const session = await auth();
  if (!session) redirect('/login');

  const stats = await reportService.getDashboardStats();

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--foreground)' }}>
        控制台
      </h1>
      <p className="text-sm mb-8" style={{ color: 'var(--foreground-muted)' }}>
        欢迎回来，{session.user.name}
      </p>

      <div className="grid grid-cols-3 gap-4 mb-8">
        <StatCard label="嘉宾总数" value={stats.totalGuests} href="/guests" />
        <StatCard label="会议总数" value={stats.totalMeetings} href="/meetings" />
        <StatCard
          label="进行中会议"
          value={stats.ongoingMeetings}
          href="/meetings?status=ONGOING"
        />
      </div>

      <div>
        <h2 className="text-base font-semibold mb-3" style={{ color: 'var(--foreground)' }}>
          近期会议
        </h2>
        <div className="space-y-2">
          {stats.upcoming.length === 0 ? (
            <p className="text-sm" style={{ color: 'var(--foreground-muted)' }}>
              未来 30 天无计划会议
            </p>
          ) : (
            stats.upcoming.map((m) => (
              <Link
                key={m.id}
                href={`/meetings/${m.id}`}
                className="cmms-card cmms-card-hover block p-4 transition-all"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-medium text-sm">{m.name}</span>
                    <span className="text-sm ml-2" style={{ color: 'var(--foreground-muted)' }}>
                      {new Date(m.startAt).toLocaleDateString('zh-CN')}
                    </span>
                  </div>
                  <Badge className={STATUS_COLOR[m.status]} variant="secondary">
                    {STATUS_LABEL[m.status]}
                  </Badge>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>

      <div className="mt-6">
        <Link href="/meetings/new" className={cn(buttonVariants())}>
          新建会议
        </Link>
      </div>
    </div>
  );
}

function StatCard({ label, value, href }: { label: string; value: number; href: string }) {
  return (
    <Link
      href={href}
      className="cmms-card cmms-card-hover block p-5 transition-all"
    >
      <p className="text-sm" style={{ color: 'var(--foreground-muted)' }}>
        {label}
      </p>
      <p className="text-3xl font-bold mt-1" style={{ color: 'var(--primary)' }}>
        {value}
      </p>
    </Link>
  );
}
