import 'dotenv/config';
import { prisma } from '../../lib/db/client';
import { DICTIONARY } from '../../lib/shared/dictionary';

async function main() {
  let count = 0;
  for (const [category, entries] of Object.entries(DICTIONARY)) {
    for (const [key, label] of Object.entries(entries)) {
      await prisma.dictionaryEntry.upsert({
        where: { category_key: { category, key } },
        create: { category, key, label, sortOrder: count },
        update: {},
      });
      count++;
    }
  }
  console.log(
    'Seeded ' +
      count +
      ' dictionary entries across ' +
      Object.keys(DICTIONARY).length +
      ' categories',
  );
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
