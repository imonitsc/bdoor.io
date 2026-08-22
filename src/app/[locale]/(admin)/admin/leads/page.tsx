import type { Metadata } from 'next';
import { getFormatter, getTranslations, setRequestLocale } from 'next-intl/server';
import { UserRound } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { DataList, type DataListColumn } from '@/components/ui/data-list';
import { EmptyState } from '@/components/ui/empty-state';
import { PageHeading } from '@/components/dashboard/page-heading';
import { requireCapability } from '@/lib/auth/session';
import { createClient } from '@/lib/supabase/server';
import { countryName } from '@/features/intake/countries';

export const metadata: Metadata = { robots: { index: false, follow: false } };

type LeadRow = {
  id: string;
  fullName: string | null;
  email: string | null;
  country: string | null;
  intent: string | null;
  status: string;
  createdAt: string;
};

export default async function AdminLeadsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  await requireCapability('case.manage');

  const [t, tCommon, format] = await Promise.all([
    getTranslations('admin.nav'),
    getTranslations('common'),
    getFormatter(),
  ]);

  const supabase = await createClient();
  const { data } = await supabase
    .from('leads')
    .select('id, full_name, email, country, intent, status, created_at')
    .order('created_at', { ascending: false })
    .limit(100);

  const leads: LeadRow[] = (data ?? []).map((row) => ({
    id: row.id,
    fullName: row.full_name,
    email: row.email,
    country: row.country,
    intent: row.intent,
    status: row.status,
    createdAt: row.created_at,
  }));

  const columns: ReadonlyArray<DataListColumn<LeadRow>> = [
    {
      key: 'name',
      header: tCommon('search'),
      cell: (row) => (
        <div className="min-w-0">
          <p className="text-ink truncate font-medium">{row.fullName ?? '—'}</p>
          <p className="text-muted truncate text-xs">{row.email ?? ''}</p>
        </div>
      ),
    },
    { key: 'country', header: tCommon('language'), cell: (row) => countryName(row.country) },
    { key: 'intent', header: tCommon('actions'), cell: (row) => row.intent ?? '—' },
    {
      key: 'status',
      header: tCommon('status'),
      cell: (row) => (
        <Badge
          tone={
            row.status === 'new' ? 'warning' : row.status === 'converted' ? 'success' : 'neutral'
          }
        >
          {row.status}
        </Badge>
      ),
    },
    {
      key: 'created',
      header: tCommon('created'),
      cell: (row) => format.dateTime(new Date(row.createdAt), 'short'),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <PageHeading title={t('leads')} />
      <DataList
        rows={leads}
        columns={columns}
        getRowKey={(row) => row.id}
        caption={t('leads')}
        empty={<EmptyState icon={<UserRound className="size-5" />} title={tCommon('noResults')} />}
      />
    </div>
  );
}
