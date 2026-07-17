'use client';

import { createContext, useContext, type ReactNode } from 'react';
import { DICTIONARY } from '@/lib/shared/dictionary';

type Labels = Record<string, Record<string, string>>;

const DictContext = createContext<Labels>({});

export function DictProvider({ labels, children }: { labels: Labels; children: ReactNode }) {
  return <DictContext.Provider value={labels}>{children}</DictContext.Provider>;
}

/** Hook: get DB-backed labels for a category. Falls back to code defaults. */
export function useDict(category: string): Record<string, string> {
  const all = useContext(DictContext);
  return all[category] ?? DICTIONARY[category as keyof typeof DICTIONARY] ?? {};
}

/**
 * Hook: returns a dict-like object with ALL categories from DB.
 * Use as a drop-in replacement for static `dict` import in client components.
 * const dict = useDbDict();
 * dict.guestLevel.VIP_A  // returns DB-configured label
 */
export function useDbDict() {
  const all = useContext(DictContext);
  const result: Record<string, Record<string, string>> = {};
  for (const key of Object.keys(DICTIONARY)) {
    result[key] = all[key] ?? DICTIONARY[key as keyof typeof DICTIONARY];
  }
  return result as typeof DICTIONARY;
}
