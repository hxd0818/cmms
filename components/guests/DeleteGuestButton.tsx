'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { deleteGuest } from '@/app/actions/guest.actions';
import { toast } from 'sonner';

export function DeleteGuestButton({ guestId, guestName }: { guestId: string; guestName: string }) {
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const router = useRouter();

  async function onConfirm() {
    setDeleting(true);
    const result = await deleteGuest(guestId);
    setDeleting(false);
    if (result.ok) {
      toast.success(`已删除嘉宾「${guestName}」`);
      router.push('/guests');
      router.refresh();
    } else {
      toast.error(result.error?.message ?? '删除失败');
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="destructive">删除</Button>} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>确认删除嘉宾</DialogTitle>
          <DialogDescription>
            将删除嘉宾「{guestName}」。此操作为软删除，可在数据库层面恢复。
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            取消
          </Button>
          <Button variant="destructive" onClick={onConfirm} disabled={deleting}>
            {deleting ? '删除中...' : '确认删除'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
