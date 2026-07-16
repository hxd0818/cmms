/**
 * Convert Prisma Decimal fields to plain numbers.
 * Required when passing Prisma query results from Server Components
 * to Client Components (Decimal objects can't be serialized).
 *
 * Usage: const plain = toPlain(records);
 */
export function toPlain<T>(obj: T): T {
  return JSON.parse(
    JSON.stringify(obj, (_key, value) => {
      if (typeof value === 'object' && value !== null && typeof value.toFixed === 'function') {
        return Number(value);
      }
      return value;
    }),
  );
}
