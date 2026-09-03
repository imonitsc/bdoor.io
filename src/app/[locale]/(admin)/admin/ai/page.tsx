import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Gauge, Sparkles } from 'lucide-react';

import {
  AiImportButton,
  AiPublishSeedButton,
  AiSourceControls,
} from '@/components/admin/ai-source-controls';
import { PageHeading } from '@/components/dashboard/page-heading';
import { Alert } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Table, TBody, TD, TH, THead, TR } from '@/components/ui/table';
import { budgetLimits } from '@/features/ai/budget';
import { aiEnabled } from '@/features/ai/chat';
import {
  citationAuditQueue,
  listSources,
  listUnanswered,
  usageSummary,
  type SourceStatus,
} from '@/features/ai/knowledge';
import {
  latencyReport,
  LATENCY_TARGETS,
  type LatencyReport,
  type LatencyStat,
} from '@/features/ai/latency';
import { coverageReport } from '@/features/ai/registry/coverage';
import { Link } from '@/i18n/navigation';
import { requireCapability } from '@/lib/auth/session';

export const metadata: Metadata = { robots: { index: false, follow: false } };

/** One millisecond number, rendered in seconds because the targets are. */
function ms(value: number | null): string {
  return value === null ? '—' : `${(value / 1000).toFixed(2)}s`;
}

/**
 * The five §7.3 numbers in the order the requirement lists them. Retrieval,
 * rerank and model have no published target of their own — they exist to say
 * where a missed answer target went.
 */
function latencyRows(report: LatencyReport): readonly {
  key: 'firstToken' | 'answer' | 'retrieval' | 'rerank' | 'model';
  stat: LatencyStat;
  p75Target: number | null;
  p95Target: number | null;
}[] {
  return [
    {
      key: 'firstToken',
      stat: report.firstToken,
      p75Target: LATENCY_TARGETS.firstTokenP75,
      p95Target: LATENCY_TARGETS.firstTokenP95,
    },
    { key: 'answer', stat: report.answer, p75Target: LATENCY_TARGETS.answerP75, p95Target: null },
    { key: 'retrieval', stat: report.retrieval, p75Target: null, p95Target: null },
    { key: 'rerank', stat: report.rerank, p75Target: null, p95Target: null },
    { key: 'model', stat: report.model, p75Target: null, p95Target: null },
  ];
}

const STATUS_TONE: Record<SourceStatus, 'neutral' | 'info' | 'success' | 'warning' | 'danger'> = {
  draft: 'neutral',
  in_review: 'warning',
  approved: 'info',
  published: 'success',
  withdrawn: 'danger',
};

/**
 * AI Management.
 *
 * Three things a reviewer needs in one place: what the assistant is allowed to
 * say, what it was asked and could not answer, and what it costs. The
 * knowledge table is the workflow — every row shows its status and only the
 * moves that status permits.
 */
