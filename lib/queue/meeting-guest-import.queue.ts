import { defineQueue, registerWorker } from './index';
import { processMeetingGuestImport } from '@/lib/domain/meeting-guest/importer';
import { logger } from '@/lib/utils/logger';
import type { Job, Worker } from 'bullmq';

export interface MeetingGuestImportJobData {
  filePath: string;
  meetingId: string;
  userId: string;
  jobId: string;
}

export const meetingGuestImportQueue = defineQueue<MeetingGuestImportJobData>(
  'meeting-guest-import',
);

export function registerMeetingGuestImportWorker(): Worker<MeetingGuestImportJobData> {
  return registerWorker<MeetingGuestImportJobData>(
    'meeting-guest-import',
    async (job: Job<MeetingGuestImportJobData>) => {
      logger.info({ jobId: job.id, data: job.data }, 'processing meeting-guest import');
      const result = await processMeetingGuestImport(job.data);
      logger.info({ jobId: job.id, result }, 'meeting-guest import done');
    },
  );
}
