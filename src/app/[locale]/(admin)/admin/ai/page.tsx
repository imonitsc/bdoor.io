import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Sparkles } from 'lucide-react';

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
  listSources,
  listUnanswered,
  usageSummary,
  type SourceStatus,
} from '@/features/ai/knowledge';
import { coverageReport } from '@/features/ai/registry/coverage';
import { Link } from '@/i18n/navigation';
import { requireCapability } from '@/lib/auth/session';

export const metadata: Metadata = { robots: { index: false, follow: false } };

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

  const [sources, unanswered, usage, coverage] = await Promise.all([
    listSources(),
    listUnanswered(),
    usageSummary(30),
    coverageReport(),
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

      {/* Stated on the screen rather than only in a runbook: the reviewer
          holding this page is the person who would otherwise be tempted to
          "fix" a bad answer directly. */}
      <Alert tone="info">{t('correctionPolicy')}</Alert>
    </div>
  );
}
