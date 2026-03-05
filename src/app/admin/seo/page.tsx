import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getGlobalSeoSettings } from '@/lib/global-seo';
import { SeoSettingsClient } from './SeoSettingsClient';

export default async function SeoPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/admin/login');

  const [globalSettings, overrides] = await Promise.all([
    getGlobalSeoSettings(),
    prisma.seoSetting.findMany({ orderBy: { path: 'asc' } }),
  ]);

  return <SeoSettingsClient globalSettings={globalSettings} overrides={overrides} />;
}
