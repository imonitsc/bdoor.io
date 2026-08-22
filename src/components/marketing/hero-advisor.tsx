'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { ArrowRight } from 'lucide-react';
import { useRouter } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioItem, ChoiceCard } from '@/components/ui/choice';

/**
 * The business-setup advisor beside the hero.
 *
 * It is a real form, not a fake chat box: choosing an option and continuing
 * lands you on /start with that intent preselected, so the first questionnaire
 * step is already answered.
 */
const OPTIONS = [
  { value: 'local_company', labelKey: 'localCompany' },
  { value: 'foreign_founder', labelKey: 'foreignFounder' },
  { value: 'import_export', labelKey: 'importExport' },
  { value: 'travel_agency', labelKey: 'travelAgency' },
  { value: 'existing_company', labelKey: 'existingCompany' },
] as const;

export function HeroAdvisor() {
  const t = useTranslations('home.advisor');
  const router = useRouter();
  const [value, setValue] = useState<string>('local_company');

  return (
    <form
      className="border-border bg-surface flex flex-col gap-4 rounded-[var(--radius-panel)] border p-5 shadow-md md:p-6"
      onSubmit={(event) => {
        event.preventDefault();
        router.push(`/start?intent=${encodeURIComponent(value)}`);
      }}
    >
      <div>
        <h2 className="text-ink text-base font-semibold">{t('title')}</h2>
        <p className="text-muted mt-1 text-sm">{t('help')}</p>
      </div>

      <RadioGroup
        value={value}
        onValueChange={setValue}
        aria-label={t('title')}
        className="flex flex-col gap-2"
      >
        {OPTIONS.map((option) => (
          <ChoiceCard
            key={option.value}
            htmlFor={`advisor-${option.value}`}
            selected={value === option.value}
            control={<RadioItem value={option.value} id={`advisor-${option.value}`} />}
          >
            {t(`options.${option.labelKey}`)}
          </ChoiceCard>
        ))}
      </RadioGroup>

      <Button type="submit" size="lg" block>
        {t('continue')}
        <ArrowRight className="size-4" aria-hidden="true" />
      </Button>
    </form>
  );
}
