/**
 * Notification sender — Phase 3 stub.
 *
 * This is a placeholder interface for the future notification system.
 * It does NOT send real SMS. Each "send" is persisted as a PENDING log
 * entry, allowing downstream integrations (SMS gateway, email provider)
 * to pick up and dispatch via a worker.
 *
 * When a real provider is integrated, replace `dispatch()` with the
 * appropriate client call; keep the persistence step so that logs and
 * audit history remain intact.
 */
import { prisma } from '@/lib/db/client';
import { logger } from '@/lib/utils/logger';

export type NotificationChannel = 'SMS' | 'EMAIL' | 'WECHAT' | 'SYSTEM';

export interface SendParams {
  /** Template code (e.g. "guest.invite"). If unknown, the log stores null. */
  templateCode?: string;
  /** Meeting ID for grouping / filtering. */
  meetingId?: string;
  /** Recipient identifier (phone number for SMS, email for EMAIL, etc.). */
  recipient: string;
  /** Channel — defaults to SMS. */
  channel?: NotificationChannel;
  /** Rendered content (already substituted with variables). */
  content: string;
}

export interface SendResult {
  logId: string;
  status: 'PENDING' | 'SENT' | 'FAILED';
}

/**
 * Persist a notification request as a PENDING log entry.
 *
 * In the stub phase, the entry remains PENDING — no real dispatch happens.
 * A future worker will poll PENDING logs, call the provider, and update
 * the row to SENT/FAILED with sentAt.
 */
export async function send(params: SendParams): Promise<SendResult> {
  const channel = params.channel ?? 'SMS';

  let templateId: string | undefined;
  if (params.templateCode) {
    const template = await prisma.notificationTemplate.findUnique({
      where: { code: params.templateCode },
      select: { id: true, enabled: true },
    });
    if (template && !template.enabled) {
      logger.info(
        { templateCode: params.templateCode },
        'notification template disabled; skipping send',
      );
      return { logId: '', status: 'SENT' };
    }
    templateId = template?.id;
  }

  const log = await prisma.notificationLog.create({
    data: {
      templateId,
      meetingId: params.meetingId,
      recipient: params.recipient,
      channel,
      content: params.content,
      status: 'PENDING',
    },
  });

  logger.info(
    { logId: log.id, recipient: params.recipient, channel },
    'notification queued (stub mode)',
  );

  return { logId: log.id, status: 'PENDING' };
}

/**
 * Batch send helper — useful for meeting invitations where the same template
 * is rendered for many recipients. Returns one result per recipient.
 *
 * This is a simple loop rather than a transaction to keep individual send
 * failures isolated.
 */
export async function sendBatch(paramsList: SendParams[]): Promise<SendResult[]> {
  const results: SendResult[] = [];
  for (const params of paramsList) {
    try {
      results.push(await send(params));
    } catch (err) {
      logger.error(
        { err: err instanceof Error ? err.message : 'unknown', params },
        'notification batch item failed',
      );
      results.push({ logId: '', status: 'FAILED' });
    }
  }
  return results;
}

export const notificationSender = {
  send,
  sendBatch,
};
