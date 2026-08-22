import type { Metadata } from 'next';
import { getFormatter, getTranslations, setRequestLocale } from 'next-intl/server';
import { FileText } from 'lucide-react';
import { Alert } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { DataList, type DataListColumn } from '@/components/ui/data-list';
import { EmptyState } from '@/components/ui/empty-state';
import { PageHeading } from '@/components/dashboard/page-heading';
import { DocumentStatusBadge } from '@/components/dashboard/status-badge';
import { DownloadButton } from '@/components/documents/download-button';
import { requireCapability } from '@/lib/auth/session';
import { createClient } from '@/lib/supabase/server';
import { scanningIsConfigured } from '@/lib/malware';
import type { Enums } from '@/types/database';

export const metadata: Metadata = { robots: { index: false, follow: false } };

type Row = {
  id: string;
  title: string;
  category: string;
  status: Enums<'document_status'>;
  scanStatus: Enums<'document_scan_status'> | null;
  createdAt: string;
};

export default async function AdminDocumentsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  await requireCapability('document.review');

  const [t, tCommon, format] = await Promise.all([
    getTranslations('workspace.documents'),
    getTranslations('common'),
    getFormatter(),
  ]);

  const supabase = await createClient();
  const { data } = await supabase
    .from('documents')
    .select('id, title, category, status, created_at, document_versions(scan_status, version_no)')
    .order('created_at', { ascending: false })
    .limit(200);

  type Raw = Row & {
    created_at: string;
    document_versions: Array<{ scan_status: Enums<'document_scan_status'>; version_no: number }>;
  };

  const rows: Row[] = ((data ?? []) as unknown as Raw[]).map((row) => {
    const latest = [...(row.document_versions ?? [])].sort(
      (a, b) => b.version_no - a.version_no,
    )[0];
    return {
      id: row.id,
      title: row.title,
      category: row.category,
      status: row.status,
      scanStatus: latest?.scan_status ?? null,
      createdAt: row.created_at,
    };
  });

  const quarantined = rows.filter(
    (row) => row.scanStatus === 'infected' || row.scanStatus === 'quarantined',
  );

  const columns: ReadonlyArray<DataListColumn<Row>> = [
    {
      key: 'title',
      header: t('categoryLabel'),
      cell: (row) => (
        <div className="min-w-0">
          <p className="text-ink truncate font-medium">{row.title}</p>
          <p className="text-muted text-xs">{row.category}</p>
        </div>
      ),
    },
    {
      key: 'status',
      header: tCommon('status'),
      cell: (row) => <DocumentStatusBadge status={row.status} />,
    },
    {
      key: 'scan',
      header: t('scanPending'),
      cell: (row) => (
        <Badge
          tone={
            row.scanStatus === 'clean'
              ? 'success'
              : row.scanStatus === 'infected' || row.scanStatus === 'quarantined'
                ? 'danger'
                : 'neutral'
          }
        >
          {row.scanStatus ?? 'pending'}
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
      <PageHeading title={t('title')} />

      {!scanningIsConfigured() ? (
        <Alert tone="warning">
          No malware scanner is configured, so uploads stay in a pending scan state. They are never
          marked clean without a scan.
        </Alert>
      ) : null}

      {quarantined.length > 0 ? (
        <Alert tone="danger" title={t('scanQuarantined')}>
          {quarantined.length}
        </Alert>
      ) : null}

      <DataList
        rows={rows}
        columns={columns}
        getRowKey={(row) => row.id}
        caption={t('title')}
        empty={<EmptyState icon={<FileText className="size-5" />} title={t('noDocuments')} />}
        rowHref={(row) => <DownloadButton documentId={row.id} action="preview" />}
      />
    </div>
  );
}
