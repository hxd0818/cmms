'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { uploadGuestImport } from '@/app/actions/import.actions';
import { toast } from 'sonner';

export function ImportForm() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;
    setLoading(true);
    const fd = new FormData();
    fd.set('file', file);
    const result = await uploadGuestImport(fd);
    setLoading(false);
    if (result.ok) {
      toast.success(`导入任务已提交 (Job ID: ${result.data!.jobId.slice(0, 8)})，后台处理中`);
      setTimeout(() => router.push('/guests'), 2000);
    } else {
      toast.error(result.error?.message ?? '上传失败');
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 max-w-md">
      <div>
        <Label htmlFor="file">Excel 文件 (.xlsx)</Label>
        <Input
          id="file"
          type="file"
          accept=".xlsx"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          required
        />
      </div>
      <Button type="submit" disabled={!file || loading}>
        {loading ? '上传中...' : '上传并导入'}
      </Button>
    </form>
  );
}
