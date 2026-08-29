'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { ArrowRight } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { publishedPackages, activePackageVersion } from '@/content/packages/catalog';
import type { PackageSegment } from '@/features/packages/types';
import { pick, type Locale } from '@/features/catalog/types';
import { MARKETING_ROUTES } from '@/lib/navigation';

function PackageCards({ segment, locale }: { segment: PackageSegment; locale: Locale }) {
  const t = useTranslations('packages');
  const packages = publishedPackages(segment).slice(0, 3);

  return (
    <ul className="mt-8 grid gap-4 lg:grid-cols-3">
      {packages.map((pkg) => {
        const version = activePackageVersion(pkg);
        if (!version) return null;
        const displayInclusions = version.inclusions.slice(0, 5);
        return (
          <li key={pkg.slug}>
            <Card as="article" className="flex h-full flex-col p-5 md:p-6">
              <h3 className="text-ink text-lg font-semibold">{pick(pkg.name, locale)}</h3>
              <p className="text-primary mt-2 text-base font-semibold">
                {pick(version.publicLabel, locale)}
              </p>
              <p className="text-muted mt-3 text-sm leading-relaxed">
                {pick(version.summary, locale)}
              </p>
              <ul className="mt-4 flex flex-1 flex-col gap-2">
                {displayInclusions.map((item) => (
                  <li key={item.en} className="text-ink text-sm leading-relaxed">
                    {pick(item, locale)}
                  </li>
                ))}
              </ul>
              <Button asChild className="mt-6 w-full" variant="secondary">
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

export function PackageSelector({ locale }: { locale: Locale }) {
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
          <PackageCards segment="new_business" locale={locale} />
        </TabsContent>
        <TabsContent value="existing_business">
          <PackageCards segment="existing_business" locale={locale} />
        </TabsContent>
      </Tabs>
      <p className="text-muted mt-4 text-xs">{t('taxPendingReview')}</p>
    </div>
  );
}
