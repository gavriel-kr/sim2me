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
import { Button } from '@/components/ui/button';
import { createSharedPathnamesNavigation } from 'next-intl/navigation';
import { routing } from '@/i18n/routing';

const { Link: IntlLink } = createSharedPathnamesNavigation(routing);

export function HelpClient() {
  const t = useTranslations('help');
  const tFaq = useTranslations('faq');
  const { data: faqs = [] } = useQuery({
    queryKey: ['faqs'],
    queryFn: getFaqs,
  });

  return (
    <>
      <div className="mt-8 rounded-xl border border-border bg-muted/30 p-6">
        <p className="font-medium">{t('needHelp')}</p>
        <IntlLink href="/contact">
          <Button className="mt-2">{t('contactCta')}</Button>
        </IntlLink>
      </div>
      <div className="mt-10">
        <Accordion type="single" collapsible className="w-full">
          {faqs.map((faq) => (
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
    </>
  );
}
