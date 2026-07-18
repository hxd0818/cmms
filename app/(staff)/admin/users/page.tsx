import { auth } from '@/lib/auth/index';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db/client';
import { dict } from '@/lib/shared/dictionary';
import { UserManager } from './UserManager';

export default async function UsersPage() {
  const session = await auth();
  if (!session) redirect('/login');
  if (session.user.role !== 'SUPER_ADMIN') redirect('/dashboard');

  const users = await prisma.user.findMany({
    select: { id: true, email: true, name: true, role: true, createdAt: true },
    orderBy: { createdAt: 'asc' },
  });

  const plainUsers = users.map((u) => ({
    ...u,
    createdAt: u.createdAt.toISOString(),
  }));

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-xl font-bold">用户管理</h1>
        <p className="text-sm text-stone-400 mt-0.5">管理系统登录账号 · 共 {users.length} 个用户</p>
      </div>
      <UserManager users={plainUsers} />
    </div>
  );
}
