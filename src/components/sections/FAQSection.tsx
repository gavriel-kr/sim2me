'use client';

import { useTranslations } from 'next-intl';
import { useQuery } from '@tanstack/react-query';
import { getFaqs } from '@/lib/api/repositories/faqRepository';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

export function FAQSection() {
  const t = useTranslations('home');
  const tFaq = useTranslations('faq');
  const { data: faqs = [] } = useQuery({
    queryKey: ['faqs'],
    queryFn: getFaqs,
  });

  return (
    <section className="py-16">
      <div className="container mx-auto max-w-2xl px-4">
        <h2 className="text-2xl font-bold sm:text-3xl">{t('faqTitle')}</h2>
        <Accordion type="single" collapsible className="mt-6">
          {faqs.slice(0, 4).map((faq) => (
            <AccordionItem key={faq.id} value={faq.id}>
              <AccordionTrigger className="text-left">
                {tFaq(faq.questionKey)}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                {tFaq(faq.answerKey)}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
