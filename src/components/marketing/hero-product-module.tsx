import { useTranslations } from 'next-intl';
import { Check } from 'lucide-react';
import { BANGLADESH_COUNTRY, internationalCountries, pickText } from '@/content/international';
import type { Locale } from '@/features/catalog/types';

/**
 * The hero's right side: a real product module instead of a generated
 * person (immediate-operations instructions §7.1). Everything shown is the
 * commercial catalog's actual configuration — the seven countries, the
 * Bangladesh featured price, the managed-application flow — rendered as a
 * static preview and labelled as such until it is wired to live state.
 *
 * Deliberately non-interactive: a fake control that almost works erodes
 * more trust than a preview that says it is one.
 */
export function HeroProductModule({ locale }: { locale: Locale }) {
  const t = useTranslations('home.hero.module');

  const countries = [
    { slug: BANGLADESH_COUNTRY.slug, code: BANGLADESH_COUNTRY.code, name: BANGLADESH_COUNTRY.name },
    ...internationalCountries().map((c) => ({ slug: c.slug, code: c.code, name: c.name })),
  ];
  const featured = BANGLADESH_COUNTRY.featured;
  const steps = ['apply', 'review', 'quote'] as const;

  return (
    <div className="w-full max-w-md justify-self-center lg:justify-self-end">
      <div className="rounded-[var(--radius-panel)] border border-white/10 bg-white/[0.06] p-5 shadow-2xl backdrop-blur-sm md:p-6">
        <div className="flex items-center justify-between gap-3">
          <p className="text-muted-inverse font-mono text-[0.65rem] tracking-[0.15em] uppercase">
            {t('previewLabel')}
          </p>
          <p className="inline-flex items-center gap-1.5 text-xs font-medium text-[color:var(--bd-turquoise-500)]">
            <span
              aria-hidden="true"
              className="size-1.5 rounded-full bg-[color:var(--bd-turquoise-500)]"
            />
            {t('reviewed')}
          </p>
        </div>

        <ul className="mt-4 flex flex-wrap gap-1.5" aria-label={t('countriesLabel')}>
          {countries.map((country) => {
            const active = country.slug === BANGLADESH_COUNTRY.slug;
            return (
              <li
                key={country.slug}
                className={
                  active
                    ? 'text-ink-inverse rounded-[var(--radius-control)] border border-[color:var(--bd-turquoise-500)]/60 bg-white/10 px-2.5 py-1 text-xs font-semibold'
                    : 'text-muted-inverse rounded-[var(--radius-control)] border border-white/10 px-2.5 py-1 text-xs'
                }
                aria-current={active ? 'true' : undefined}
              >
                {pickText(country.name, locale)}
              </li>
            );
          })}
        </ul>

        <div className="mt-4 rounded-[var(--radius-card)] border border-white/10 bg-white/[0.05] p-4">
          <p className="text-muted-inverse text-xs">{t('routeLabel')}</p>
          <p className="text-ink-inverse mt-1 text-base font-semibold">{t('routeName')}</p>
          <p className="text-ink-inverse mt-2 text-xl font-semibold">
            {pickText(featured.label, locale)}
            <span className="text-muted-inverse ml-2 text-sm font-normal">
              {pickText(featured.alt, locale)}
            </span>
          </p>
          <p className="text-muted-inverse mt-1 text-xs">{pickText(featured.qualifier, locale)}</p>
        </div>

        <ol className="mt-4 flex items-center gap-2" aria-label={t('stepsLabel')}>
          {steps.map((step, index) => (
            <li key={step} className="flex flex-1 items-center gap-2">
              <span
                className={
                  index === 0
                    ? 'flex size-6 shrink-0 items-center justify-center rounded-full bg-[color:var(--bd-turquoise-500)] text-[0.65rem] font-bold text-[color:var(--bd-midnight)]'
                    : 'text-muted-inverse flex size-6 shrink-0 items-center justify-center rounded-full border border-white/20 text-[0.65rem] font-semibold'
                }
                aria-hidden="true"
              >
                {index + 1}
              </span>
              <span
                className={
                  index === 0
                    ? 'text-ink-inverse text-xs font-semibold'
                    : 'text-muted-inverse text-xs'
                }
              >
                {t(`steps.${step}`)}
              </span>
            </li>
          ))}
        </ol>

        <p className="text-muted-inverse mt-4 flex items-start gap-2 border-t border-white/10 pt-4 text-xs leading-relaxed">
          <Check
            className="mt-0.5 size-3.5 shrink-0 text-[color:var(--bd-turquoise-500)]"
            aria-hidden="true"
          />
          {t('readiness')}
        </p>
      </div>
    </div>
  );
}
