'use client';

import { useTranslations } from 'next-intl';
import { useQuery } from '@tanstack/react-query';
import { getFaqs } from '@/lib/api/repositories/faqRepository';
import { FAQ_GROUPS } from '@/data/faq';
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
      {/* No "still need help" box at the top: the message form is at the foot of this page, so the
          questions start straight away and the way to write in is where you arrive after reading them.
          `help.needHelp` and `help.contactCta` stay in the message files for whoever wants it back. */}
      {/* Ticket 036. Twenty questions in one undifferentiated column is a list nobody reads to the end
          of. Grouped, with installation and troubleshooting first, because that is the order of what
          goes wrong. An entry without a group falls into the first section rather than disappearing. */}
      {/* No top margin now that nothing sits above: the page heading already carries `mb-10`. */}
      <div className="space-y-10">
        {FAQ_GROUPS.map((group) => {
          const inGroup = faqs.filter((faq) => (faq.group ?? FAQ_GROUPS[0]) === group);
          if (inGroup.length === 0) return null;
          return (
            <section key={group}>
              <h2 className="mb-2 text-xl font-bold">{t(group)}</h2>
              <Accordion type="single" collapsible className="w-full">
                {inGroup.map((faq) => (
                  <AccordionItem key={faq.id} value={faq.id}>
                    <AccordionTrigger className="text-left">
                      {tFaq(faq.questionKey)}
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground">
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
            </section>
          );
        })}
      </div>
    </>
  );
}
