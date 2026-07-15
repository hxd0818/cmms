import { auth } from '@/lib/auth/index';
import { redirect } from 'next/navigation';

export default async function DashboardPage() {
  const session = await auth();
  if (!session) redirect('/login');

  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold mb-4">控制台</h1>
      <p className="text-gray-600">
        欢迎, {session.user.name} ({session.user.role})
      </p>
    </main>
  );
}
