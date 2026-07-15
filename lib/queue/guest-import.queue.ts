import { defineQueue, registerWorker } from './index';
import { processGuestImport } from '@/lib/domain/guest/importer';
import { logger } from '@/lib/utils/logger';
import type { Job, Worker } from 'bullmq';

export interface GuestImportJobData {
  filePath: string;
  userId: string;
  jobId: string;
}

export const guestImportQueue = defineQueue<GuestImportJobData>('guest-import');

export function registerGuestImportWorker(): Worker<GuestImportJobData> {
  return registerWorker<GuestImportJobData>(
    'guest-import',
    async (job: Job<GuestImportJobData>) => {
      logger.info({ jobId: job.id, data: job.data }, 'processing guest import');
      const result = await processGuestImport(job.data);
      logger.info({ jobId: job.id, result }, 'guest import done');
    },
  );
}
