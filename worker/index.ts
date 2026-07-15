import 'dotenv/config';
import { logger } from '@/lib/utils/logger';

async function main() {
  logger.info('CMMS worker starting (placeholder)');

  // BullMQ workers will be registered here in Phase 1 Task 1.11 (Guest Excel import)
  // Example:
  //   import { registerGuestImportWorker } from '@/lib/queue/guest-import.queue';
  //   registerGuestImportWorker();

  const shutdown = async (signal: string) => {
    logger.info({ signal }, 'shutting down worker...');
    process.exit(0);
  };
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));

  // Keep process alive
  setInterval(() => {}, 1 << 30);
}

main().catch((err) => {
  logger.error({ err: err.message }, 'worker fatal');
  process.exit(1);
});
