'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  CalendarDays,
  Hotel,
  Car,
  ScrollText,
  type LucideIcon,
} from 'lucide-react';

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    label: '核心业务',
    items: [
      { href: '/dashboard', label: '控制台', icon: LayoutDashboard },
      { href: '/guests', label: '嘉宾库', icon: Users },
      { href: '/meetings', label: '会议管理', icon: CalendarDays },
    ],
  },
  {
    label: '资源管理',
    items: [
      { href: '/hotels', label: '酒店', icon: Hotel },
      { href: '/vehicles', label: '车辆', icon: Car },
    ],
  },
  {
    label: '系统',
    items: [{ href: '/audit', label: '审计日志', icon: ScrollText }],
  },
];

function isPathActive(pathname: string, href: string): boolean {
  if (href === '/dashboard') return pathname === '/dashboard';
  return pathname.startsWith(href);
}

export function StaffNav() {
  const pathname = usePathname();

  return (
    <nav className="flex-1 px-3 overflow-y-auto pt-2">
      {NAV_GROUPS.map((group) => (
        <div key={group.label} className="mb-5">
          <p className="px-3 mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-stone-400">
            {group.label}
          </p>
          <div className="space-y-0.5">
            {group.items.map((item) => {
              const active = isPathActive(pathname, item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`cmms-nav-item ${active ? 'active' : ''} flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium`}
                  style={{
                    color: active ? '#1c1917' : '#78716c',
                  }}
                >
                  <Icon
                    size={16}
                    strokeWidth={active ? 2.25 : 1.75}
                    style={{ opacity: active ? 1 : 0.65 }}
                  />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}
