import { MainLayout } from '@/components/layout/MainLayout';
import { DestinationsClient } from './DestinationsClient';

export const metadata = {
  title: 'Destinations',
  description: 'Browse eSIM plans by country or region. Choose your destination and find the best data plans.',
};

export default function DestinationsPage() {
  return (
    <MainLayout>
      <DestinationsClient />
    </MainLayout>
  );
}
