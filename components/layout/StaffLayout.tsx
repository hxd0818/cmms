import Link from 'next/link';
import { auth } from '@/lib/auth/index';
import { redirect } from 'next/navigation';

const NAV_ITEMS = [
  { href: '/dashboard', label: '控制台' },
  { href: '/guests', label: '嘉宾库' },
  { href: '/meetings', label: '会议管理' },
];

export default async function StaffLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session) redirect('/login');

  return (
    <div className="flex min-h-screen">
      <aside className="w-56 bg-slate-900 text-slate-100 p-4 flex flex-col">
        <div className="mb-6">
          <h1 className="text-lg font-bold">CMMS</h1>
          <p className="text-xs text-slate-400">会务管理系统</p>
        </div>
        <nav className="space-y-1 flex-1">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block px-3 py-2 rounded text-sm hover:bg-slate-800"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="text-xs">
          <p className="font-medium">{session.user.name}</p>
          <p className="text-slate-400">{session.user.role}</p>
        </div>
      </aside>
      <main className="flex-1 p-8 bg-slate-50">{children}</main>
    </div>
  );
}
