import { Suspense } from 'react';
import { LoginForm } from './LoginForm';

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center p-8">
      <div className="w-full max-w-md">
        <h1 className="mb-6 text-2xl font-bold text-center">CMMS 登录</h1>
        <Suspense fallback={<div className="text-center text-gray-500">加载中...</div>}>
          <LoginForm />
        </Suspense>
      </div>
    </main>
  );
}
