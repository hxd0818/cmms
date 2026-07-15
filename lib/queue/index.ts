import { Queue, Worker, type Job } from 'bullmq';
import IORedis from 'ioredis';
import { logger } from '@/lib/utils/logger';

let connection: IORedis | null = null;

export function getConnection(): IORedis {
  if (!connection) {
    const url = process.env.REDIS_URL ?? 'redis://localhost:6381';
    connection = new IORedis(url, { maxRetriesPerRequest: null });
  }
  return connection;
}

export function defineQueue<T>(name: string) {
  return new Queue<T>(name, { connection: getConnection() });
}

export function registerWorker<T>(
  name: string,
  handler: (job: Job<T>) => Promise<void>,
): Worker<T> {
  const worker = new Worker<T>(name, async (job) => handler(job), {
    connection: getConnection(),
  });
  worker.on('failed', (job, err) => {
    logger.error({ jobId: job?.id, err: err.message }, 'job failed');
  });
  return worker;
}
