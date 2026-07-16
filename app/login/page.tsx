import { Suspense } from 'react';
import { LoginForm } from './LoginForm';

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center p-8">
      {/* Left side: brand panel */}
      <div className="w-full max-w-4xl flex rounded-2xl overflow-hidden" style={{ boxShadow: 'var(--shadow-md)' }}>
        <div
          className="hidden lg:flex flex-col justify-between w-2/5 p-10"
          style={{ background: 'var(--sidebar-bg)' }}
        >
          <div>
            <div className="flex items-center gap-2.5 mb-12">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xl text-white"
                style={{ background: 'rgba(255,255,255,0.12)' }}
              >
                C
              </div>
              <span className="text-white font-bold text-lg tracking-wide">CMMS</span>
            </div>
            <h2 className="text-white text-2xl font-bold leading-snug mb-3">
              会务管理系统
            </h2>
            <p className="text-teal-200/70 text-sm leading-relaxed">
              以接待运营为核心的通用会务管理平台。
              <br />
              覆盖接送、住宿、餐饮、礼品全链路。
            </p>
          </div>
          <p className="text-teal-300/40 text-xs">Conference Management &amp; Member Service</p>
        </div>

        {/* Right side: form */}
        <div className="flex-1 bg-white p-10 flex flex-col justify-center">
          <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--foreground)' }}>
            登录
          </h1>
          <p className="text-sm mb-8" style={{ color: 'var(--foreground-muted)' }}>
            请输入您的账号信息
          </p>
          <Suspense
            fallback={
              <div className="text-center" style={{ color: 'var(--foreground-muted)' }}>
                加载中...
              </div>
            }
          >
            <LoginForm />
          </Suspense>
        </div>
      </div>
    </main>
  );
}
