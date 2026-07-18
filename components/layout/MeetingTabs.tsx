'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const TABS = [
  { key: 'detail', label: '详情', path: '' },
  { key: 'guests', label: '嘉宾', path: '/guests' },
  { key: 'agenda', label: '议程', path: '/agenda' },
  { key: 'reception', label: '签到', path: '/reception' },
  { key: 'transport', label: '接送', path: '/transport' },
  { key: 'lodging', label: '住宿', path: '/lodging' },
  { key: 'catering', label: '餐饮', path: '/catering' },
  { key: 'gifts', label: '礼品', path: '/gifts' },
  { key: 'companions', label: '接待', path: '/companions' },
  { key: 'fees', label: '费用', path: '/fees' },
  { key: 'staff', label: '人员', path: '/staff' },
  { key: 'resources', label: '资源', path: '/resources' },
] as const;

export function MeetingTabs({
  meetingId,
  meetingName,
}: {
  meetingId: string;
  meetingName?: string;
}) {
  const pathname = usePathname();
  const basePath = '/meetings/' + meetingId;

  function isActive(tabPath: string): boolean {
    if (tabPath === '') {
      return pathname === basePath;
    }
    return pathname.startsWith(basePath + tabPath);
  }

  return (
    <div className="mb-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-xs text-stone-400 mb-3">
        <Link href="/meetings" className="hover:text-stone-600">
          会议管理
        </Link>
        <span>/</span>
        <span className="text-stone-600 font-medium">{meetingName ?? '会议详情'}</span>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-stone-200 overflow-x-auto">
        {TABS.map((tab) => {
          const active = isActive(tab.path);
          const href = basePath + tab.path;
          return (
            <Link
              key={tab.key}
              href={href}
              className={cn(
                'px-3 py-2 text-[13px] font-medium whitespace-nowrap border-b-2 -mb-px transition-colors',
                active
                  ? 'border-stone-800 text-stone-800'
                  : 'border-transparent text-stone-400 hover:text-stone-600',
              )}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
