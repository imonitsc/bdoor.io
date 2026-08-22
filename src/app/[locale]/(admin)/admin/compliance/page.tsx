import type { Metadata } from 'next';
import { getFormatter, getTranslations, setRequestLocale } from 'next-intl/server';
import { CalendarCheck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { DataList, type DataListColumn } from '@/components/ui/data-list';
import { EmptyState } from '@/components/ui/empty-state';
import { PageHeading } from '@/components/dashboard/page-heading';
import { requireStaff } from '@/lib/auth/session';
import { createClient } from '@/lib/supabase/server';
import { daysUntil } from '@/features/cases/deadlines';

export const metadata: Metadata = { robots: { index: false, follow: false } };

type ObligationRow = {
  id: string;
  label: string;
  authority: string | null;
  dueOn: string;
  status: string;
  responsible: string;
  source: string;
};

export default async function AdminCompliancePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  await requireStaff();

  const [t, tCommon, format] = await Promise.all([
    getTranslations('workspace.compliance'),
    getTranslations('common'),
    getFormatter(),
  ]);

  const supabase = await createClient();
  const { data } = await supabase
    .from('compliance_obligations')
    .select('id, label_en, label_bn, authority_name, due_on, status, responsible_kind, source')
    .in('status', ['upcoming', 'due', 'overdue', 'in_progress'])
    .order('due_on')
    .limit(200);

  const now = new Date();
  const rows: ObligationRow[] = (data ?? []).map((row) => ({
    id: row.id,
    label: locale === 'bn' ? row.label_bn : row.label_en,
    authority: row.authority_name,
    dueOn: row.due_on,
    status: row.status,
    responsible: row.responsible_kind,
    source: row.source,
  }));

  const columns: ReadonlyArray<DataListColumn<ObligationRow>> = [
    {
      key: 'label',
      header: t('title'),
      cell: (row) => (
        <div className="min-w-0">
          <p className="text-ink truncate font-medium">{row.label}</p>
          {row.authority ? <p className="text-muted truncate text-xs">{row.authority}</p> : null}
        </div>
      ),
    },
    {
      key: 'due',
      header: tCommon('dueDate'),
      cell: (row) => {
        const days = daysUntil(new Date(row.dueOn), now);
        return (
          <span
            className={
              days < 0 ? 'text-danger font-medium' : days <= 14 ? 'text-warning font-medium' : ''
            }
          >
            {format.dateTime(new Date(row.dueOn), 'short')}
          </span>
        );
      },
    },
    {
      key: 'status',
      header: tCommon('status'),
      cell: (row) => (
        <Badge
          tone={row.status === 'overdue' ? 'danger' : row.status === 'due' ? 'warning' : 'neutral'}
        >
          {row.status}
        </Badge>
      ),
    },
    { key: 'responsible', header: t('responsible'), cell: (row) => row.responsible },
    {
      key: 'source',
      header: tCommon('created'),
      hideOnCard: true,
      // A `verified_rule` obligation came from a rule an admin approved; an
      // `admin` one was entered by hand. Nothing here is auto-generated from a
      // guess, and the column makes that visible.
      cell: (row) => (
        <Badge tone={row.source === 'verified_rule' ? 'success' : 'neutral'}>{row.source}</Badge>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <PageHeading title={t('title')} />
      <DataList
        rows={rows}
        columns={columns}
        getRowKey={(row) => row.id}
        caption={t('title')}
        empty={
          <EmptyState icon={<CalendarCheck className="size-5" />} title={t('noObligations')} />
        }
      />
    </div>
  );
}
