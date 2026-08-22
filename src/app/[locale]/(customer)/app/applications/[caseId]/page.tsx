import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getFormatter, getTranslations, setRequestLocale } from 'next-intl/server';
import {
  Building2,
  CheckCircle2,
  CircleDot,
  Clock,
  Landmark,
  PauseCircle,
  ShieldCheck,
} from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { Alert } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PageHeading } from '@/components/dashboard/page-heading';
import { CaseStatusBadge, DocumentStatusBadge } from '@/components/dashboard/status-badge';
import { IndependenceDisclosure } from '@/components/layout/disclosure';
import { requireCustomerOrganization } from '@/lib/auth/require-organization';
import { getCaseDetail } from '@/features/cases/queries';
import { APP_ROUTES } from '@/lib/navigation';

export const metadata: Metadata = { robots: { index: false, follow: false } };

const MILESTONE_ICON = {
  complete: CheckCircle2,
  in_progress: CircleDot,
  blocked: PauseCircle,
  pending: CircleDot,
  skipped: CircleDot,
} as const;

export default async function CaseDetailPage({
  params,
}: {
  params: Promise<{ locale: string; caseId: string }>;
}) {
  const { locale, caseId } = await params;
  setRequestLocale(locale);
  await requireCustomerOrganization();

  const [detail, t, tCommon, tNav, tDocuments, tPartner, tRoles, format] = await Promise.all([
    getCaseDetail(caseId),
    getTranslations('workspace.case'),
    getTranslations('common'),
    getTranslations('workspace.nav'),
    getTranslations('workspace.documents'),
    getTranslations('partnerWorkspace.assignment'),
    getTranslations('howItWorksPage.responsibilities'),
    getFormatter(),
  ]);

  if (!detail) notFound();

  const { summary } = detail;
  const label = (en: string, bn: string) => (locale === 'bn' ? bn : en);
  const openRequests = detail.documentRequests.filter(
    (r) => r.status === 'requested' || r.status === 'replacement_requested',
  );

  return (
    <div className="flex flex-col gap-6">
      <PageHeading
        breadcrumb={
          <nav aria-label={tCommon('breadcrumb')}>
            <ol className="flex items-center gap-2 text-sm text-muted">
              <li>
                <Link
                  href={APP_ROUTES.applications}
                  className="rounded hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus)]"
                >
                  {tNav('applications')}
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li className="font-mono text-ink" aria-current="page">
                {summary.reference}
              </li>
            </ol>
          </nav>
        }
        title={summary.title}
        description={
          <span className="flex flex-wrap items-center gap-3">
            <CaseStatusBadge status={summary.status} />
            <span>
              {t('openedOn')}: {format.dateTime(new Date(summary.openedAt), 'short')}
            </span>
          </span>
        }
      />

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">{t('timeline')}</p>
          <p className="mt-2 text-2xl font-semibold text-ink">{summary.progress.percent}%</p>
          <Progress className="mt-3" value={summary.progress.percent} label={t('timeline')} />
        </Card>

        <Card className="p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">
            {t('estimatedCompletion')}
          </p>
          {summary.estimate.available ? (
            summary.estimate.paused ? (
              <p className="mt-2 flex items-start gap-2 text-sm text-warning">
                <PauseCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                {t('estimatePaused', {
                  reason: t(`waitingReasons.${summary.estimate.pausedReason}`),
                })}
              </p>
            ) : (
              <p className="mt-2 flex items-center gap-2 text-sm text-ink">
                <Clock className="size-4 text-muted" aria-hidden="true" />
                {format.dateTime(summary.estimate.earliestCompletion, 'short')} –{' '}
                {format.dateTime(summary.estimate.latestCompletion, 'short')}
              </p>
            )
          ) : (
            <p className="mt-2 text-sm text-muted">{tCommon('notSet')}</p>
          )}
          <p className="mt-2 text-xs leading-relaxed text-muted">{t('estimateNote')}</p>
        </Card>

        <Card className="p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">
            {t('assignedPartner')}
          </p>
          {detail.partner ? (
            <>
              <p className="mt-2 flex items-center gap-2 text-sm text-ink">
                <ShieldCheck className="size-4 text-accent" aria-hidden="true" />
                {detail.partner.organizationName}
              </p>
              <p className="mt-2">
                <Badge tone={detail.partner.authorized ? 'success' : 'warning'}>
                  {detail.partner.authorized
                    ? tDocuments('whoSeesThis')
                    : tPartner('pending')}
                </Badge>
              </p>
            </>
          ) : (
            <p className="mt-2 text-sm text-muted">{t('noPartner')}</p>
          )}
        </Card>
      </div>

      {openRequests.length > 0 ? (
        <Alert tone="warning" title={t('actions')}>
          <ul className="mt-1 flex flex-col gap-1">
            {openRequests.map((request) => (
              <li key={request.id}>{label(request.labelEn, request.labelBn)}</li>
            ))}
          </ul>
        </Alert>
      ) : null}

      <Tabs defaultValue="timeline">
        <TabsList aria-label={summary.title}>
          <TabsTrigger value="timeline">{t('timeline')}</TabsTrigger>
          <TabsTrigger value="documents">{t('documents')}</TabsTrigger>
          <TabsTrigger value="submissions">{t('submissions')}</TabsTrigger>
          <TabsTrigger value="activity">{t('activity')}</TabsTrigger>
        </TabsList>

        <TabsContent value="timeline">
          {detail.milestones.length === 0 ? (
            <EmptyState title={t('noMilestones')} />
          ) : (
            <ol className="flex flex-col gap-5 border-s border-border ps-6">
              {detail.milestones.map((milestone) => {
                const Icon = MILESTONE_ICON[milestone.status];
                const done = milestone.status === 'complete';
                return (
                  <li key={milestone.id} className="relative">
                    <span
                      className={`absolute -start-[2.1rem] top-0 flex size-6 items-center justify-center rounded-full border-2 border-canvas ${
                        done ? 'bg-success text-white' : 'bg-surface-sunken text-muted'
                      }`}
                      aria-hidden="true"
                    >
                      <Icon className="size-3.5" />
                    </span>
                    <p className={done ? 'text-sm text-muted line-through' : 'text-sm font-medium text-ink'}>
                      {label(milestone.labelEn, milestone.labelBn)}
                    </p>
                    <p className="mt-0.5 flex flex-wrap gap-x-3 text-xs text-muted">
                      <span>
                        {tRoles(
                          milestone.ownerKind === 'bdoor'
                            ? 'bdoor'
                            : milestone.ownerKind === 'partner'
                              ? 'partner'
                              : milestone.ownerKind === 'authority'
                                ? 'authority'
                                : 'customer',
                        )}
                      </span>
                      {milestone.dueOn ? (
                        <span>
                          {tCommon('dueDate')}: {format.dateTime(new Date(milestone.dueOn), 'short')}
                        </span>
                      ) : null}
                      {milestone.completedAt ? (
                        <span>{format.dateTime(new Date(milestone.completedAt), 'short')}</span>
                      ) : null}
                    </p>
                  </li>
                );
              })}
            </ol>
          )}
        </TabsContent>

        <TabsContent value="documents">
          {detail.documentRequests.length === 0 ? (
            <EmptyState title={tDocuments('noDocuments')} />
          ) : (
            <ul className="divide-y divide-border border-y border-border">
              {detail.documentRequests.map((request) => (
                <li key={request.id} className="flex flex-wrap items-center justify-between gap-3 py-3.5">
                  <div className="min-w-0">
                    <p className="text-sm text-ink">{label(request.labelEn, request.labelBn)}</p>
                    {request.dueOn ? (
                      <p className="text-xs text-muted">
                        {tCommon('dueDate')}: {format.dateTime(new Date(request.dueOn), 'short')}
                      </p>
                    ) : null}
                  </div>
                  <div className="flex items-center gap-3">
                    <DocumentStatusBadge status={request.status} />
                    <Link
                      href={`${APP_ROUTES.documents}?case=${summary.id}&request=${request.id}`}
                      className="rounded text-sm font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus)]"
                    >
                      {tDocuments('uploadCta')}
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </TabsContent>

        <TabsContent value="submissions">
          {detail.submissions.length === 0 ? (
            <EmptyState icon={<Landmark className="size-5" />} title={t('noSubmissions')} />
          ) : (
            <ul className="flex flex-col gap-3">
              {detail.submissions.map((submission) => (
                <li key={submission.id}>
                  <Card className="p-4">
                    <p className="text-sm font-medium text-ink">{submission.authorityName}</p>
                    <p className="mt-1 text-sm text-muted">{submission.submissionType}</p>
                    <dl className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-sm">
                      {submission.referenceNo ? (
                        <div>
                          <dt className="text-xs text-muted">{t('submissionRef')}</dt>
                          <dd className="font-mono text-ink">{submission.referenceNo}</dd>
                        </div>
                      ) : null}
                      <div>
                        <dt className="text-xs text-muted">{tCommon('created')}</dt>
                        <dd className="text-ink">
                          {format.dateTime(new Date(submission.submittedOn), 'short')}
                        </dd>
                      </div>
                    </dl>
                    <p className="mt-3">
                      <Badge tone="neutral">{t('receiptPending')}</Badge>
                    </p>
                  </Card>
                </li>
              ))}
            </ul>
          )}
        </TabsContent>

        <TabsContent value="activity">
          {detail.history.length === 0 ? (
            <EmptyState title={t('noMilestones')} />
          ) : (
            <ol className="flex flex-col gap-4">
              {detail.history.map((entry) => (
                <li key={entry.id} className="border-s-2 border-border ps-4">
                  <p className="flex flex-wrap items-center gap-2 text-sm">
                    <CaseStatusBadge status={entry.toStatus} />
                    <span className="text-muted">
                      {format.dateTime(new Date(entry.createdAt), 'withTime')}
                    </span>
                  </p>
                  {entry.publicNote ? (
                    <p className="mt-1.5 text-sm leading-relaxed text-ink">{entry.publicNote}</p>
                  ) : null}
                </li>
              ))}
            </ol>
          )}
        </TabsContent>
      </Tabs>

      {detail.services.length > 0 ? (
        <Card className="p-5">
          <CardHeader className="p-0">
            <CardTitle as="h2" className="flex items-center gap-2">
              <Building2 className="size-4 text-muted" aria-hidden="true" />
              {t('service')}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 pt-3">
            <ul className="flex flex-wrap gap-2">
              {detail.services.map((service) => (
                <li key={service.serviceId}>
                  <Badge tone={service.isPrimary ? 'info' : 'neutral'}>{service.name}</Badge>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : null}

      <IndependenceDisclosure />
    </div>
  );
}
