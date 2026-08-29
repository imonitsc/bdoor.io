'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { ArrowRight, Check, ChevronDown } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { publishedPackages, activePackageVersion } from '@/content/packages/catalog';
import type { PackageSegment } from '@/features/packages/types';
import { pick, type Locale } from '@/features/catalog/types';
import { MARKETING_ROUTES } from '@/lib/navigation';

function PackageCards({
  segment,
  locale,
  usdNotes,
}: {
  segment: PackageSegment;
  locale: Locale;
  usdNotes?: Record<string, string>;
}) {
  const t = useTranslations('packages');
  const packages = publishedPackages(segment).slice(0, 3);

  return (
    <ul className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {packages.map((pkg) => {
        const version = activePackageVersion(pkg);
        if (!version) return null;
        // Three visible inclusions; the rest live behind the disclosure so the
        // cards stay comparable at a glance instead of becoming spec sheets.
        const visible = version.inclusions.slice(0, 3);
        const remaining = version.inclusions.slice(3);
        return (
          <li key={pkg.slug}>
            <Card as="article" className="flex h-full flex-col p-5 md:p-6">
              <h3 className="text-ink text-lg font-semibold">{pick(pkg.name, locale)}</h3>
              <p className="text-primary mt-2 text-base font-semibold">
                {pick(version.publicLabel, locale)}
              </p>
              {usdNotes?.[pkg.slug] ? (
                <p className="text-muted mt-1 text-xs">{usdNotes[pkg.slug]}</p>
              ) : null}
              <p className="text-muted mt-3 text-sm leading-relaxed">
                {pick(version.summary, locale)}
              </p>
              <ul className="mt-4 flex flex-col gap-2">
                {visible.map((item) => (
                  <li key={item.en} className="text-ink flex items-start gap-2 text-sm">
                    <Check className="text-accent mt-0.5 size-4 shrink-0" aria-hidden="true" />
                    {pick(item, locale)}
                  </li>
                ))}
              </ul>
              <details className="group mt-3 flex-1">
                <summary className="text-primary hover:text-primary-hover inline-flex min-h-11 cursor-pointer list-none items-center gap-1 rounded text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus)] [&::-webkit-details-marker]:hidden">
                  {t('seeDetails')}
                  <ChevronDown
                    className="size-4 transition-transform group-open:rotate-180"
                    aria-hidden="true"
                  />
                </summary>
                <div className="text-sm">
                  {remaining.length > 0 ? (
                    <ul className="mt-1 flex flex-col gap-2">
                      {remaining.map((item) => (
                        <li key={item.en} className="text-ink flex items-start gap-2">
                          <Check
                            className="text-accent mt-0.5 size-4 shrink-0"
                            aria-hidden="true"
                          />
                          {pick(item, locale)}
                        </li>
                      ))}
                    </ul>
                  ) : null}
                  {version.exclusions.length > 0 ? (
                    <>
                      <p className="text-muted mt-3 text-xs font-semibold tracking-wide uppercase">
                        {t('excludes')}
                      </p>
                      <ul className="mt-1 flex flex-col gap-1.5">
                        {version.exclusions.map((item) => (
                          <li key={item.en} className="text-muted">
                            {pick(item, locale)}
                          </li>
                        ))}
                      </ul>
                    </>
                  ) : null}
                </div>
              </details>
              <Button asChild className="mt-5 w-full" variant="secondary">
                <Link href={`${MARKETING_ROUTES.start}?package=${pkg.slug}`}>
                  {t('cardCta')}
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
              </Button>
            </Card>
          </li>
        );
      })}
    </ul>
  );
}

export function PackageSelector({
  locale,
  usdNotes,
}: {
  locale: Locale;
  /** From `packageUsdNotes()` — absent when no reviewed FX rate exists. */
  usdNotes?: Record<string, string>;
}) {
  const t = useTranslations('packages');
  const [segment, setSegment] = useState<PackageSegment>('new_business');

  return (
    <div>
      <Tabs value={segment} onValueChange={(value) => setSegment(value as PackageSegment)}>
        <TabsList aria-label={t('segmentLabel')}>
          <TabsTrigger value="new_business">{t('segments.newBusiness')}</TabsTrigger>
          <TabsTrigger value="existing_business">{t('segments.existingBusiness')}</TabsTrigger>
        </TabsList>
        <TabsContent value="new_business">
          <PackageCards segment="new_business" locale={locale} usdNotes={usdNotes} />
        </TabsContent>
        <TabsContent value="existing_business">
          <PackageCards segment="existing_business" locale={locale} usdNotes={usdNotes} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
