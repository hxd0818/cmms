import { guestService } from '@/lib/domain/guest/service';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { buttonVariants } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { DeleteGuestButton } from '@/components/guests/DeleteGuestButton';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function GuestDetailPage({ params }: PageProps) {
  const { id } = await params;
  let guest;
  try {
    guest = await guestService.findById(id);
  } catch {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">{guest.name}</h1>
          <p className="text-sm text-slate-500 mt-1">
            {guest.company ?? '-'} {guest.title ? `· ${guest.title}` : ''}
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href={`/guests/${guest.id}/edit`}
            className={cn(buttonVariants({ variant: 'outline' }))}
          >
            编辑
          </Link>
          <DeleteGuestButton guestId={guest.id} guestName={guest.name} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 cmms-card p-6">
        <Field label="等级">
          <Badge variant="secondary">{guest.level}</Badge>
        </Field>
        <Field label="性别">{guest.gender ?? '-'}</Field>
        <Field label="手机">{guest.phone ?? '-'}</Field>
        <Field label="邮箱">{guest.email ?? '-'}</Field>
        <Field label="身份证">{guest.idNumber ?? '-'}</Field>
        <Field label="饮食标签">{(guest.dietaryTags ?? []).join(', ') || '-'}</Field>
        <Field label="创建时间">{new Date(guest.createdAt).toLocaleString('zh-CN')}</Field>
        <Field label="更新时间">{new Date(guest.updatedAt).toLocaleString('zh-CN')}</Field>
        <Field label="备注" full>
          {guest.notes ?? '-'}
        </Field>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
  full,
}: {
  label: string;
  children: React.ReactNode;
  full?: boolean;
}) {
  return (
    <div className={full ? 'col-span-2' : ''}>
      <p className="text-xs text-slate-500 mb-1">{label}</p>
      <div className="text-sm">{children}</div>
    </div>
  );
}
