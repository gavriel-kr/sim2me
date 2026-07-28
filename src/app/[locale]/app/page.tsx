import { redirect } from 'next/navigation';

/** Former app marketing page — redirect to home (web + account cover the product). */
export default async function AppPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  redirect(`/${locale}`);
}
