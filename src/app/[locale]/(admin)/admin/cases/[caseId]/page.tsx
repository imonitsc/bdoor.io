import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getFormatter, getTranslations, setRequestLocale } from 'next-intl/server';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PageHeading } from '@/components/dashboard/page-heading';
import { CaseStatusBadge, DocumentStatusBadge } from '@/components/dashboard/status-badge';
import {
  AssignPartnerControl,
  RecordSubmissionControl,
  RequestDocumentControl,
  TransitionControl,
} from '@/components/dashboard/case-controls';
import { requireStaff } from '@/lib/auth/session';
import { getCaseDetail } from '@/features/cases/queries';
import { createClient } from '@/lib/supabase/server';

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function AdminCaseDetail({
  params,
}: {
  params: Promise<{ locale: string; caseId: string }>;
}) {
  const { locale, caseId } = await params;
  setRequestLocale(locale);

  const [session, detail, t, tAdmin, tCase, format] = await Promise.all([
    requireStaff(),
    getCaseDetail(caseId),
    getTranslations('admin.nav'),
    getTranslations('admin.cases'),
    getTranslations('workspace.case'),
    getFormatter(),
  ]);

  if (!detail) notFound();

  const supabase = await createClient();

  const [partnersResult, historyResult] = await Promise.all([
    supabase
      .from('partners')
      .select('organization_id, legal_name, verification_status')
      .eq('verification_status', 'verified'),
    // Staff read the base table, which carries internal notes the customer view
    // deliberately omits.
    supabase
      .from('case_status_history')
      .select(
        'id, from_status, to_status, reason, public_note, internal_note, created_at, actor_kind',
      )
      .eq('case_id', caseId)
      .order('created_at', { ascending: false }),
  ]);

  const partners = (partnersResult.data ?? []).map((p) => ({
    id: p.organization_id,
    name: p.legal_name,
  }));
  const history = historyResult.data ?? [];
  const label = (en: string, bn: string) => (locale === 'bn' ? bn : en);

  const canTransition = session.capabilities.has('case.transition');
  const canManage = session.capabilities.has('case.manage');
  const canAssignPartner = session.capabilities.has('case.assign_partner');

  return (
    <div className="flex flex-col gap-6">
      <PageHeading
        title={detail.summary.title}
        description={
          <span className="flex flex-wrap items-center gap-3">
            <span className="font-mono">{detail.summary.reference}</span>
            <CaseStatusBadge status={detail.summary.status} />
            <span>{detail.summary.organizationName}</span>
          </span>
        }
        actions={
          canTransition ? (
            <TransitionControl caseId={detail.summary.id} status={detail.summary.status} />
          ) : undefined
        }
      />

      <Tabs defaultValue="overview">
        <TabsList aria-label={detail.summary.reference}>
          <TabsTrigger value="overview">{tCase('overview')}</TabsTrigger>
          <TabsTrigger value="documents">{tCase('documents')}</TabsTrigger>
          <TabsTrigger value="partner">{tCase('assignedPartner')}</TabsTrigger>
          <TabsTrigger value="submissions">{tCase('submissions')}</TabsTrigger>
          <TabsTrigger value="history">{tCase('activity')}</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="p-5">
              <p className="text-muted text-xs font-semibold tracking-wide uppercase">
                {tCase('timeline')}
              </p>
              <ul className="mt-3 flex flex-col gap-2">
                {detail.milestones.map((milestone) => (
                  <li
                    key={milestone.id}
                    className="flex items-center justify-between gap-3 text-sm"
                  >
                    <span className="text-ink">{label(milestone.labelEn, milestone.labelBn)}</span>
                    <Badge tone={milestone.status === 'complete' ? 'success' : 'neutral'}>
                      {milestone.status}
                    </Badge>
                  </li>
                ))}
              </ul>
            </Card>

            <Card className="p-5">
              <p className="text-muted text-xs font-semibold tracking-wide uppercase">
                {tCase('service')}
              </p>
              <ul className="mt-3 flex flex-wrap gap-2">
                {detail.services.map((service) => (
                  <li key={service.serviceId}>
                    <Badge tone={service.isPrimary ? 'info' : 'neutral'}>{service.name}</Badge>
                  </li>
                ))}
              </ul>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="documents">
          <div className="flex flex-col gap-5">
            <ul className="divide-border border-border divide-y border-y">
              {detail.documentRequests.map((request) => (
                <li key={request.id} className="flex items-center justify-between gap-3 py-3">
                  <span className="text-ink text-sm">
                    {label(request.labelEn, request.labelBn)}
                  </span>
                  <DocumentStatusBadge status={request.status} />
                </li>
              ))}
            </ul>

            {canManage ? (
              <Card className="p-5">
                <CardHeader className="p-0">
                  <CardTitle as="h2">{tAdmin('requestDocument')}</CardTitle>
                </CardHeader>
                <CardContent className="p-0 pt-4">
                  <RequestDocumentControl caseId={caseId} />
                </CardContent>
              </Card>
            ) : null}
          </div>
        </TabsContent>

        <TabsContent value="partner">
          <div className="flex flex-col gap-5">
            {detail.partner ? (
              <Card className="p-5">
                <p className="text-ink text-sm font-medium">{detail.partner.organizationName}</p>
                <p className="mt-2 flex flex-wrap gap-2">
                  <Badge tone="info">{detail.partner.status}</Badge>
                  <Badge tone={detail.partner.authorized ? 'success' : 'warning'}>
                    {detail.partner.authorized ? tCase('documents') : tCase('noPartner')}
                  </Badge>
                </p>
              </Card>
            ) : (
              <EmptyState title={tCase('noPartner')} />
            )}

            {canAssignPartner && !detail.partner ? (
              <Card className="p-5">
                <CardHeader className="p-0">
                  <CardTitle as="h2">{tAdmin('assignPartner')}</CardTitle>
                  <CardDescription>{tCase('noPartner')}</CardDescription>
                </CardHeader>
                <CardContent className="p-0 pt-4">
                  <AssignPartnerControl caseId={caseId} partners={partners} />
                </CardContent>
              </Card>
            ) : null}
          </div>
        </TabsContent>

        <TabsContent value="submissions">
          <div className="flex flex-col gap-5">
            {detail.submissions.length === 0 ? (
              <EmptyState title={tCase('noSubmissions')} />
            ) : (
              <ul className="divide-border border-border divide-y border-y">
                {detail.submissions.map((submission) => (
                  <li key={submission.id} className="py-3">
                    <p className="text-ink text-sm font-medium">{submission.authorityName}</p>
                    <p className="text-muted text-sm">
                      {submission.submissionType}
                      {submission.referenceNo ? ` · ${submission.referenceNo}` : ''}
                    </p>
                    <p className="text-muted text-xs">
                      {format.dateTime(new Date(submission.submittedOn), 'short')}
                    </p>
                  </li>
                ))}
              </ul>
            )}

            {canManage ? (
              <Card className="p-5">
                <CardHeader className="p-0">
                  <CardTitle as="h2">{tAdmin('recordSubmission')}</CardTitle>
                </CardHeader>
                <CardContent className="p-0 pt-4">
                  <RecordSubmissionControl caseId={caseId} />
                </CardContent>
              </Card>
            ) : null}
          </div>
        </TabsContent>

        <TabsContent value="history">
          <Alert tone="restricted" className="mb-4">
            {t('audit')}
          </Alert>
          {history.length === 0 ? (
            <EmptyState title={tCase('activity')} />
          ) : (
            <ol className="flex flex-col gap-4">
              {history.map((entry) => (
                <li key={entry.id} className="border-border border-s-2 ps-4">
                  <p className="flex flex-wrap items-center gap-2 text-sm">
                    <CaseStatusBadge status={entry.to_status} />
                    <span className="text-muted">
                      {format.dateTime(new Date(entry.created_at), 'withTime')} · {entry.actor_kind}
                    </span>
                  </p>
                  <p className="text-ink mt-1.5 text-sm">{entry.reason}</p>
                  {entry.public_note ? (
                    <p className="text-muted mt-1 text-sm">{entry.public_note}</p>
                  ) : null}
                  {entry.internal_note ? (
                    <p className="bg-warning-soft text-ink mt-1 rounded-[var(--radius-control)] p-2 text-sm">
                      {entry.internal_note}
                    </p>
                  ) : null}
                </li>
              ))}
            </ol>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
