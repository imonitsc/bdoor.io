import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import { AlertResolveButton, DocumentControls } from '@/components/admin/ai-registry-controls';
import { PageHeading } from '@/components/dashboard/page-heading';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Table, TBody, TD, TH, THead, TR } from '@/components/ui/table';
import { listDocuments, type DocumentLifecycle } from '@/features/ai/registry/documents';
import { listAbandonedJobs, listOpenAlerts } from '@/features/ai/registry/coverage';
import { Link } from '@/i18n/navigation';
import { requireCapability } from '@/lib/auth/session';

export const metadata: Metadata = { robots: { index: false, follow: false } };

const LIFECYCLE_TONE: Record<
  DocumentLifecycle,
  'neutral' | 'info' | 'success' | 'warning' | 'danger'
> = {
  discovered: 'neutral',
  downloaded: 'neutral',
  extracted: 'info',
  review_required: 'warning',
  approved: 'info',
  published: 'success',
  superseded: 'neutral',
  withdrawn: 'danger',
};

/**
 * Registry documents: every official document version we track, with its
 * lifecycle, its version links, and the alerts a reviewer must clear.
 */
export default async function AdminAiDocumentsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  await requireCapability('content.publish');

  const t = await getTranslations('admin.aiRegistry');
  const [documents, alerts, abandoned] = await Promise.all([
    listDocuments(),
    listOpenAlerts(),
    listAbandonedJobs(20),
  ]);

  return (
    <div className="space-y-8">
      <PageHeading title={t('documentsTitle')} description={t('documentsDescription')} />

      {alerts.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>{t('alertsTitle', { count: alerts.length })}</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="divide-border divide-y">
              {alerts.map((alert) => (
                <li key={alert.id} className="flex items-start justify-between gap-3 py-2.5">
                  <div>
                    <p className="text-ink text-sm">{alert.summary}</p>
                    <p className="text-muted mt-0.5 text-xs">
                      {t(`alertTypes.${alert.alert_type}`)} · {alert.created_at.slice(0, 10)}
                    </p>
                  </div>
                  <AlertResolveButton alertId={alert.id} />
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : null}

      {abandoned.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>{t('failedJobsTitle', { count: abandoned.length })}</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="divide-border divide-y">
              {abandoned.map((job) => (
                <li key={job.id} className="py-2.5">
                  <p className="text-ink text-sm">
                    {job.job_type} · {job.error_code ?? 'unknown'}
                  </p>
                  <p className="text-muted mt-0.5 text-xs">{job.error_detail}</p>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>{t('documentsTitle')}</CardTitle>
        </CardHeader>
        <CardContent>
          {documents.length === 0 ? (
            <EmptyState title={t('documentsEmpty')} description={t('documentsEmptyBody')} />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <THead>
                  <TR>
                    <TH>{t('columns.document')}</TH>
                    <TH>{t('columns.reference')}</TH>
                    <TH>{t('columns.lifecycle')}</TH>
                    <TH>{t('columns.dates')}</TH>
                    <TH>{t('columns.actions')}</TH>
                  </TR>
                </THead>
                <TBody>
                  {documents.map((document) => (
                    <TR key={document.id}>
                      <TD>
                        <Link
                          href={`/admin/ai/documents/${document.id}`}
                          className="text-ink font-medium underline-offset-2 hover:underline"
                        >
                          {document.official_title}
                        </Link>
                        <span className="text-muted block text-xs">
                          {document.issuing_institution} · {document.source_kind} ·{' '}
                          {t('tier', { tier: document.authority_tier })}
                        </span>
                      </TD>
                      <TD className="text-muted text-xs">{document.reference_number ?? '—'}</TD>
                      <TD>
                        <Badge tone={LIFECYCLE_TONE[document.lifecycle]}>
                          {t(`lifecycle.${document.lifecycle}`)}
                        </Badge>
                        {document.currency === 'proposed' ? (
                          <Badge tone="warning" className="ms-1.5">
                            {t('proposed')}
                          </Badge>
                        ) : null}
                        {document.previous_version_id ? (
                          <Badge tone="info" className="ms-1.5">
                            {t('newVersion')}
                          </Badge>
                        ) : null}
                      </TD>
                      <TD className="text-muted text-xs">
                        {document.effective_date
                          ? t('effective', { date: document.effective_date })
                          : t('effectiveUnknown')}
                        {document.last_error ? (
                          <span className="text-danger block">{document.last_error}</span>
                        ) : null}
                      </TD>
                      <TD>
                        <DocumentControls documentId={document.id} lifecycle={document.lifecycle} />
                      </TD>
                    </TR>
                  ))}
                </TBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
