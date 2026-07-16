import { auth } from '@/lib/auth/index';
import { redirect } from 'next/navigation';
import { StaffNav } from './StaffNav';

export default async function StaffLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session) redirect('/login');

  return (
    <div className="flex min-h-screen">
      <aside className="w-60 flex flex-col shrink-0" style={{ background: 'var(--sidebar-bg)' }}>
        {/* Brand */}
        <div className="px-5 pt-6 pb-5">
          <div className="flex items-center gap-2.5">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-lg text-white shrink-0"
              style={{ background: 'rgba(255,255,255,0.1)' }}
            >
              C
            </div>
            <div>
              <h1 className="text-white font-bold text-sm leading-tight tracking-wide">CMMS</h1>
              <p className="text-[11px] text-teal-200/60 leading-tight">会务管理系统</p>
            </div>
          </div>
        </div>

        {/* Navigation (client component for active state) */}
        <StaffNav />

        {/* User */}
        <div className="px-4 py-4 mt-auto border-t border-white/10">
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-teal-100 shrink-0"
              style={{ background: 'rgba(255,255,255,0.1)' }}
            >
              {session.user.name?.charAt(0) ?? '?'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-white text-xs font-medium truncate">{session.user.name}</p>
              <p className="text-teal-300/50 text-[10px]">
                {session.user.role === 'SUPER_ADMIN' ? '管理员' : '只读用户'}
              </p>
            </div>
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-auto" style={{ background: 'var(--background)' }}>
        {children}
      </main>
    </div>
  );
}
