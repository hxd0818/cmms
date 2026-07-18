'use server';

import { z } from 'zod';
import { prisma } from '@/lib/db/client';
import {
  assertAuthorized,
  getContext,
  handleError,
  validate,
  type ActionResult,
} from '@/lib/actions/utils';
import { auditLog } from '@/lib/audit/logger';
import { revalidatePath } from 'next/cache';
import { NotFoundError, ConflictError } from '@/lib/shared/errors';

const VALID_ROLES = [
  'OWNER',
  'RECEPTION_LEAD',
  'RECEPTION_STAFF',
  'TRANSPORT_LEAD',
  'TRANSPORT_STAFF',
  'LODGING_LEAD',
  'CATERING_LEAD',
  'GIFT_LEAD',
  'FINANCE',
  'STAFF',
] as const;

const addStaffSchema = z.object({
  meetingId: z.string().min(1),
  userId: z.string().min(1),
  role: z.enum(VALID_ROLES),
});

const updateStaffRoleSchema = z.object({
  meetingId: z.string().min(1),
  userId: z.string().min(1),
  role: z.enum(VALID_ROLES),
});

export type StaffListItem = {
  id: string;
  role: string;
  createdAt: Date;
  user: { id: string; name: string; email: string; role: string };
};

export async function listStaff(meetingId: string): Promise<ActionResult<StaffListItem[]>> {
  try {
    await getContext();
    const staff = await prisma.meetingStaff.findMany({
      where: { meetingId },
      include: {
        user: {
          select: { id: true, name: true, email: true, role: true },
        },
      },
      orderBy: [{ createdAt: 'asc' }],
    });
    return { ok: true, data: staff };
  } catch (e) {
    return handleError(e);
  }
}

export async function addStaff(input: {
  meetingId: string;
  userId: string;
  role: string;
}): Promise<ActionResult<{ id: string }>> {
  try {
    const { session, ability } = await getContext();
    assertAuthorized(ability, 'manage', 'all');

    const data = validate(addStaffSchema, input);

    const [meeting, user] = await Promise.all([
      prisma.meeting.findUnique({ where: { id: data.meetingId }, select: { id: true } }),
      prisma.user.findUnique({ where: { id: data.userId }, select: { id: true } }),
    ]);
    if (!meeting) throw new NotFoundError('Meeting', data.meetingId);
    if (!user) throw new NotFoundError('User', data.userId);

    const existing = await prisma.meetingStaff.findUnique({
      where: { meetingId_userId: { meetingId: data.meetingId, userId: data.userId } },
    });
    if (existing) {
      throw new ConflictError('该用户已是会议工作人员');
    }

    const staff = await prisma.meetingStaff.create({
      data: {
        meetingId: data.meetingId,
        userId: data.userId,
        role: data.role,
      },
    });
    await auditLog(session, 'assign', 'MeetingStaff', staff.id, {
      after: { meetingId: data.meetingId, userId: data.userId, role: data.role },
    });
    revalidatePath(`/meetings/${data.meetingId}/staff`);
    return { ok: true, data: { id: staff.id } };
  } catch (e) {
    return handleError(e);
  }
}

export async function removeStaff(
  meetingId: string,
  userId: string,
): Promise<ActionResult<{ id: string }>> {
  try {
    const { session, ability } = await getContext();
    assertAuthorized(ability, 'manage', 'all');

    const existing = await prisma.meetingStaff.findUnique({
      where: { meetingId_userId: { meetingId, userId } },
    });
    if (!existing) throw new NotFoundError('MeetingStaff', `${meetingId}/${userId}`);

    await prisma.meetingStaff.delete({
      where: { meetingId_userId: { meetingId, userId } },
    });
    await auditLog(session, 'unassign', 'MeetingStaff', existing.id, {
      before: { meetingId, userId, role: existing.role },
    });
    revalidatePath(`/meetings/${meetingId}/staff`);
    return { ok: true, data: { id: existing.id } };
  } catch (e) {
    return handleError(e);
  }
}

export async function updateStaffRole(input: {
  meetingId: string;
  userId: string;
  role: string;
}): Promise<ActionResult<{ id: string }>> {
  try {
    const { session, ability } = await getContext();
    assertAuthorized(ability, 'manage', 'all');

    const data = validate(updateStaffRoleSchema, input);

    const existing = await prisma.meetingStaff.findUnique({
      where: { meetingId_userId: { meetingId: data.meetingId, userId: data.userId } },
    });
    if (!existing) {
      throw new NotFoundError('MeetingStaff', `${data.meetingId}/${data.userId}`);
    }

    const updated = await prisma.meetingStaff.update({
      where: { meetingId_userId: { meetingId: data.meetingId, userId: data.userId } },
      data: { role: data.role },
    });
    await auditLog(session, 'update-role', 'MeetingStaff', updated.id, {
      before: { role: existing.role },
      after: { role: data.role },
    });
    revalidatePath(`/meetings/${data.meetingId}/staff`);
    return { ok: true, data: { id: updated.id } };
  } catch (e) {
    return handleError(e);
  }
}
