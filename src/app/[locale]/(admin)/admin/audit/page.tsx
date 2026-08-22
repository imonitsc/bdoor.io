import type { Metadata } from 'next';
import { getFormatter, getTranslations, setRequestLocale } from 'next-intl/server';
import { ScrollText } from 'lucide-react';
import { Alert } from '@/components/ui/alert';
import { DataList, type DataListColumn } from '@/components/ui/data-list';
import { EmptyState } from '@/components/ui/empty-state';
import { PageHeading } from '@/components/dashboard/page-heading';
import { requireCapability } from '@/lib/auth/session';
import { createClient } from '@/lib/supabase/server';

export const metadata: Metadata = { robots: { index: false, follow: false } };

type AuditRow = {
  id: number;
  action: string;
  targetType: string;
  targetId: string | null;
  actorRole: string | null;
  correlationId: string | null;
  createdAt: string;
};

export default async function AdminAuditPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ action?: string }>;
}) {
  const [{ locale }, query] = await Promise.all([params, searchParams]);
  setRequestLocale(locale);
  await requireCapability('audit.read');

  const [t, format] = await Promise.all([getTranslations('admin.audit'), getFormatter()]);

  const supabase = await createClient();
  let request = supabase
    .from('audit_logs')
    .select('id, action, target_type, target_id, actor_role, correlation_id, created_at')
    .order('created_at', { ascending: false })
    .limit(200);

  if (query.action) request = request.eq('action', query.action);

  const { data } = await request;

  const rows: AuditRow[] = (data ?? []).map((row) => ({
    id: row.id,
    action: row.action,
    targetType: row.target_type,
    targetId: row.target_id,
    actorRole: row.actor_role,
    correlationId: row.correlation_id,
    createdAt: row.created_at,
  }));

  const columns: ReadonlyArray<DataListColumn<AuditRow>> = [
    {
      key: 'when',
      header: t('when'),
      cell: (row) => format.dateTime(new Date(row.createdAt), 'withTime'),
    },
    {
      key: 'action',
      header: t('action'),
      cell: (row) => <span className="font-mono text-xs">{row.action}</span>,
    },
    {
      key: 'target',
      header: t('target'),
      cell: (row) => (
        <div className="min-w-0">
          <p className="truncate text-sm">{row.targetType}</p>
          {row.targetId ? (
            <p className="text-muted truncate font-mono text-xs">{row.targetId}</p>
          ) : null}
        </div>
      ),
    },
    { key: 'actor', header: t('actor'), cell: (row) => row.actorRole ?? '—' },
    {
      key: 'correlation',
      header: t('correlationId'),
      hideOnCard: true,
      cell: (row) => (
        <span className="text-muted font-mono text-xs">{row.correlationId ?? '—'}</span>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <PageHeading title={t('title')} />
      <Alert tone="neutral">{t('immutableNote')}</Alert>
      <DataList
        rows={rows}
        columns={columns}
        getRowKey={(row) => String(row.id)}
        caption={t('title')}
        empty={<EmptyState icon={<ScrollText className="size-5" />} title={t('title')} />}
      />
    </div>
  );
}
