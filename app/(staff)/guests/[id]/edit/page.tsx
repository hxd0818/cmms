import { guestService } from '@/lib/domain/guest/service';
import { GuestForm } from '@/components/guests/GuestForm';
import { notFound } from 'next/navigation';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditGuestPage({ params }: PageProps) {
  const { id } = await params;
  let guest;
  try {
    guest = await guestService.findById(id);
  } catch {
    notFound();
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">编辑嘉宾</h1>
      <GuestForm
        mode="edit"
        guestId={guest.id}
        defaultValues={{
          name: guest.name,
          gender: guest.gender ?? undefined,
          phone: guest.phone ?? undefined,
          email: guest.email ?? undefined,
          company: guest.company ?? undefined,
          title: guest.title ?? undefined,
          level: guest.level,
          idNumber: guest.idNumber ?? undefined,
          notes: guest.notes ?? undefined,
        }}
      />
    </div>
  );
}
