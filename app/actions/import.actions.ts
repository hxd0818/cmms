'use server';

import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { getContext, handleError, type ActionResult } from '@/lib/actions/utils';
import { guestImportQueue } from '@/lib/queue/guest-import.queue';
import { randomUUID } from 'crypto';

export async function uploadGuestImport(
  formData: FormData,
): Promise<ActionResult<{ jobId: string }>> {
  try {
    const { session } = await getContext();
    const file = formData.get('file') as File | null;
    if (!file) {
      return { ok: false, error: { code: 'NO_FILE', message: '请选择文件' } };
    }
    if (!file.name.endsWith('.xlsx')) {
      return { ok: false, error: { code: 'BAD_TYPE', message: '仅支持 .xlsx 文件' } };
    }

    const uploadDir = path.join(process.cwd(), 'tmp', 'uploads');
    await mkdir(uploadDir, { recursive: true });
    const jobId = randomUUID();
    const filePath = path.join(uploadDir, `${jobId}.xlsx`);
    const buf = Buffer.from(await file.arrayBuffer());
    await writeFile(filePath, buf);

    await guestImportQueue.add('import', {
      filePath,
      userId: session.user.id,
      jobId,
    });

    return { ok: true, data: { jobId } };
  } catch (e) {
    return handleError(e);
  }
}
