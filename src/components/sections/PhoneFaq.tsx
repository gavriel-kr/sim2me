'use client';

/**
 * Ticket 042 — the questions people ask before buying a plan with a phone number, on the phone-plans
 * page. Same entries and wording as the help centre (`faq.*`), so the two never disagree.
 */

import { useTranslations } from 'next-intl';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

const QUESTIONS: { q: string; a: string }[] = [
  { q: 'phoneWhatIs', a: 'answerPhoneWhatIs' },
  { q: 'phoneWhenNumber', a: 'answerPhoneWhenNumber' },
  { q: 'renewHow', a: 'answerRenewHow' },
  { q: 'dataOnly', a: 'answerDataOnly' },
  { q: 'refundPolicy', a: 'answerRefundPolicy' },
];

export function PhoneFaq() {
  const t = useTranslations('phonePlans');
  const tFaq = useTranslations('faq');
  return (
    <section aria-labelledby="phone-faq-title" className="mx-auto max-w-3xl">
      <h2 id="phone-faq-title" className="text-lg font-bold text-gray-800">{t('faqTitle')}</h2>
      <Accordion type="single" collapsible className="mt-3">
        {QUESTIONS.map(({ q, a }) => (
          <AccordionItem key={q} value={q} className="border-b border-border/60">
            <AccordionTrigger className="py-4 text-start text-base font-semibold hover:text-primary">{tFaq(q)}</AccordionTrigger>
            <AccordionContent className="pb-4 leading-relaxed text-muted-foreground">
              <p>{tFaq(a)}</p>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  );
}
