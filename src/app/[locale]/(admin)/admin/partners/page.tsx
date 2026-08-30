import type { Metadata } from 'next';
import { getFormatter, getTranslations, setRequestLocale } from 'next-intl/server';
import { Handshake } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { DataList, type DataListColumn } from '@/components/ui/data-list';
import { EmptyState } from '@/components/ui/empty-state';
import { PageHeading } from '@/components/dashboard/page-heading';
import { Link } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';
import { requireStaff } from '@/lib/auth/session';
import { createClient } from '@/lib/supabase/server';

export const metadata: Metadata = { robots: { index: false, follow: false } };

type PartnerRow = {
  id: string;
  legalName: string;
  practiceType: string;
  status: string;
  coverage: string[];
  dpaAcceptedAt: string | null;
  insuranceExpiresOn: string | null;
};

export default async function AdminPartnersPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  await requireStaff();

  const [t, tCommon, tApplications, format] = await Promise.all([
    getTranslations('admin.nav'),
    getTranslations('common'),
    getTranslations('admin.providerApplications'),
    getFormatter(),
  ]);

  // `payment_details` is intentionally not selected here: this screen is for
  // operations, and bank details are finance-restricted.
  const supabase = await createClient();
  const { data } = await supabase
    .from('partners')
    .select(
      'id, legal_name, practice_type, verification_status, geographic_coverage, dpa_accepted_at, insurance_expires_on',
    )
    .order('legal_name');

  const rows: PartnerRow[] = (data ?? []).map((row) => ({
    id: row.id,
    legalName: row.legal_name,
    practiceType: row.practice_type,
    status: row.verification_status,
    coverage: row.geographic_coverage,
    dpaAcceptedAt: row.dpa_accepted_at,
    insuranceExpiresOn: row.insurance_expires_on,
  }));

  const columns: ReadonlyArray<DataListColumn<PartnerRow>> = [
    {
      key: 'name',
      header: t('partners'),
      cell: (row) => (
        <div className="min-w-0">
          <p className="text-ink truncate font-medium">{row.legalName}</p>
          <p className="text-muted truncate text-xs">{row.practiceType.replace(/_/g, ' ')}</p>
        </div>
      ),
    },
    {
      key: 'status',
      header: tCommon('status'),
      cell: (row) => (
        <Badge
          tone={
            row.status === 'verified'
              ? 'success'
              : row.status === 'suspended'
                ? 'danger'
                : 'warning'
          }
        >
          {row.status}
        </Badge>
      ),
    },
    {
      key: 'coverage',
      header: tCommon('none'),
      cell: (row) => (
        <span className="flex flex-wrap gap-1">
          {row.coverage.map((area) => (
            <Badge key={area} tone="neutral">
              {area}
            </Badge>
          ))}
        </span>
      ),
    },
    {
      key: 'dpa',
      header: tCommon('updated'),
      cell: (row) =>
        row.dpaAcceptedAt ? format.dateTime(new Date(row.dpaAcceptedAt), 'short') : '—',
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <PageHeading
        title={t('partners')}
        actions={
          <Button asChild variant="secondary" size="sm">
            <Link href="/admin/partners/applications">{tApplications('title')}</Link>
          </Button>
        }
      />
      <DataList
        rows={rows}
        columns={columns}
        getRowKey={(row) => row.id}
        caption={t('partners')}
        empty={<EmptyState icon={<Handshake className="size-5" />} title={tCommon('noResults')} />}
      />
    </div>
  );
}
