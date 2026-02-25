import path from 'node:path';
import dotenv from 'dotenv';

// Load env vars before Prisma
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create super admin
  const hashedPassword = await hash('GOsim2me!@13579', 12);
  await prisma.adminUser.upsert({
    where: { email: 'gavriel.ke@gmail.com' },
    update: {},
    create: {
      email: 'gavriel.ke@gmail.com',
      name: 'Gabriel',
      password: hashedPassword,
      role: 'SUPER_ADMIN',
      active: true,
    },
  });
  console.log('Admin user created: gavriel.ke@gmail.com (SUPER_ADMIN)');

  // Create initial CMS pages
  const pagesSlugs = ['home', 'about', 'contact', 'how-it-works', 'compatible-devices', 'help', 'destinations'];
  for (const slug of pagesSlugs) {
    await prisma.page.upsert({
      where: { slug },
      update: {},
      create: {
        slug,
        titleEn: slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
        titleHe: '',
        titleAr: '',
        published: true,
      },
    });
  }
  console.log(`Created ${pagesSlugs.length} CMS pages`);

  // Create default site settings
  const defaults: Record<string, string> = {
    site_name: 'Sim2Me',
    tagline: 'Stay connected worldwide',
    support_email: 'support@sim2me.com',
    whatsapp_number: '972501234567',
    price_markup_percent: '30',
  };

  for (const [key, value] of Object.entries(defaults)) {
    await prisma.siteSetting.upsert({
      where: { key },
      update: {},
      create: { key, value },
    });
  }
  console.log('Default settings created');

  // Default fee settings (Paddle 5% + $0.50)
  const defaultFeeId = 'default';
  await prisma.feeSettings.upsert({
    where: { id: defaultFeeId },
    update: {},
    create: {
      id: defaultFeeId,
      paddlePercentageFee: 0.05,
      paddleFixedFee: 0.5,
      currency: 'USD',
    },
  });
  console.log('Default fee settings created');

  console.log('Seed complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
