import { prisma } from '@/lib/db/client';
import { hashToken } from '@/lib/auth/tokens';
import { notFound } from 'next/navigation';
import { ManagePortal } from './ManagePortal';

interface Props {
  params: Promise<{ token: string }>;
}

export default async function ManagePage({ params }: Props) {
  const { token } = await params;
  const tokenHash = hashToken(token);

  const record = await prisma.guestManagerToken.findUnique({
    where: { tokenHash },
  });

  if (!record || record.revokedAt || record.expiresAt < new Date()) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-stone-50 p-6">
        <div className="text-center">
          <h1 className="text-xl font-bold text-stone-700">链接无效或已过期</h1>
          <p className="text-sm text-stone-400 mt-2">请联系会务组重新获取链接</p>
        </div>
      </main>
    );
  }

  const meeting = await prisma.meeting.findUnique({
    where: { id: record.meetingId },
    select: { id: true, name: true },
  });

  if (!meeting) notFound();

  return (
    <ManagePortal
      tokenHash={tokenHash}
      managerName={record.name}
      phoneLastFour={record.phone.slice(-4)}
      scope={record.scope}
      meetingName={meeting.name}
    />
  );
}
