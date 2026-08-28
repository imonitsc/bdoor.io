'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { ArrowRight } from 'lucide-react';
import { useRouter } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioItem, ChoiceCard } from '@/components/ui/choice';
import {
  SERVICE_FINDER_INTENTS,
  servicesForIntent,
  type TaxonomyServiceStatus,
} from '@/content/service-taxonomy';
import { MARKETING_ROUTES } from '@/lib/navigation';

function statusTone(status: TaxonomyServiceStatus): 'success' | 'warning' | 'neutral' {
  if (status === 'available') return 'success';
  if (status === 'pilot' || status === 'consultation') return 'warning';
  return 'neutral';
}

/**
 * Homepage service finder — maps visitor intent to catalogue routes or consultation.
 */
export function ServiceFinder() {
  const t = useTranslations('home.serviceFinder');
  const router = useRouter();
  const [intent, setIntent] = useState<string>(SERVICE_FINDER_INTENTS[0].id);
  const matches = servicesForIntent(intent);

  return (
    <form
      className="border-border bg-surface flex flex-col gap-5 rounded-[var(--radius-panel)] border p-5 md:p-6"
      onSubmit={(event) => {
        event.preventDefault();
        const primary = matches.find((s) => s.status === 'available');
        if (primary) {
          router.push(`/services/${primary.slug}`);
          return;
        }
        router.push(`${MARKETING_ROUTES.contact}?intent=${encodeURIComponent(intent)}`);
      }}
    >
      <div>
        <h2 className="text-ink text-lg font-semibold">{t('title')}</h2>
        <p className="text-muted mt-1 text-sm leading-relaxed">{t('body')}</p>
      </div>

      <RadioGroup
        value={intent}
        onValueChange={setIntent}
        aria-label={t('title')}
        className="grid gap-2 sm:grid-cols-2"
      >
        {SERVICE_FINDER_INTENTS.map((option) => (
          <ChoiceCard
            key={option.id}
            htmlFor={`finder-${option.id}`}
            selected={intent === option.id}
            control={<RadioItem value={option.id} id={`finder-${option.id}`} />}
          >
            {t(`intents.${option.labelKey}`)}
          </ChoiceCard>
        ))}
      </RadioGroup>

      {matches.length > 0 ? (
        <ul className="border-border divide-border divide-y rounded-[var(--radius-control)] border">
          {matches.map((service) => (
            <li key={service.slug} className="flex items-center justify-between gap-3 px-4 py-3">
              <span className="text-ink text-sm font-medium">{service.title.en}</span>
              <Badge tone={statusTone(service.status)}>{t(`status.${service.status}`)}</Badge>
            </li>
          ))}
        </ul>
      ) : null}

      <Button type="submit" size="lg" block>
        {t('cta')}
        <ArrowRight className="size-4" aria-hidden="true" />
      </Button>
    </form>
  );
}
