import { getTranslations } from 'next-intl/server';
import { MainLayout } from '@/components/layout/MainLayout';
import { ContactForm } from './ContactForm';

export async function generateMetadata() {
  const t = await getTranslations('contact');
  return { title: t('title'), description: 'Get in touch with our support team.' };
}

export default async function ContactPage() {
  const t = await getTranslations('contact');

  return (
    <MainLayout>
      <div className="container mx-auto max-w-xl px-4 py-12">
        <h1 className="text-3xl font-bold">{t('title')}</h1>
        <p className="mt-2 text-muted-foreground">{t('subtitle')}</p>
        <ContactForm />
      </div>
    </MainLayout>
  );
}
