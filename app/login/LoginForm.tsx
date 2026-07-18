'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

/**
 * Map known NextAuth error codes to user-facing Chinese messages.
 * Falls back to a generic invalid-credentials message for unknown codes.
 */
function resolveLoginErrorMessage(code: string | undefined): string {
  if (code === 'rate_limited') {
    return '登录尝试过多，请 5 分钟后再试';
  }
  return '邮箱或密码错误';
}

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const result = await signIn('credentials', {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      setError(resolveLoginErrorMessage(result.code));
      setLoading(false);
      return;
    }

    const callbackUrl = params.get('callbackUrl') ?? '/dashboard';
    router.push(callbackUrl);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <Label htmlFor="email">邮箱</Label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
        />
      </div>
      <div>
        <Label htmlFor="password">密码</Label>
        <Input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="current-password"
        />
      </div>
      {error && (
        <div className="rounded-lg bg-red-50 border border-red-100 px-3 py-2 text-sm text-red-600">
          {error}
        </div>
      )}
      <Button type="submit" disabled={loading} className="w-full h-10">
        {loading ? '登录中...' : '登录'}
      </Button>
      <p className="text-xs text-stone-400 text-center mt-1">
        默认账号 admin@cmms.local / admin123
      </p>
    </form>
  );
}
