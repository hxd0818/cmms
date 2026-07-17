import { prisma } from '@/lib/db/client';
import { DICTIONARY, type DictKey } from '@/lib/shared/dictionary';

// In-memory cache (cleared on server restart / revalidate)
let cache: Map<string, Map<string, string>> | null = null;
let cacheTime = 0;
const CACHE_TTL = 60_000; // 1 minute

async function loadFromDB(): Promise<Map<string, Map<string, string>>> {
  const entries = await prisma.dictionaryEntry.findMany({
    where: { isVisible: true },
    orderBy: [{ sortOrder: 'asc' }],
  });

  const map = new Map<string, Map<string, string>>();
  for (const e of entries) {
    if (!map.has(e.category)) map.set(e.category, new Map());
    map.get(e.category)!.set(e.key, e.label);
  }
  return map;
}

async function getCache(): Promise<Map<string, Map<string, string>>> {
  const now = Date.now();
  if (cache && now - cacheTime < CACHE_TTL) return cache;
  cache = await loadFromDB();
  cacheTime = now;
  return cache;
}

export const dictionaryService = {
  /** Get label from DB (falls back to code default) */
  async getLabel(category: string, key: string): Promise<string> {
    const c = await getCache();
    return c.get(category)?.get(key) ?? DICTIONARY[category as DictKey]?.[key] ?? key;
  },

  /** Get all labels for a category as {key: label} map */
  async getLabels(category: string): Promise<Record<string, string>> {
    const c = await getCache();
    const dbMap = c.get(category);
    const codeMap = DICTIONARY[category as DictKey] ?? {};
    const result: Record<string, string> = {};
    // Start with code defaults, override with DB values
    for (const [k, v] of Object.entries(codeMap)) {
      result[k] = dbMap?.get(k) ?? v;
    }
    // Add any DB-only keys
    if (dbMap) {
      for (const [k, v] of dbMap) {
        if (!result[k]) result[k] = v;
      }
    }
    return result;
  },

  /** Get options array [{value, label}] for Select components */
  async getOptions(category: string): Promise<Array<{ value: string; label: string }>> {
    const labels = await this.getLabels(category);
    return Object.entries(labels).map(([value, label]) => ({ value, label }));
  },

  /** List all categories with their entries (for admin UI) */
  async listAll(): Promise<
    Array<{
      category: string;
      entries: Array<{
        id: string;
        key: string;
        label: string;
        sortOrder: number;
        isVisible: boolean;
      }>;
    }>
  > {
    const all = await prisma.dictionaryEntry.findMany({
      orderBy: [{ category: 'asc' }, { sortOrder: 'asc' }],
    });

    const byCategory = new Map<string, typeof all>();
    for (const e of all) {
      if (!byCategory.has(e.category)) byCategory.set(e.category, []);
      byCategory.get(e.category)!.push(e);
    }

    return Array.from(byCategory.entries()).map(([category, entries]) => ({
      category,
      entries: entries.map((e) => ({
        id: e.id,
        key: e.key,
        label: e.label,
        sortOrder: e.sortOrder,
        isVisible: e.isVisible,
      })),
    }));
  },

  /** Update a label (admin only) */
  async updateLabel(id: string, label: string) {
    const updated = await prisma.dictionaryEntry.update({
      where: { id },
      data: { label },
    });
    // Invalidate cache
    cache = null;
    return updated;
  },

  /** Toggle visibility */
  async toggleVisibility(id: string) {
    const entry = await prisma.dictionaryEntry.findUnique({ where: { id } });
    if (!entry) return null;
    const updated = await prisma.dictionaryEntry.update({
      where: { id },
      data: { isVisible: !entry.isVisible },
    });
    cache = null;
    return updated;
  },
};
