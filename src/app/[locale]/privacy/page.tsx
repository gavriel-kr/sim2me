import { getTranslations } from 'next-intl/server';
import { MainLayout } from '@/components/layout/MainLayout';

export async function generateMetadata() {
  const t = await getTranslations('footer');
  return { title: t('privacy'), description: 'Privacy Policy.' };
}

export default async function PrivacyPage() {
  return (
    <MainLayout>
      <div className="container mx-auto max-w-2xl px-4 py-12">
        <h1 className="text-2xl font-bold sm:text-3xl">Privacy Policy</h1>
        <div className="prose prose-sm mt-6 text-muted-foreground">
          <p>We collect your email and payment information to process orders. We do not sell your data.
            For support we may use your contact details to respond. See our full policy for data retention and rights.</p>
        </div>
      </div>
    </MainLayout>
  );
}
