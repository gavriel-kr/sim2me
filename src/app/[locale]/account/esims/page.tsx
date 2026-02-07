import { MainLayout } from '@/components/layout/MainLayout';
import { MyEsimsClient } from './MyEsimsClient';

export const metadata = {
  title: 'My eSIMs',
  description: 'View and install your eSIMs.',
};

export default function MyEsimsPage() {
  return (
    <MainLayout>
      <MyEsimsClient />
    </MainLayout>
  );
}
