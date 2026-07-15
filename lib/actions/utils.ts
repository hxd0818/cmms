import { ZodError, type ZodSchema } from 'zod';
import { auth } from '@/lib/auth/index';
import {
  defineAbilityFor,
  type AppAbility,
  type AppSubject,
  type AppAction,
} from '@/lib/auth/abilities';
import { ForbiddenError, UnauthorizedError, AppError } from '@/lib/shared/errors';

export interface ActionResult<T> {
  ok: boolean;
  data?: T;
  error?: { code: string; message: string };
  errors?: Record<string, string[]>;
}

export async function getContext() {
  const session = await auth();
  if (!session?.user) throw new UnauthorizedError();

  const ability = defineAbilityFor({
    role: session.user.role,
  });

  return { session, ability };
}

export function assertAuthorized(
  ability: AppAbility,
  action: AppAction,
  subject: AppSubject,
) {
  if (!ability.can(action, subject)) {
    throw new ForbiddenError(`${action} ${subject}`);
  }
}

export function validate<T>(schema: ZodSchema<T>, input: unknown): T {
  return schema.parse(input);
}

export function handleError(error: unknown): ActionResult<never> {
  if (error instanceof ZodError) {
    return {
      ok: false,
      error: { code: 'VALIDATION_ERROR', message: '输入验证失败' },
      errors: error.flatten().fieldErrors as Record<string, string[]>,
    };
  }
  if (error instanceof ForbiddenError || error instanceof UnauthorizedError) {
    return { ok: false, error: { code: 'FORBIDDEN', message: error.message } };
  }
  if (error instanceof AppError) {
    return { ok: false, error: { code: error.code, message: error.message } };
  }
  console.error('[action] unexpected error', error);
  return { ok: false, error: { code: 'INTERNAL_ERROR', message: '服务器内部错误' } };
}
