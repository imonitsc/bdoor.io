import 'server-only';

import { createAdminClient, hasServiceRole } from '@/lib/supabase/admin';
import { createPublicClient } from '@/lib/supabase/public';
import { logger } from '@/lib/logger';
import { recommend, type Recommendation, type Rule } from './rules';
import type { PartialAnswers } from './questions';
import { SNAPSHOT_RULES } from '@/content/rules-snapshot';

/**
 * Loads the admin-editable rules and runs the deterministic engine.
 *
 * If the database is unreachable we fall back to the bundled snapshot rather
 * than producing no recommendation at all — the engine must work in a fresh
 * clone with no credentials, and the hard manual-review checks in
 * `rules.ts` apply either way.
 */
export async function loadRules(): Promise<Rule[]> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return SNAPSHOT_RULES;

  try {
    const supabase = createPublicClient();
    const { data, error } = await supabase
      .from('recommendation_rules')
      .select('key, description, conditions, outcome, priority')
      .eq('is_active', true)
      .order('priority');

    if (error || !data || data.length === 0) {
      if (error) logger.warn('intake.rules_fallback', { message: error.message });
      return SNAPSHOT_RULES;
    }

    return data.map((row) => ({
      key: row.key,
      description: row.description,
      conditions: row.conditions as Rule['conditions'],
      outcome: row.outcome as Rule['outcome'],
      priority: row.priority,
    }));
  } catch (error) {
    logger.warn('intake.rules_threw', {
      message: error instanceof Error ? error.message : 'unknown',
    });
    return SNAPSHOT_RULES;
  }
}

export async function generateRecommendation(
  sessionId: string,
  answers: PartialAnswers,
): Promise<Recommendation> {
  const rules = await loadRules();
  const result = recommend(answers, rules);

  if (hasServiceRole()) {
    const admin = createAdminClient();
    await admin
      .from('questionnaire_sessions')
      .update({ completed_at: new Date().toISOString() })
      .eq('id', sessionId);
    const { error } = await admin.from('recommendation_results').insert({
      session_id: sessionId,
      suggested_structure: result.suggestedStructure,
      service_slugs: result.serviceSlugs,
      assumptions: result.assumptions,
      partner_questions: result.partnerQuestions,
      requires_manual_review: result.requiresManualReview,
      manual_review_reasons: result.manualReviewReasons,
      rule_keys_matched: result.ruleKeysMatched,
      engine_version: result.engineVersion,
    });
    if (error) logger.warn('intake.recommendation_store_failed', { message: error.message });
  }

  return result;
}
