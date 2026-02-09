import { MainLayout } from '@/components/layout/MainLayout';
import { DestinationsClient } from './DestinationsClient';
import { setRequestLocale } from 'next-intl/server';

export const metadata = {
  title: 'Destinations',
  description: 'Browse eSIM plans by country or region. Choose your destination and find the best data plans.',
};

type Props = { params: Promise<{ locale: string }> };

export default async function DestinationsPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <MainLayout>
      <DestinationsClient locale={locale} />
    </MainLayout>
  );
}
