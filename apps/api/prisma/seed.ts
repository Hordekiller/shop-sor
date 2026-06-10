import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const adminPassword = await bcrypt.hash('admin123', 12);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@atlas-shop.com' },
    update: {},
    create: {
      name: 'مدیر سیستم',
      email: 'admin@atlas-shop.com',
      password: adminPassword,
      role: 'SUPER_ADMIN',
    },
  });

  const electronics = await prisma.category.upsert({
    where: { slug: 'electronics' },
    update: {},
    create: {
      name: 'لوازم الکترونیکی',
      slug: 'electronics',
      description: 'انواع لوازم الکترونیکی و دیجیتال',
      sortOrder: 1,
    },
  });

  const fashion = await prisma.category.upsert({
    where: { slug: 'fashion' },
    update: {},
    create: {
      name: 'مد و پوشاک',
      slug: 'fashion',
      description: 'انواع پوشاک و اکسسوری',
      sortOrder: 2,
    },
  });

  const mobile = await prisma.category.upsert({
    where: { slug: 'mobile' },
    update: {},
    create: {
      name: 'موبایل',
      slug: 'mobile',
      description: 'گوشی موبایل و تبلت',
      parentId: electronics.id,
      sortOrder: 1,
    },
  });

  console.log('Seed completed:');
  console.log(`  Admin: ${admin.email} / admin123`);
  console.log(`  Categories: ${electronics.name}, ${mobile.name}, ${fashion.name}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
