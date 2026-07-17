import { auth } from '@/lib/auth/index';
import { redirect } from 'next/navigation';
import { StaffNav } from './StaffNav';
import { DictProvider } from '@/components/providers/DictProvider';
import { DICTIONARY, type DictKey } from '@/lib/shared/dictionary';
import { dictionaryService } from '@/lib/domain/dictionary/service';

export default async function StaffLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session) redirect('/login');

  // Load all dictionary labels from DB (with 1-min cache in service)
  const labels: Record<string, Record<string, string>> = {};
  for (const category of Object.keys(DICTIONARY) as DictKey[]) {
    try {
      labels[category] = await dictionaryService.getLabels(category);
    } catch {
      labels[category] = DICTIONARY[category];
    }
  }

  return (
    <div className="flex min-h-screen" style={{ background: 'var(--background)' }}>
      <aside
        className="w-60 flex flex-col shrink-0 border-r"
        style={{ background: 'var(--sidebar-bg)', borderColor: 'var(--border)' }}
      >
        {/* Brand */}
        <div className="px-5 pt-6 pb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-lg text-white shrink-0 bg-stone-900">
              C
            </div>
            <div>
              <h1 className="font-bold text-sm leading-tight tracking-wide text-stone-900">CMMS</h1>
              <p className="text-[11px] text-stone-400 leading-tight">会务管理系统</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <StaffNav />

        {/* User */}
        <div className="px-4 py-4 mt-auto border-t border-stone-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-stone-500 shrink-0 bg-stone-100">
              {session.user.name?.charAt(0) ?? '?'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-stone-800 text-xs font-medium truncate">{session.user.name}</p>
              <p className="text-stone-400 text-[10px]">
                {session.user.role === 'SUPER_ADMIN' ? '管理员' : '只读用户'}
              </p>
            </div>
            <form action="/api/auth/signout" method="post">
              <button
                type="submit"
                className="text-stone-400 hover:text-stone-600 transition-colors p-1"
                title="退出登录"
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
              </button>
            </form>
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-auto p-6 lg:p-8" style={{ background: 'var(--background)' }}>
        <DictProvider labels={labels}>{children}</DictProvider>
      </main>
    </div>
  );
}
