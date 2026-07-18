'use server';

import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db/client';
import { getContext, handleError, assertAuthorized, type ActionResult } from '@/lib/actions/utils';
import { revalidatePath } from 'next/cache';

export async function listUsers(): Promise<
  ActionResult<Array<{ id: string; email: string; name: string; role: string; createdAt: Date }>>
> {
  try {
    await getContext();
    const users = await prisma.user.findMany({
      select: { id: true, email: true, name: true, role: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
    });
    return { ok: true, data: users };
  } catch (e) {
    return handleError(e);
  }
}

export async function createUser(input: {
  email: string;
  name: string;
  password: string;
  role: string;
}): Promise<ActionResult<{ id: string }>> {
  try {
    const { ability } = await getContext();
    assertAuthorized(ability, 'manage', 'all');

    const existing = await prisma.user.findUnique({ where: { email: input.email } });
    if (existing) {
      return { ok: false, error: { code: 'CONFLICT', message: '邮箱已存在' } };
    }

    const passwordHash = await bcrypt.hash(input.password, 12);
    const user = await prisma.user.create({
      data: {
        email: input.email,
        name: input.name,
        passwordHash,
        role: input.role as 'SUPER_ADMIN' | 'VIEWER',
      },
    });
    revalidatePath('/admin/users');
    return { ok: true, data: { id: user.id } };
  } catch (e) {
    return handleError(e);
  }
}

export async function updateUser(
  id: string,
  input: {
    name?: string;
    role?: string;
    password?: string;
  },
): Promise<ActionResult<{ id: string }>> {
  try {
    const { ability } = await getContext();
    assertAuthorized(ability, 'manage', 'all');

    const data: { name?: string; role?: 'SUPER_ADMIN' | 'VIEWER'; passwordHash?: string } = {};
    if (input.name) data.name = input.name;
    if (input.role) data.role = input.role as 'SUPER_ADMIN' | 'VIEWER';
    if (input.password) data.passwordHash = await bcrypt.hash(input.password, 12);

    await prisma.user.update({ where: { id }, data });
    revalidatePath('/admin/users');
    return { ok: true, data: { id } };
  } catch (e) {
    return handleError(e);
  }
}

export async function deleteUser(id: string): Promise<ActionResult<{ id: string }>> {
  try {
    const { ability, session } = await getContext();
    assertAuthorized(ability, 'manage', 'all');

    if (session?.user?.id === id) {
      return { ok: false, error: { code: 'BAD_REQUEST', message: '不能删除自己' } };
    }

    await prisma.user.delete({ where: { id } });
    revalidatePath('/admin/users');
    return { ok: true, data: { id } };
  } catch (e) {
    return handleError(e);
  }
}
