import type { Metadata } from 'next';
import { getFormatter, getTranslations, setRequestLocale } from 'next-intl/server';
import { Tags } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { DataList, type DataListColumn } from '@/components/ui/data-list';
import { EmptyState } from '@/components/ui/empty-state';
import { PageHeading } from '@/components/dashboard/page-heading';
import { Alert } from '@/components/ui/alert';
import {
  BANGLADESH_PACKAGES,
  INTERNATIONAL_OFFERS,
  activePackageVersion,
} from '@/content/packages/catalog';
import { computeLayerTotals } from '@/features/packages/pricing';
import { requireCapability } from '@/lib/auth/session';

export const metadata: Metadata = { robots: { index: false, follow: false } };

type PackageRow = {
  id: string;
  name: string;
  segment: string;
  status: string;
  publicLabel: string;
  bdoorMinor: number;
  checkoutEnabled: boolean;
};

type OfferRow = {
  id: string;
  route: string;
  countryCode: string;
  status: string;
  publicLabel: string;
  totalMinor: number;
  currency: string;
  checkoutEnabled: boolean;
};

export default async function AdminPackagesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  await requireCapability('service.manage');

  const [t, format] = await Promise.all([getTranslations('admin.packages'), getFormatter()]);

  const packageRows: PackageRow[] = BANGLADESH_PACKAGES.flatMap((pkg) => {
    const version = activePackageVersion(pkg);
    if (!version) return [];
    const totals = computeLayerTotals(version.feeComponents);
    return [
      {
        id: pkg.slug,
        name: locale === 'bn' ? pkg.name.bn : pkg.name.en,
        segment: pkg.segment,
        status: version.status,
        publicLabel: locale === 'bn' ? version.publicLabel.bn : version.publicLabel.en,
        bdoorMinor: totals.bdoorMinor,
        checkoutEnabled: version.checkoutEnabled,
      },
    ];
  });

  const offerRows: OfferRow[] = INTERNATIONAL_OFFERS.map((offer) => {
    const totals = computeLayerTotals(offer.feeComponents);
    const currency = offer.feeComponents[0]?.currency ?? 'USD';
    return {
      id: offer.slug,
      route: locale === 'bn' ? offer.route.bn : offer.route.en,
      countryCode: offer.countryCode,
      status: offer.status,
      // Register-interest routes have no approved public price yet; the
      // admin view shows the public status instead of inventing a label.
      publicLabel: offer.publicLabel
        ? locale === 'bn'
          ? offer.publicLabel.bn
          : offer.publicLabel.en
        : offer.publicStatus,
      totalMinor: totals.estimatedTotalMinor,
      currency,
      checkoutEnabled: offer.checkoutEnabled,
    };
  });

  const packageColumns: ReadonlyArray<DataListColumn<PackageRow>> = [
    {
      key: 'name',
      header: t('name'),
      cell: (row) => (
        <div>
          <p className="text-ink font-medium">{row.name}</p>
          <p className="text-muted font-mono text-xs">{row.id}</p>
        </div>
      ),
    },
    {
      key: 'segment',
      header: t('segment'),
      cell: (row) => t(`segments.${row.segment}`),
    },
    {
      key: 'status',
      header: t('status'),
      cell: (row) => (
        <Badge tone={row.status === 'published' ? 'success' : 'neutral'}>{row.status}</Badge>
      ),
    },
    {
      key: 'fee',
      header: t('bdoorFee'),
      cell: (row) =>
        format.number(row.bdoorMinor / 100, {
          style: 'currency',
          currency: 'BDT',
          currencyDisplay: 'code',
        }),
    },
    {
      key: 'checkout',
      header: t('checkout'),
      cell: (row) => (row.checkoutEnabled ? t('enabled') : t('disabled')),
    },
  ];

  const offerColumns: ReadonlyArray<DataListColumn<OfferRow>> = [
    {
      key: 'route',
      header: t('route'),
      cell: (row) => (
        <div>
          <p className="text-ink font-medium">{row.route}</p>
          <p className="text-muted text-xs">{row.countryCode}</p>
        </div>
      ),
    },
    {
      key: 'status',
      header: t('status'),
      cell: (row) => <Badge tone="neutral">{row.status}</Badge>,
    },
    {
      key: 'total',
      header: t('estimatedTotal'),
      cell: (row) =>
        format.number(row.totalMinor / 100, {
          style: 'currency',
          currency: row.currency,
          currencyDisplay: 'code',
        }),
    },
    {
      key: 'checkout',
      header: t('checkout'),
      cell: (row) => (row.checkoutEnabled ? t('enabled') : t('disabled')),
    },
  ];

  return (
    <div className="flex flex-col gap-8">
      <PageHeading title={t('title')} description={t('description')} />

      <Alert tone="info">{t('catalogNotice')}</Alert>

      <section>
        <h2 className="text-ink text-lg font-semibold">{t('bangladeshHeading')}</h2>
        {packageRows.length === 0 ? (
          <EmptyState icon={<Tags className="size-5" />} title={t('empty')} />
        ) : (
          <DataList
            rows={packageRows}
            columns={packageColumns}
            getRowKey={(row) => row.id}
            caption={t('bangladeshHeading')}
            empty={<EmptyState icon={<Tags className="size-5" />} title={t('empty')} />}
            className="mt-4"
          />
        )}
      </section>

      <section>
        <h2 className="text-ink text-lg font-semibold">{t('internationalHeading')}</h2>
        <DataList
          rows={offerRows}
          columns={offerColumns}
          getRowKey={(row) => row.id}
          caption={t('internationalHeading')}
          empty={<EmptyState icon={<Tags className="size-5" />} title={t('empty')} />}
          className="mt-4"
        />
      </section>
    </div>
  );
}
