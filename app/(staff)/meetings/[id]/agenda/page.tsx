import { agendaService } from '@/lib/domain/agenda/service';
import { meetingGuestService } from '@/lib/domain/meeting-guest/service';
import { notFound } from 'next/navigation';
import { AgendaTimeline } from './AgendaTimeline';
import { AgendaForm } from './AgendaForm';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function AgendaPage({ params }: PageProps) {
  const { id } = await params;

  let items;
  let meetingGuests;
  try {
    [items, meetingGuests] = await Promise.all([
      agendaService.listByMeeting(id),
      meetingGuestService.listByMeeting({ meetingId: id, pageSize: 500 }),
    ]);
  } catch {
    notFound();
  }

  const speakerOptions = meetingGuests.map((mg) => ({
    id: mg.id,
    label: mg.guest.name,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">议程管理</h1>
          <p className="text-sm text-slate-500">共 {items.length} 项议程</p>
        </div>
      </div>

      <AgendaForm meetingId={id} speakerOptions={speakerOptions} />

      <AgendaTimeline items={items} meetingId={id} speakerOptions={speakerOptions} />
    </div>
  );
}
