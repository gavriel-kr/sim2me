import { MainLayout } from '@/components/layout/MainLayout';
import { CheckoutClient } from './CheckoutClient';

export const metadata = {
  title: 'Checkout',
  description: 'Complete your eSIM purchase.',
};

export default function CheckoutPage() {
  return (
    <MainLayout>
      <CheckoutClient />
    </MainLayout>
  );
}
