import { MeetingForm } from '@/components/meetings/MeetingForm';

export default function NewMeetingPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">新建会议</h1>
      <MeetingForm mode="create" />
    </div>
  );
}
