import { getTranslations } from 'next-intl/server';
import { MainLayout } from '@/components/layout/MainLayout';

export async function generateMetadata() {
  const t = await getTranslations('footer');
  return { title: t('terms'), description: 'Terms of Service.' };
}

export default async function TermsPage() {
  return (
    <MainLayout>
      <div className="container mx-auto max-w-2xl px-4 py-12">
        <h1 className="text-2xl font-bold sm:text-3xl">Terms of Service</h1>
        <div className="prose prose-sm mt-6 text-muted-foreground">
          <p>Last updated: {new Date().toLocaleDateString('en-US')}</p>
          <p>
            By using this service you agree to purchase eSIM products for personal travel use.
            You must ensure your device is compatible and unlocked. Refunds are subject to our
            Refund Policy. We are not responsible for network coverage or operator service quality.
          </p>
        </div>
      </div>
    </MainLayout>
  );
}
