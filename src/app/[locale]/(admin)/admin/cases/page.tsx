import type { Metadata } from 'next';
import { getFormatter, getTranslations, setRequestLocale } from 'next-intl/server';
import { Briefcase } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';
import { DataList, type DataListColumn } from '@/components/ui/data-list';
import { EmptyState } from '@/components/ui/empty-state';
import { PageHeading } from '@/components/dashboard/page-heading';
import { CaseStatusBadge } from '@/components/dashboard/status-badge';
import { requireStaff } from '@/lib/auth/session';
import { listCases, type CaseSummary } from '@/features/cases/queries';
import { ADMIN_ROUTES } from '@/lib/navigation';

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function AdminCasesPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ show?: string }>;
}) {
  const [{ locale }, { show }] = await Promise.all([params, searchParams]);
  setRequestLocale(locale);
  await requireStaff();

  const [t, tCommon, tCase, cases, format] = await Promise.all([
    getTranslations('admin.nav'),
    getTranslations('common'),
    getTranslations('workspace.case'),
    listCases({ includeClosed: show === 'all' }),
    getFormatter(),
  ]);

  const columns: ReadonlyArray<DataListColumn<CaseSummary>> = [
    {
      key: 'reference',
      header: tCase('reference'),
      cell: (row) => <span className="font-mono text-xs">{row.reference}</span>,
    },
    {
      key: 'title',
      header: tCase('service'),
      cell: (row) => (
        <div className="min-w-0">
          <p className="text-ink truncate font-medium">{row.title}</p>
          <p className="text-muted truncate text-xs">{row.organizationName}</p>
        </div>
      ),
    },
    {
      key: 'status',
      header: tCommon('status'),
      cell: (row) => <CaseStatusBadge status={row.status} />,
    },
    {
      key: 'progress',
      header: tCase('timeline'),
      cell: (row) => `${row.progress.completed}/${row.progress.total}`,
    },
    {
      key: 'updated',
      header: tCommon('updated'),
      cell: (row) => format.dateTime(new Date(row.updatedAt), 'short'),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <PageHeading
        title={t('cases')}
        actions={
          <Button asChild variant="secondary">
            <Link href={show === 'all' ? ADMIN_ROUTES.cases : `${ADMIN_ROUTES.cases}?show=all`}>
              {show === 'all' ? tCommon('filter') : tCommon('viewAll')}
            </Link>
          </Button>
        }
      />

      <DataList
        rows={cases}
        columns={columns}
        getRowKey={(row) => row.id}
        caption={t('cases')}
        empty={<EmptyState icon={<Briefcase className="size-5" />} title={tCommon('noResults')} />}
        rowHref={(row) => (
          <Button asChild variant="secondary" size="sm">
            <Link href={`${ADMIN_ROUTES.cases}/${row.id}`}>{tCommon('view')}</Link>
          </Button>
        )}
      />
    </div>
  );
}
