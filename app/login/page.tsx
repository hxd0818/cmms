import { Suspense } from 'react';
import { LoginForm } from './LoginForm';

export default function LoginPage() {
  return (
    <main
      className="flex min-h-screen items-center justify-center p-6"
      style={{ background: 'var(--sidebar-bg)' }}
    >
      <div className="w-full max-w-sm">
        {/* Brand */}
        <div className="text-center mb-8">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center font-bold text-2xl text-white mx-auto mb-4"
            style={{ background: 'rgba(255,255,255,0.12)' }}
          >
            C
          </div>
          <h1 className="text-white text-xl font-bold">CMMS 会务管理系统</h1>
          <p className="text-teal-200/50 text-sm mt-1">
            Conference Management &amp; Member Service
          </p>
        </div>

        {/* Login card */}
        <div className="cmms-card p-7">
          <Suspense
            fallback={
              <div className="text-center text-sm" style={{ color: 'var(--foreground-muted)' }}>
                加载中...
              </div>
            }
          >
            <LoginForm />
          </Suspense>
        </div>

        <p className="text-center text-teal-200/30 text-xs mt-6">内部系统，请使用授权账号登录</p>
      </div>
    </main>
  );
}
