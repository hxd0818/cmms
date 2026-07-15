import { GuestForm } from '@/components/guests/GuestForm';

export default function NewGuestPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">新增嘉宾</h1>
      <GuestForm mode="create" />
    </div>
  );
}
