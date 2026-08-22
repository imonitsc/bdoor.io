import { useFormatter, useTranslations } from 'next-intl';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import type { Faq, Locale } from '@/features/catalog/types';
import { pick } from '@/features/catalog/types';

export function FaqList({
  faqs,
  locale,
  limit,
}: {
  faqs: readonly Faq[];
  locale: Locale;
  limit?: number;
}) {
  const t = useTranslations('resources');
  const format = useFormatter();
  const items = limit ? faqs.slice(0, limit) : faqs;

  if (items.length === 0) return null;

  return (
    <Accordion type="single" collapsible className="w-full border-t border-border">
      {items.map((faq) => (
        <AccordionItem key={faq.id} value={faq.id}>
          <AccordionTrigger>{pick(faq.question, locale)}</AccordionTrigger>
          <AccordionContent>
            <p>{pick(faq.answer, locale)}</p>
            {faq.isComplianceSensitive && faq.lastReviewedAt ? (
              <p className="mt-3 text-xs text-muted">
                {t('lastReviewed', {
                  date: format.dateTime(new Date(faq.lastReviewedAt), 'short'),
                })}
              </p>
            ) : null}
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
