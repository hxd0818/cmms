'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface NavGroup {
  label: string;
  items: { href: string; label: string }[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    label: '核心',
    items: [
      { href: '/dashboard', label: '控制台' },
      { href: '/guests', label: '嘉宾库' },
      { href: '/meetings', label: '会议管理' },
    ],
  },
  {
    label: '资源',
    items: [
      { href: '/hotels', label: '酒店管理' },
      { href: '/vehicles', label: '车辆资源' },
    ],
  },
  {
    label: '管理',
    items: [{ href: '/audit', label: '审计日志' }],
  },
];

function isPathActive(pathname: string, href: string): boolean {
  if (href === '/dashboard') return pathname === '/dashboard';
  return pathname.startsWith(href);
}

export function StaffNav() {
  const pathname = usePathname();

  return (
    <nav className="flex-1 px-2 overflow-y-auto">
      {NAV_GROUPS.map((group) => (
        <div key={group.label} className="mb-4">
          <p className="px-3 mb-1 text-[10px] font-semibold uppercase tracking-wider text-teal-300/40">
            {group.label}
          </p>
          <div className="space-y-0.5">
            {group.items.map((item) => {
              const active = isPathActive(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`cmms-nav-item ${active ? 'active' : ''} flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium`}
                  style={{
                    color: active ? '#ffffff' : 'rgba(209, 218, 216, 0.85)',
                  }}
                >
                  {active && <span className="w-1.5 h-1.5 rounded-full bg-teal-300 shrink-0" />}
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
