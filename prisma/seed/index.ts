import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { prisma } from '../../lib/db/client';

async function main() {
  const passwordHash = await bcrypt.hash('admin123', 12);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@cmms.local' },
    update: {},
    create: {
      email: 'admin@cmms.local',
      name: '系统管理员',
      passwordHash,
      role: 'SUPER_ADMIN',
    },
  });

  const viewer = await prisma.user.upsert({
    where: { email: 'viewer@cmms.local' },
    update: {},
    create: {
      email: 'viewer@cmms.local',
      name: '只读用户',
      passwordHash: await bcrypt.hash('viewer123', 12),
      role: 'VIEWER',
    },
  });

  console.log('Seeded users:');
  console.log(`  - ${admin.email} (${admin.role})`);
  console.log(`  - ${viewer.email} (${viewer.role})`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