export default async function AdminAiPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  await requireCapability('content.publish');

  const t = await getTranslations('admin.ai');
  const tRegistry = await getTranslations('admin.aiRegistry');

  const [sources, unanswered, usage, coverage, citationAudit, latency] = await Promise.all([
    listSources(),
    listUnanswered(),
    usageSummary(30),
    coverageReport(),
    citationAuditQueue(),
    latencyReport(30),
  ]);

  const limits = budgetLimits();
  const published = sources.filter((source) => source.status === 'published');
  const publishedNotIndexed = published.filter((source) => !source.indexed_at);

  return (
    <div className="space-y-8">
      <PageHeading
        title={t('title')}
        description={t('description')}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <AiImportButton />
            <AiPublishSeedButton />
          </div>
        }
      />

      {/* The knowledge centre. Each screen owns one half of the pipeline. */}
      <nav aria-label={tRegistry('navLabel')} className="flex flex-wrap gap-2 text-sm">
        {(
          [
            ['/admin/ai/registry', tRegistry('navRegistry')],
            ['/admin/ai/documents', tRegistry('navDocuments')],
            ['/admin/ai/rules', tRegistry('navRules')],
            ['/admin/ai/coverage', tRegistry('navCoverage')],
            ['/admin/ai/testing', tRegistry('navTesting')],
            ['/admin/ai/models', tRegistry('navModels')],
          ] as const
        ).map(([href, label]) => (
          <Link
            key={href}
            href={href}
            className="border-border-strong text-ink hover:bg-surface-sunken rounded-[var(--radius-control)] border px-3 py-1.5"
          >
            {label}
          </Link>
        ))}
      </nav>

      {!aiEnabled() ? <Alert tone="warning">{t('switchedOff')}</Alert> : null}

      {coverage.openAlerts > 0 || coverage.abandonedJobs > 0 ? (
        <Alert tone="warning">
          {tRegistry('attentionSummary', {
            alerts: coverage.openAlerts,
            jobs: coverage.abandonedJobs,
          })}
        </Alert>
      ) : null}

      {publishedNotIndexed.length > 0 ? (
        // Published but not indexed is the one state that looks fine and is
        // not: the source reads as live everywhere except in retrieval.
        <Alert tone="warning">{t('needsIndexing', { count: publishedNotIndexed.length })}</Alert>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: t('stats.published'), value: String(published.length) },
          { label: t('stats.answers'), value: String(usage.answers) },
          { label: t('stats.failures'), value: String(usage.failures) },
          {
            label: t('stats.spend'),
            value: `$${usage.costUsd.toFixed(2)} / $${limits.monthlyUsd}`,
          },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardContent className="pt-6">
              <p className="text-muted text-xs">{stat.label}</p>
              <p className="text-ink mt-1 text-2xl font-semibold tabular-nums">{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gauge className="size-4" aria-hidden="true" />
            {t('latency.title')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {latency.measured === 0 ? (
            // Not a failure and not a pass: no answer in the window carried a
            // stage measurement, so the gate has nothing to judge.
            <EmptyState title={t('latency.empty.title')} description={t('latency.empty.body')} />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <THead>
                  <TR>
                    <TH>{t('latency.metric')}</TH>
                    <TH>{t('latency.p75')}</TH>
                    <TH>{t('latency.p95')}</TH>
                    <TH>{t('latency.target')}</TH>
                    <TH>{t('latency.samples')}</TH>
                  </TR>
                </THead>
                <TBody>
                  {latencyRows(latency).map((row) => (
                    <TR key={row.key}>
                      <TD>{t(`latency.rows.${row.key}`)}</TD>
                      <TD className="tabular-nums">
                        {ms(row.stat.p75)}
                        {row.p75Target !== null && row.stat.p75 !== null ? (
                          <Badge tone={row.stat.p75 <= row.p75Target ? 'success' : 'danger'}>
                            {row.stat.p75 <= row.p75Target ? t('latency.pass') : t('latency.fail')}
                          </Badge>
                        ) : null}
                      </TD>
                      <TD className="tabular-nums">
                        {ms(row.stat.p95)}
                        {row.p95Target !== null && row.stat.p95 !== null ? (
                          <Badge tone={row.stat.p95 <= row.p95Target ? 'success' : 'danger'}>
                            {row.stat.p95 <= row.p95Target ? t('latency.pass') : t('latency.fail')}
                          </Badge>
                        ) : null}
                      </TD>
                      <TD className="text-muted tabular-nums">
                        {row.p75Target === null && row.p95Target === null
                          ? t('latency.noTarget')
                          : [row.p75Target, row.p95Target]
                              .filter((value): value is number => value !== null)
                              .map((value) => ms(value))
                              .join(' / ')}
                      </TD>
                      <TD className="tabular-nums">{row.stat.samples}</TD>
                    </TR>
                  ))}
                </TBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="size-4" aria-hidden="true" />
            {t('knowledge')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {sources.length === 0 ? (
            <EmptyState title={t('empty.title')} description={t('empty.body')} />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <THead>
                  <TR>
                    <TH>{t('columns.title')}</TH>
                    <TH>{t('columns.scope')}</TH>
                    <TH>{t('columns.status')}</TH>
                    <TH>{t('columns.reviewed')}</TH>
                    <TH>{t('columns.actions')}</TH>
                  </TR>
                </THead>
                <TBody>
                  {sources.map((source) => (
                    <TR key={source.id}>
                      <TD>
                        <span className="text-ink font-medium">{source.title}</span>
                        <span className="text-muted block text-xs">{source.slug}</span>
                      </TD>
                      <TD className="text-muted text-xs uppercase">
                        {source.country} · {source.locale}
                      </TD>
                      <TD>
                        <Badge tone={STATUS_TONE[source.status]}>
                          {t(`status.${source.status}`)}
                        </Badge>
                        {source.status === 'published' ? (
                          <Badge
                            tone={source.indexed_at ? 'success' : 'warning'}
                            className="ms-1.5"
                          >
                            {source.indexed_at ? t('indexed') : t('notIndexed')}
                          </Badge>
                        ) : null}
                      </TD>
                      <TD className="text-muted text-xs">
                        {source.last_reviewed_at?.slice(0, 10) ?? '—'}
                      </TD>
                      <TD>
                        <AiSourceControls
                          sourceId={source.id}
                          status={source.status}
                          indexed={Boolean(source.indexed_at)}
                        />
                      </TD>
                    </TR>
                  ))}
                </TBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('gaps')}</CardTitle>
        </CardHeader>
        <CardContent>
          {unanswered.length === 0 ? (
            <p className="text-muted text-sm">{t('noGaps')}</p>
          ) : (
            <ul className="divide-border divide-y">
              {unanswered.map((question) => (
                <li key={question.id} className="py-2.5">
                  <p className="text-ink text-sm">{question.question}</p>
                  <p className="text-muted mt-0.5 text-xs">
                    {t(`reasons.${question.reason}`)} · {question.locale} ·{' '}
                    {question.created_at.slice(0, 10)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('citationAudit')}</CardTitle>
        </CardHeader>
        <CardContent>
          {citationAudit.length === 0 ? (
            <p className="text-muted text-sm">{t('noCitationFindings')}</p>
          ) : (
            <ul className="divide-border divide-y">
              {citationAudit.map((answer) => (
                <li key={answer.id} className="py-2.5">
                  <p className="text-muted text-xs">
                    {t('citationCounts', {
                      uncited: answer.uncitedClaims,
                      material: answer.materialClaims,
                      sources: answer.citationCount,
                    })}
                    {answer.fabricatedMarkers > 0
                      ? ` · ${t('fabricated', { count: answer.fabricatedMarkers })}`
                      : ''}{' '}
                    · {answer.createdAt.slice(0, 10)}
                  </p>
                  {/* The sentences, not the whole answer: a reviewer needs to
                      see what was claimed without a citation, and nothing
                      more. Recomputed on read, so this always shows the
                      current detector's reading rather than a frozen verdict. */}
                  <ul className="mt-1 space-y-1">
                    {answer.claims.slice(0, 3).map((claim, index) => (
                      <li key={index} className="text-ink text-sm">
                        {claim.sentence}
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* Stated on the screen rather than only in a runbook: the reviewer
          holding this page is the person who would otherwise be tempted to
          "fix" a bad answer directly. */}
      <Alert tone="info">{t('correctionPolicy')}</Alert>
    </div>
  );
}
