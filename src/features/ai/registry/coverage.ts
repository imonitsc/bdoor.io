import 'server-only';

import { aiDb, hasAiDatabase } from '../db';
import { detectTopics, TOPICS, type Topic } from './taxonomy';
import type { Database } from '@/types/database';

/**
 * Coverage reporting — the honest version.
 *
 * The dashboard's job is to show what is missing, so the report is built by
 * enumerating the fixed taxonomy and the registry, never by aggregating
 * whatever happens to exist. A topic with nothing published shows as a gap;
 * there is deliberately no code path that could render "all Bangladesh
 * information complete", because completeness is not a state this system can
 * ever truthfully claim.
 */

export type TopicCoverage = {
  topic: Topic;
  publishedSources: number;
  indexedSources: number;
  publishedRules: number;
  documentsInReview: number;
};

export type RegulatorCoverage = {
  registrySourceId: string;
  code: string;
  institution: string;
  authorityTier: number;
  enabled: boolean;
  lastCheckedAt: string | null;
  consecutiveFailures: number;
  documentsPublished: number;
  documentsInPipeline: number;
};

export type CoverageReport = {
  topics: TopicCoverage[];
  regulators: RegulatorCoverage[];
  /** Topics with no published source AND no published rule. */
  missingTopics: Topic[];
  reviewDueSoon: Array<{ id: string; title: string; reviewDueOn: string }>;
  openAlerts: number;
  abandonedJobs: number;
  unansweredOpen: number;
};

const EMPTY: CoverageReport = {
  topics: TOPICS.map((topic) => ({
    topic,
    publishedSources: 0,
    indexedSources: 0,
    publishedRules: 0,
    documentsInReview: 0,
  })),
  regulators: [],
  missingTopics: [...TOPICS],
  reviewDueSoon: [],
  openAlerts: 0,
  abandonedJobs: 0,
  unansweredOpen: 0,
};

export async function coverageReport(): Promise<CoverageReport> {
  if (!hasAiDatabase()) return EMPTY;
  const db = aiDb();

  const [sources, rules, documents, registry, alerts, jobs, unanswered] = await Promise.all([
    db
      .from('ai_knowledge_sources')
      .select('status, topics, indexed_at, country, title')
      .eq('country', 'bd')
      .limit(2_000),
    db.from('ai_structured_rules').select('status, topic').limit(2_000),
    db
      .from('ai_registry_documents')
      .select('id, official_title, lifecycle, topics, registry_source_id, review_due_on')
      .limit(2_000),
    db.from('ai_source_registry').select('*').limit(200),
    db
      .from('ai_source_change_alerts')
      .select('id', { count: 'exact', head: true })
      .is('resolved_at', null),
    db
      .from('ai_ingestion_jobs')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'abandoned'),
    db
      .from('ai_unanswered_questions')
      .select('id', { count: 'exact', head: true })
      .is('resolved_at', null),
  ]);

  const byTopic = new Map<Topic, TopicCoverage>(
    TOPICS.map((topic) => [
      topic,
      { topic, publishedSources: 0, indexedSources: 0, publishedRules: 0, documentsInReview: 0 },
    ]),
  );

  for (const source of sources.data ?? []) {
    if (source.status !== 'published') continue;
    // Sources created before the taxonomy carry no topic tags; classify them
    // from their titles so pre-existing published coverage is not reported as
    // a false gap. Tagged sources always use their tags.
    const topics: Topic[] =
      (source.topics as Topic[]).length > 0
        ? (source.topics as Topic[])
        : detectTopics((source as { title?: string }).title ?? '');
    for (const topic of topics) {
      const row = byTopic.get(topic);
      if (!row) continue;
      row.publishedSources += 1;
      if (source.indexed_at) row.indexedSources += 1;
    }
  }
  for (const rule of rules.data ?? []) {
    if (rule.status !== 'published') continue;
    const row = byTopic.get(rule.topic as Topic);
    if (row) row.publishedRules += 1;
  }
  const publishedByRegulator = new Map<string, number>();
  const pipelineByRegulator = new Map<string, number>();
  for (const document of documents.data ?? []) {
    if (document.lifecycle === 'review_required') {
      for (const topic of document.topics as Topic[]) {
        const row = byTopic.get(topic);
        if (row) row.documentsInReview += 1;
      }
    }
    if (document.lifecycle === 'published') {
      publishedByRegulator.set(
        document.registry_source_id,
        (publishedByRegulator.get(document.registry_source_id) ?? 0) + 1,
      );
    } else if (!['superseded', 'withdrawn'].includes(document.lifecycle)) {
      pipelineByRegulator.set(
        document.registry_source_id,
        (pipelineByRegulator.get(document.registry_source_id) ?? 0) + 1,
      );
    }
  }

  const topics = [...byTopic.values()];
  const missingTopics = topics
    .filter((row) => row.publishedSources === 0 && row.publishedRules === 0)
    .map((row) => row.topic);

  const soon = new Date(Date.now() + 30 * 86_400_000).toISOString().slice(0, 10);
  const reviewDueSoon = (documents.data ?? [])
    .filter(
      (document) =>
        document.lifecycle === 'published' &&
        document.review_due_on !== null &&
        document.review_due_on <= soon,
    )
    .map((document) => ({
      id: document.id,
      title: document.official_title,
      reviewDueOn: document.review_due_on as string,
    }))
    .sort((a, b) => a.reviewDueOn.localeCompare(b.reviewDueOn))
    .slice(0, 20);

  return {
    topics,
    regulators: (registry.data ?? []).map((row) => ({
      registrySourceId: row.id,
      code: row.code,
      institution: row.institution,
      authorityTier: row.authority_tier,
      enabled: row.enabled,
      lastCheckedAt: row.last_checked_at,
      consecutiveFailures: row.consecutive_failures,
      documentsPublished: publishedByRegulator.get(row.id) ?? 0,
      documentsInPipeline: pipelineByRegulator.get(row.id) ?? 0,
    })),
    missingTopics,
    reviewDueSoon,
    openAlerts: alerts.count ?? 0,
    abandonedJobs: jobs.count ?? 0,
    unansweredOpen: unanswered.count ?? 0,
  };
}

export type ChangeAlert = Database['public']['Tables']['ai_source_change_alerts']['Row'];

export async function listOpenAlerts(limit = 50): Promise<ChangeAlert[]> {
  if (!hasAiDatabase()) return [];
  const { data } = await aiDb()
    .from('ai_source_change_alerts')
    .select('*')
    .is('resolved_at', null)
    .order('created_at', { ascending: false })
    .limit(limit);
  return data ?? [];
}

export type AbandonedJob = Database['public']['Tables']['ai_ingestion_jobs']['Row'];

export async function listAbandonedJobs(limit = 50): Promise<AbandonedJob[]> {
  if (!hasAiDatabase()) return [];
  const { data } = await aiDb()
    .from('ai_ingestion_jobs')
    .select('*')
    .eq('status', 'abandoned')
    .order('finished_at', { ascending: false })
    .limit(limit);
  return data ?? [];
}
