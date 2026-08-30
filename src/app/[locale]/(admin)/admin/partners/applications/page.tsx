import type { Metadata } from 'next';
import { getFormatter, getTranslations, setRequestLocale } from 'next-intl/server';
import { Inbox } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { Badge } from '@/components/ui/badge';
import { DataList, type DataListColumn } from '@/components/ui/data-list';
import { EmptyState } from '@/components/ui/empty-state';
import { PageHeading } from '@/components/dashboard/page-heading';
import { requireStaff } from '@/lib/auth/session';
import { createClient } from '@/lib/supabase/server';

export const metadata: Metadata = { robots: { index: false, follow: false } };

type ApplicationRow = {
  id: string;
  reference: string;
  legalName: string;
  firmCategory: string;
  jurisdictions: string[];
  status: string;
  submittedAt: string | null;
};

const STATUS_TONE: Record<string, 'success' | 'warning' | 'danger' | 'neutral'> = {
  submitted: 'warning',
  under_review: 'warning',
  needs_information: 'neutral',
  verification_in_progress: 'warning',
  approved: 'success',
  rejected: 'danger',
  suspended: 'danger',
};

export default async function ProviderApplicationsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  await requireStaff();

  const [t, tCommon, format] = await Promise.all([
    getTranslations('admin.providerApplications'),
    getTranslations('common'),
    getFormatter(),
  ]);

  // Drafts are the applicant's private workspace; the queue starts at
  // submission. Staff read is the only Data API access this table has.
  const supabase = await createClient();
  const { data } = await supabase
    .from('provider_applications')
    .select('id, reference, legal_name, firm_category, jurisdictions, status, submitted_at')
    .neq('status', 'draft')
    .order('submitted_at', { ascending: false, nullsFirst: false })
    .limit(200);

  const rows: ApplicationRow[] = (data ?? []).map((row) => ({
    id: row.id,
    reference: row.reference,
    legalName: row.legal_name || '—',
    firmCategory: row.firm_category,
    jurisdictions: row.jurisdictions,
    status: row.status,
    submittedAt: row.submitted_at,
  }));

  const columns: ReadonlyArray<DataListColumn<ApplicationRow>> = [
    {
      key: 'firm',
      header: t('firmColumn'),
      cell: (row) => (
        <div className="min-w-0">
          <Link
            href={`/admin/partners/applications/${row.id}`}
            className="text-ink hover:text-primary truncate font-medium underline-offset-4 hover:underline"
          >
            {row.legalName}
          </Link>
          <p className="text-muted truncate text-xs">
            {row.reference} · {row.firmCategory.replace(/_/g, ' ')}
          </p>
        </div>
      ),
    },
    {
      key: 'jurisdictions',
      header: t('jurisdictionsColumn'),
      cell: (row) => (
        <span className="flex flex-wrap gap-1">
          {row.jurisdictions.map((slug) => (
            <Badge key={slug} tone="neutral">
              {slug}
            </Badge>
          ))}
        </span>
      ),
    },
    {
      key: 'status',
      header: tCommon('status'),
      cell: (row) => (
        <Badge tone={STATUS_TONE[row.status] ?? 'neutral'}>{row.status.replace(/_/g, ' ')}</Badge>
      ),
    },
    {
      key: 'submitted',
      header: t('submittedColumn'),
      cell: (row) => (row.submittedAt ? format.dateTime(new Date(row.submittedAt), 'short') : '—'),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <PageHeading title={t('title')} description={t('description')} />
      <DataList
        rows={rows}
        columns={columns}
        getRowKey={(row) => row.id}
        caption={t('title')}
        empty={<EmptyState icon={<Inbox className="size-5" />} title={t('empty')} />}
      />
    </div>
  );
}
