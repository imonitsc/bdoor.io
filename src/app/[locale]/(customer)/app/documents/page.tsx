import type { Metadata } from 'next';
import { getFormatter, getTranslations, setRequestLocale } from 'next-intl/server';
import { FileText, ShieldCheck } from 'lucide-react';
import { Alert } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { DataList, type DataListColumn } from '@/components/ui/data-list';
import { EmptyState } from '@/components/ui/empty-state';
import { PageHeading } from '@/components/dashboard/page-heading';
import { DocumentStatusBadge } from '@/components/dashboard/status-badge';
import { UploadForm } from '@/components/documents/upload-form';
import { DownloadButton } from '@/components/documents/download-button';
import { requireCustomerOrganization } from '@/lib/auth/require-organization';
import { createClient } from '@/lib/supabase/server';
import type { Enums } from '@/types/database';

export const metadata: Metadata = { robots: { index: false, follow: false } };

type DocumentRow = {
  id: string;
  title: string;
  category: string;
  status: Enums<'document_status'>;
  createdAt: string;
  scanStatus: Enums<'document_scan_status'> | null;
};

export default async function DocumentsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ case?: string; request?: string }>;
}) {
  const [{ locale }, query] = await Promise.all([params, searchParams]);
  setRequestLocale(locale);

  const [{ active }, t, tCommon, format] = await Promise.all([
    requireCustomerOrganization(),
    getTranslations('workspace.documents'),
    getTranslations('common'),
    getFormatter(),
  ]);

  const supabase = await createClient();

  const [documentsResult, requestsResult] = await Promise.all([
    supabase
      .from('documents')
      .select('id, title, category, status, created_at, document_versions(scan_status, version_no)')
      .order('created_at', { ascending: false })
      .limit(100),
    supabase
      .from('document_requests')
      .select('id, label_en, label_bn, status, due_on, case_id, is_mandatory')
      .in('status', ['requested', 'replacement_requested'])
      .order('due_on', { nullsFirst: false }),
  ]);

  type Raw = {
    id: string;
    title: string;
    category: string;
    status: Enums<'document_status'>;
    created_at: string;
    document_versions: Array<{ scan_status: Enums<'document_scan_status'>; version_no: number }>;
  };

  const documents: DocumentRow[] = ((documentsResult.data ?? []) as unknown as Raw[]).map((row) => {
    const latest = [...(row.document_versions ?? [])].sort(
      (a, b) => b.version_no - a.version_no,
    )[0];
    return {
      id: row.id,
      title: row.title,
      category: row.category,
      status: row.status,
      createdAt: row.created_at,
      scanStatus: latest?.scan_status ?? null,
    };
  });

  const requests = requestsResult.data ?? [];
  const label = (en: string, bn: string) => (locale === 'bn' ? bn : en);

  const columns: ReadonlyArray<DataListColumn<DocumentRow>> = [
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
      cell: (row) =>
        row.scanStatus === 'clean' ? (
          <Badge tone="success" icon={<ShieldCheck className="size-3" />}>
            {t('scanClean')}
          </Badge>
        ) : row.scanStatus === 'infected' || row.scanStatus === 'quarantined' ? (
          <Badge tone="danger">{t('scanQuarantined')}</Badge>
        ) : (
          <Badge tone="neutral">{t('scanPending')}</Badge>
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
      <PageHeading title={t('title')} description={t('downloadNote')} />

      {requests.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle as="h2">{t('requested')}</CardTitle>
            <CardDescription>{t('whoSeesThisBody')}</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="divide-border divide-y">
              {requests.map((request) => (
                <li
                  key={request.id}
                  className="flex flex-wrap items-center justify-between gap-3 py-3"
                >
                  <div className="min-w-0">
                    <p className="text-ink text-sm">
                      {label(request.label_en, request.label_bn)}
                      {!request.is_mandatory ? (
                        <span className="text-muted ms-2 text-xs">({tCommon('optional')})</span>
                      ) : null}
                    </p>
                    {request.due_on ? (
                      <p className="text-muted text-xs">
                        {tCommon('dueDate')}: {format.dateTime(new Date(request.due_on), 'short')}
                      </p>
                    ) : null}
                  </div>
                  <DocumentStatusBadge status={request.status} />
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle as="h2">{t('uploadCta')}</CardTitle>
        </CardHeader>
        <CardContent>
          <UploadForm
            organizationId={active.organizationId}
            caseId={query.case}
            requestId={query.request}
          />
        </CardContent>
      </Card>

      <section>
        <h2 className="text-ink text-lg font-semibold">{t('uploaded')}</h2>
        <div className="mt-4">
          <DataList
            rows={documents}
            columns={columns}
            getRowKey={(row) => row.id}
            caption={t('title')}
            empty={<EmptyState icon={<FileText className="size-5" />} title={t('noDocuments')} />}
            rowHref={(row) => <DownloadButton documentId={row.id} />}
          />
        </div>
      </section>

      <Alert tone="neutral">{t('downloadNote')}</Alert>
    </div>
  );
}
