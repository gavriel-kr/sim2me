import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { SeoSettingsClient } from './SeoSettingsClient';

export default async function SeoPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/admin/login');

  const settings = await prisma.seoSetting.findMany({ orderBy: { path: 'asc' } });

  return <SeoSettingsClient initial={settings} />;
}
