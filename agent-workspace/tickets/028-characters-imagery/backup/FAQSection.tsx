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
import { CharacterFigure } from '@/components/brand/CharacterFigure';
import { HelpCircle } from 'lucide-react';
import { createSharedPathnamesNavigation } from 'next-intl/navigation';
import { routing } from '@/i18n/routing';

const { Link: IntlLink } = createSharedPathnamesNavigation(routing);

export function FAQSection() {
  const t = useTranslations('home');
  const tFaq = useTranslations('faq');
  const { data: faqs = [] } = useQuery({
    queryKey: ['faqs'],
    queryFn: getFaqs,
  });

  return (
    <section className="bg-white py-20 sm:py-24">
      {/*
        Sima reading the questions with genuine curiosity, beside the accordion rather than beside
        the heading — the questions are what she is curious about.

        Laid out in flow inside a wider wrapper instead of absolutely positioned: the section has no
        `overflow-hidden`, and an absolute figure at the edge of a `max-w-3xl` column overruns the
        container at 1024 px, which costs a horizontal scrollbar on the whole page.
      */}
      <div className="container px-4">
        <div className="mx-auto flex max-w-5xl items-end justify-center gap-8">
          <CharacterFigure slot="faqCurious" height={300} crop={0.5} className="hidden lg:block" />
          <div className="w-full max-w-3xl">
            <div className="text-center">
              <div className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                <HelpCircle className="h-3 w-3" />
                {t('faqBadge')}
              </div>
              <h2 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl lg:text-4xl">
                {t('faqTitle')}
              </h2>
              <p className="mt-2 text-muted-foreground">
                {t('faqSubtitle')}
              </p>
            </div>
            <Accordion type="single" collapsible className="mt-10">
              {faqs.slice(0, 5).map((faq) => (
                <AccordionItem key={faq.id} value={faq.id} className="border-b border-border/60">
                  <AccordionTrigger className="py-5 text-left text-base font-semibold hover:text-primary transition-colors">
                    {tFaq(faq.questionKey)}
                  </AccordionTrigger>
                  <AccordionContent className="pb-5 text-muted-foreground leading-relaxed">
                    <p>{tFaq(faq.answerKey)}</p>
                    {faq.ctaHref && faq.ctaLabelKey ? (
                      <IntlLink href={faq.ctaHref} className="mt-3 inline-block">
                        <Button size="sm">{tFaq(faq.ctaLabelKey)}</Button>
                      </IntlLink>
                    ) : null}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </div>
    </section>
  );
}
