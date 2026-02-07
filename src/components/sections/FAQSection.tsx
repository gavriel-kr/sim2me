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
import { HelpCircle } from 'lucide-react';

export function FAQSection() {
  const t = useTranslations('home');
  const tFaq = useTranslations('faq');
  const { data: faqs = [] } = useQuery({
    queryKey: ['faqs'],
    queryFn: getFaqs,
  });

  return (
    <section className="bg-white py-20 sm:py-24">
      <div className="container mx-auto max-w-3xl px-4">
        <div className="text-center">
          <div className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            <HelpCircle className="h-3 w-3" />
            Got questions?
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl lg:text-4xl">
            {t('faqTitle')}
          </h2>
          <p className="mt-2 text-muted-foreground">
            Everything you need to know about eSIMs
          </p>
        </div>
        <Accordion type="single" collapsible className="mt-10">
          {faqs.slice(0, 5).map((faq) => (
            <AccordionItem key={faq.id} value={faq.id} className="border-b border-border/60">
              <AccordionTrigger className="py-5 text-left text-base font-semibold hover:text-primary transition-colors">
                {tFaq(faq.questionKey)}
              </AccordionTrigger>
              <AccordionContent className="pb-5 text-muted-foreground leading-relaxed">
                {tFaq(faq.answerKey)}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
