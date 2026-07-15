import { prisma } from '@/lib/db/client';
import { logger } from '@/lib/utils/logger';
import type { ActorType } from '@/lib/generated/prisma/enums';

export async function logAction(params: {
  actorType: ActorType;
  actorId?: string;
  actorRole?: string;
  action: string;
  entityType: string;
  entityId: string;
  before?: unknown;
  after?: unknown;
  source?: string;
}) {
  try {
    await prisma.auditLog.create({
      data: {
        actorType: params.actorType,
        actorId: params.actorId,
        actorRole: params.actorRole,
        action: params.action,
        entityType: params.entityType,
        entityId: params.entityId,
        before: params.before as never,
        after: params.after as never,
        source: params.source,
      },
    });
  } catch (e) {
    // Audit logging should never break the main operation
    logger.error({ err: e instanceof Error ? e.message : 'unknown', params }, 'audit log failed');
  }
}

export const auditService = {
  async list(params: {
    entityType?: string;
    actorId?: string;
    action?: string;
    page?: number;
    pageSize?: number;
  }) {
    const { entityType, actorId, action, page = 1, pageSize = 50 } = params;
    const where: Record<string, unknown> = {};
    if (entityType) where.entityType = entityType;
    if (actorId) where.actorId = actorId;
    if (action) where.action = action;

    const [items, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.auditLog.count({ where }),
    ]);

    return { items, total, page, pageSize };
  },

  async getByEntity(entityType: string, entityId: string) {
    return prisma.auditLog.findMany({
      where: { entityType, entityId },
      orderBy: { createdAt: 'desc' },
    });
  },
};
