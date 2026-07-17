'use server';

import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { randomUUID } from 'crypto';
import { getContext, handleError, assertAuthorized, type ActionResult } from '@/lib/actions/utils';
import { meetingGuestImportQueue } from '@/lib/queue/meeting-guest-import.queue';
import { meetingGuestService } from '@/lib/domain/meeting-guest/service';
import { meetingGuestRepository } from '@/lib/domain/meeting-guest/repository';
import { guestService } from '@/lib/domain/guest/service';
import { revalidatePath } from 'next/cache';
import type { EntourageRole, GuestLevel } from '@/lib/generated/prisma/enums';

export async function uploadMeetingGuestImport(
  meetingId: string,
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

    await meetingGuestImportQueue.add('import', {
      filePath,
      meetingId,
      userId: session.user.id,
      jobId,
    });

    return { ok: true, data: { jobId } };
  } catch (e) {
    return handleError(e);
  }
}

export async function addGuestToMeeting(input: {
  meetingId: string;
  guestId: string;
  groupTags?: string[];
  primaryMeetingGuestId?: string;
  entourageRole?: EntourageRole;
  levelOverride?: GuestLevel;
  inheritLodging?: boolean;
  inheritTransport?: boolean;
}): Promise<ActionResult<{ id: string }>> {
  try {
    const { ability } = await getContext();
    if (!ability.can('create', 'MeetingGuest')) {
      return { ok: false, error: { code: 'FORBIDDEN', message: '无权添加会议嘉宾' } };
    }
    const mg = await meetingGuestService.create(input);
    revalidatePath(`/meetings/${input.meetingId}/guests`);
    return { ok: true, data: { id: mg.id } };
  } catch (e) {
    return handleError(e);
  }
}

export async function removeGuestFromMeeting(
  meetingGuestId: string,
  meetingId: string,
): Promise<ActionResult<{ id: string }>> {
  try {
    const { ability } = await getContext();
    if (!ability.can('delete', 'MeetingGuest')) {
      return { ok: false, error: { code: 'FORBIDDEN', message: '无权删除会议嘉宾' } };
    }
    await meetingGuestService.delete(meetingGuestId);
    revalidatePath(`/meetings/${meetingId}/guests`);
    return { ok: true, data: { id: meetingGuestId } };
  } catch (e) {
    return handleError(e);
  }
}

export async function updateMeetingGuest(
  meetingGuestId: string,
  meetingId: string,
  input: {
    entourageRole?: string | null;
    levelOverride?: string | null;
    inheritTransport?: boolean;
    inheritLodging?: boolean;
    groupTags?: string[];
  },
): Promise<ActionResult<{ id: string }>> {
  try {
    const { ability } = await getContext();
    assertAuthorized(ability, 'update', 'MeetingGuest');
    await meetingGuestRepository.update(meetingGuestId, {
      entourageRole: (input.entourageRole || null) as never,
      levelOverride: (input.levelOverride || null) as never,
      inheritTransport: input.inheritTransport,
      inheritLodging: input.inheritLodging,
      groupTags: input.groupTags,
    });
    revalidatePath(`/meetings/${meetingId}/guests`);
    return { ok: true, data: { id: meetingGuestId } };
  } catch (e) {
    return handleError(e);
  }
}

export async function searchGuestsForMeeting(
  query: string,
): Promise<
  ActionResult<Array<{ id: string; name: string; phone: string | null; company: string | null }>>
> {
  try {
    await getContext();
    const result = await guestService.list({ search: query, pageSize: 10 });
    return {
      ok: true,
      data: result.items.map((g) => ({
        id: g.id,
        name: g.name,
        phone: g.phone,
        company: g.company,
      })),
    };
  } catch (e) {
    return handleError(e);
  }
}
