import { setRequestLocale } from 'next-intl/server';
import { MainLayout } from '@/components/layout/MainLayout';
import { Hero } from '@/components/sections/Hero';
import { ValueProps } from '@/components/sections/ValueProps';
import { FeaturedPlans } from '@/components/sections/FeaturedPlans';
import { TrustStrip } from '@/components/sections/TrustStrip';
import { FAQSection } from '@/components/sections/FAQSection';
import { CTASection } from '@/components/sections/CTASection';
import { NewsletterSection } from '@/components/sections/NewsletterSection';

type Props = { params: Promise<{ locale: string }> };

export default async function HomePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <MainLayout>
      <Hero />
      <ValueProps />
      <FeaturedPlans />
      <TrustStrip />
      <FAQSection />
      <CTASection />
      <NewsletterSection />
    </MainLayout>
  );
}
