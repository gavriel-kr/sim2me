import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { getNavigationConfig, DEFAULT_NAVIGATION } from '@/lib/navigation';
import { NavigationClient } from './NavigationClient';

export default async function NavigationPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/admin/login');

  const config = await getNavigationConfig();
  const initial = {
    navMenu: config.navMenu ?? DEFAULT_NAVIGATION.navMenu ?? [],
    footerProduct: config.footer.product ?? DEFAULT_NAVIGATION.footer.product ?? [],
    footerCompany: config.footer.company ?? DEFAULT_NAVIGATION.footer.company ?? [],
    footerLegal: config.footer.legal ?? DEFAULT_NAVIGATION.footer.legal ?? [],
    footerGuides: config.footer.guides ?? DEFAULT_NAVIGATION.footer.guides ?? [],
  };

  return (
    <div className="p-6 lg:p-8">
      <h1 className="text-2xl font-bold text-gray-900">Navigation</h1>
      <p className="mt-1 text-sm text-gray-500">Edit main menu and footer links</p>
      <NavigationClient initial={initial} />
    </div>
  );
}
