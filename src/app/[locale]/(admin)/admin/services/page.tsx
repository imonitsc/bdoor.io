import type { Metadata } from 'next';
import { getFormatter, getTranslations, setRequestLocale } from 'next-intl/server';
import { AlertTriangle, Tags } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { Alert } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { DataList, type DataListColumn } from '@/components/ui/data-list';
import { EmptyState } from '@/components/ui/empty-state';
import { PageHeading } from '@/components/dashboard/page-heading';
import { requireCapability } from '@/lib/auth/session';
import { createClient } from '@/lib/supabase/server';

export const metadata: Metadata = { robots: { index: false, follow: false } };

type ServiceRow = {
  id: string;
  slug: string;
  name: string;
  status: string;
  startingFee: number | null;
  timeReviewedAt: string | null;
  nextReviewDue: string | null;
  internalSourceRef: string | null;
  reviewOverdue: boolean;
};

export default async function AdminServicesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  await requireCapability('service.manage');

  const [t, tCommon, format] = await Promise.all([
    getTranslations('admin.services'),
    getTranslations('common'),
    getFormatter(),
  ]);

  const supabase = await createClient();
  const { data } = await supabase
    .from('services')
    .select(
      'id, slug, name_en, name_bn, status, starting_fee_bdt, time_reviewed_at, next_review_due, internal_source_ref',
    )
    .order('sort_order');

  const today = new Date().toISOString().slice(0, 10);

  const rows: ServiceRow[] = (data ?? []).map((row) => ({
    id: row.id,
    slug: row.slug,
    name: locale === 'bn' ? row.name_bn : row.name_en,
    status: row.status,
    startingFee: row.starting_fee_bdt,
    timeReviewedAt: row.time_reviewed_at,
    nextReviewDue: row.next_review_due,
    internalSourceRef: row.internal_source_ref,
    reviewOverdue: Boolean(row.next_review_due && row.next_review_due < today),
  }));

  const overdue = rows.filter((row) => row.reviewOverdue);

  const columns: ReadonlyArray<DataListColumn<ServiceRow>> = [
    {
      key: 'name',
      header: t('title'),
      cell: (row) => (
        <div className="min-w-0">
          <p className="text-ink truncate font-medium">{row.name}</p>
          <Link
            href={`/services/${row.slug}`}
            className="text-primary truncate rounded font-mono text-xs underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus)]"
          >
            /{row.slug}
          </Link>
        </div>
      ),
    },
    {
      key: 'status',
      header: t('publishState'),
      cell: (row) => (
        <Badge
          tone={
            row.status === 'published'
              ? 'success'
              : row.status === 'coming_soon'
                ? 'warning'
                : 'neutral'
          }
        >
          {row.status}
        </Badge>
      ),
    },
    {
      key: 'fee',
      header: tCommon('estimated'),
      cell: (row) => (row.startingFee !== null ? format.number(row.startingFee, 'bdt') : '—'),
    },
    {
      key: 'review',
      header: t('lastReviewed', { date: '', name: '' }).trim(),
      cell: (row) => (
        <span className={row.reviewOverdue ? 'text-danger font-medium' : 'text-muted'}>
          {row.nextReviewDue ? format.dateTime(new Date(row.nextReviewDue), 'short') : '—'}
        </span>
      ),
    },
    {
      key: 'source',
      header: t('sourceReference'),
      hideOnCard: true,
      cell: (row) => (
        <span className="text-muted line-clamp-2 text-xs">{row.internalSourceRef ?? '—'}</span>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <PageHeading title={t('title')} description={t('sourceHelp')} />

      {overdue.length > 0 ? (
        <Alert tone="warning" title={t('reviewOverdue')}>
          <ul className="mt-1 flex flex-col gap-1">
            {overdue.map((row) => (
              <li key={row.id}>{row.name}</li>
            ))}
          </ul>
        </Alert>
      ) : null}

      <Alert tone="neutral" icon={<AlertTriangle className="size-5" />}>
        {t('sourceHelp')}
      </Alert>

      <DataList
        rows={rows}
        columns={columns}
        getRowKey={(row) => row.id}
        caption={t('title')}
        empty={<EmptyState icon={<Tags className="size-5" />} title={tCommon('noResults')} />}
      />
    </div>
  );
}
