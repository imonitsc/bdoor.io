'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { ArrowRight } from 'lucide-react';
import { useRouter } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioItem, ChoiceCard } from '@/components/ui/choice';

/**
 * Service finder beside the hero.
 *
 * Choosing an option continues into /start with intent preselected, or into a
 * matching public route when the goal is not yet a questionnaire branch.
 */
const OPTIONS = [
  { value: 'local_company', labelKey: 'localCompany', href: '/start?intent=local_company' },
  { value: 'foreign_founder', labelKey: 'foreignFounder', href: '/start?intent=foreign_founder' },
  { value: 'get_licence', labelKey: 'getLicence', href: '/services?category=licences' },
  { value: 'tax_vat', labelKey: 'taxVat', href: '/services?category=tax-vat' },
  { value: 'import_export', labelKey: 'importExport', href: '/start?intent=import_export' },
  {
    value: 'existing_company',
    labelKey: 'existingCompany',
    href: '/start?intent=existing_company',
  },
  { value: 'hire_foreign', labelKey: 'hireForeign', href: '/foreign-founders' },
  { value: 'protect_brand', labelKey: 'protectBrand', href: '/contact' },
  { value: 'procurement', labelKey: 'procurement', href: '/contact' },
  {
    value: 'annual_compliance',
    labelKey: 'annualCompliance',
    href: '/services?category=compliance',
  },
  { value: 'expand_international', labelKey: 'expandInternational', href: '/international' },
  { value: 'travel_agency', labelKey: 'travelAgency', href: '/start?intent=travel_agency' },
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
        const option = OPTIONS.find((item) => item.value === value) ?? OPTIONS[0];
        router.push(option.href);
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
        className="flex max-h-[28rem] flex-col gap-2 overflow-y-auto pr-1"
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
