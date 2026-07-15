import 'dotenv/config';
import { logger } from '@/lib/utils/logger';
import { registerGuestImportWorker } from '@/lib/queue/guest-import.queue';
import { registerMeetingGuestImportWorker } from '@/lib/queue/meeting-guest-import.queue';
import type { Worker } from 'bullmq';

async function main() {
  logger.info('CMMS worker starting');

  const workers: Worker[] = [
    registerGuestImportWorker(),
    registerMeetingGuestImportWorker(),
  ];

  logger.info({ count: workers.length, names: workers.map((w) => w.name) }, 'workers registered');

  const shutdown = async (signal: string) => {
    logger.info({ signal }, 'shutting down workers...');
    await Promise.allSettled(workers.map((w) => w.close()));
    process.exit(0);
  };
  process.on('SIGINT', () => void shutdown('SIGINT'));
  process.on('SIGTERM', () => void shutdown('SIGTERM'));

  // Keep process alive
  setInterval(() => {}, 1 << 30);
}

main().catch((err) => {
  logger.error({ err: err.message }, 'worker fatal');
  process.exit(1);
});
