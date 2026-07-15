import { PrismaClient } from '../generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { applyEncryptionExtension } from './prisma-extensions';

declare global {
  // Prisma singleton — preserved across HMR in dev
  var __cmmsPrisma: PrismaClient | undefined;
  var __cmmsPrismaBase: PrismaClient | undefined;
}

function createBaseClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL environment variable is not set');
  }
  const pool = new Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });
}

function createPrismaClient(): PrismaClient {
  const base = global.__cmmsPrismaBase ?? createBaseClient();
  if (process.env.NODE_ENV !== 'production') {
    global.__cmmsPrismaBase = base;
  }
  return applyEncryptionExtension(base);
}

export const prisma = global.__cmmsPrisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  global.__cmmsPrisma = prisma;
}
