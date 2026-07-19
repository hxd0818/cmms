import type { PrismaClient } from '../generated/prisma/client';
import { encrypt, decrypt } from './field-encryption';

/**
 * Fields to encrypt at rest, keyed by model name.
 * Read/write transparent via Prisma $extends query interceptor.
 */
const ENCRYPTED_FIELDS: Record<string, string[]> = {
  Guest: ['phone', 'idNumber'],
};

// Flat set of all encrypted field names for recursive nested-object scanning
const ALL_ENCRYPTED_FIELDS = new Set(Object.values(ENCRYPTED_FIELDS).flat());

type AnyArgs = { data?: unknown; where?: Record<string, unknown> };

function encryptFieldsOn<T>(model: string, payload: T): T {
  const fields = ENCRYPTED_FIELDS[model];
  if (!fields || payload == null) return payload;
  if (typeof payload !== 'object') return payload;
  const record = payload as Record<string, unknown>;
  for (const f of fields) {
    if (record[f] != null && record[f] !== '') {
      record[f] = encrypt(record[f] as string);
    }
  }
  return payload;
}

/**
 * Recursively decrypts known encrypted fields in any result object,
 * including nested Prisma include relations. Handles the case where
 * the top-level model (e.g. MeetingGuest) includes a nested model
 * with encrypted fields (e.g. Guest.phone).
 */
function decryptFieldsOn<T>(model: string, payload: T): T {
  return decryptRecursive(payload) as T;
}

function decryptRecursive(obj: unknown): unknown {
  if (obj == null) return obj;
  if (Array.isArray(obj)) return obj.map(decryptRecursive);
  if (typeof obj !== 'object') return obj;

  const record = obj as Record<string, unknown>;
  for (const key of Object.keys(record)) {
    const val = record[key];
    if (val == null) continue;

    if (ALL_ENCRYPTED_FIELDS.has(key) && typeof val === 'string' && val.startsWith('enc:')) {
      record[key] = decrypt(val);
    } else if (typeof val === 'object') {
      record[key] = decryptRecursive(val);
    }
  }
  return obj;
}

export function applyEncryptionExtension(client: PrismaClient): PrismaClient {
  return client.$extends({
    query: {
      $allModels: {
        async create({ model, args, query }) {
          const a = args as AnyArgs;
          if (a.data) encryptFieldsOn(model, a.data);
          const result = await query(args);
          decryptFieldsOn(model, result);
          return result;
        },
        async createMany({ model, args, query }) {
          const a = args as { data: unknown[] | Record<string, unknown> };
          if (Array.isArray(a.data)) {
            a.data = a.data.map((row) => encryptFieldsOn(model, row));
          } else if (a.data) {
            encryptFieldsOn(model, a.data);
          }
          return query(args);
        },
        async update({ model, args, query }) {
          const a = args as AnyArgs;
          if (a.data) encryptFieldsOn(model, a.data);
          const result = await query(args);
          decryptFieldsOn(model, result);
          return result;
        },
        async updateMany({ model, args, query }) {
          const a = args as AnyArgs;
          if (a.data) encryptFieldsOn(model, a.data);
          return query(args);
        },
        async upsert({ model, args, query }) {
          const a = args as {
            create: Record<string, unknown>;
            update: Record<string, unknown>;
          };
          encryptFieldsOn(model, a.create);
          encryptFieldsOn(model, a.update);
          const result = await query(args);
          decryptFieldsOn(model, result);
          return result;
        },
        async findMany({ model, args, query }) {
          const result = await query(args);
          if (Array.isArray(result)) {
            return result.map((row) => decryptFieldsOn(model, row));
          }
          return result;
        },
        async findUnique({ model, args, query }) {
          const result = await query(args);
          decryptFieldsOn(model, result);
          return result;
        },
        async findFirst({ model, args, query }) {
          const result = await query(args);
          decryptFieldsOn(model, result);
          return result;
        },
      },
    },
  }) as PrismaClient;
}
