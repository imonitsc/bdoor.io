import 'server-only';

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';
import { logger } from '@/lib/logger';
import {
  bangladeshCalendar,
  planObligations,
  type EntityFacts,
  type GenerationPlan,
  type ScheduledRule,
} from './rules-engine';

/**
 * Obligation generation for one organisation (ROADMAP P1).
 *
 * Runs with the service role because compliance_obligations only accepts
 * staff inserts under RLS, and this runs from the payment webhook where no
 * user session exists. The caller has already established the trigger —
 * a verified subscription activation — before handing over the client.
 *
 * Generation is idempotent end to end: the plan is deterministic for a given
 * window, and compliance_obligations_rule_period_idx makes re-inserting an
 * existing (company, rule version, due date) a no-op. Running it twice adds
 * nothing; running it after a new rule is published adds only that rule's
 * occurrences.
 */

/** Rules must carry every scheduling field before the engine will touch them. */
type RuleRow = {
  id: string;
  title: string;
  topic: string;
  jurisdiction_code: string;
  entity_types: string[];
  sectors: string[];
  responsible_authority: string;
  recurrence: string | null;
  deadline_anchor: string | null;
  deadline_offset_days: number;
  deadline_month: number | null;
  deadline_day: number | null;
  required_documents: string[];
};

export type OrganizationGenerationReport = {
  organizationId: string;
  companies: Array<{
    companyId: string;
    plan: GenerationPlan;
    inserted: number;
    /** Occurrences that already existed (unique-index no-ops). */
    alreadyPresent: number;
  }>;
  /** Published, schedulable rules considered. Zero until analysts structure the corpus. */
  rulesConsidered: number;
};

const GENERATION_WINDOW_MONTHS = 12;

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export async function generateObligationsForOrganization(
  admin: SupabaseClient<Database>,
  organizationId: string,
): Promise<OrganizationGenerationReport> {
  const today = todayIso();
  const from = new Date(`${today}T00:00:00Z`);
  const to = new Date(from);
  to.setUTCMonth(to.getUTCMonth() + GENERATION_WINDOW_MONTHS);

  const report: OrganizationGenerationReport = {
    organizationId,
    companies: [],
    rulesConsidered: 0,
  };

  const { data: companies, error: companiesError } = await admin
    .from('companies')
    .select('id, organization_id, structure, incorporation_date')
    .eq('organization_id', organizationId)
    .neq('status', 'dissolved');

  if (companiesError) {
    logger.error('obligations.generation_companies_failed', {
      organizationId,
      message: companiesError.message,
    });
    return report;
  }
  if (!companies || companies.length === 0) return report;

  // Only rules an analyst has fully structured AND a reviewer has published.
  // A rule missing either scheduling field stays prose-only and never fires.
  const { data: rules, error: rulesError } = await admin
    .from('ai_structured_rules')
    .select(
      'id, title, topic, jurisdiction_code, entity_types, sectors, responsible_authority, recurrence, deadline_anchor, deadline_offset_days, deadline_month, deadline_day, required_documents',
    )
    .eq('status', 'published')
    .is('superseded_by_id', null)
    .not('recurrence', 'is', null)
    .not('deadline_anchor', 'is', null)
    .or(`effective_from.is.null,effective_from.lte.${today}`)
    .or(`effective_to.is.null,effective_to.gt.${today}`);

  if (rulesError) {
    logger.error('obligations.generation_rules_failed', {
      organizationId,
      message: rulesError.message,
    });
    return report;
  }

  const scheduledRules: ScheduledRule[] = ((rules ?? []) as RuleRow[]).map((rule) => ({
    id: rule.id,
    title: rule.title,
    jurisdictionCode: rule.jurisdiction_code,
    entityTypes: rule.entity_types,
    sectors: rule.sectors,
    responsibleAuthority: rule.responsible_authority,
    topic: rule.topic,
    recurrence: rule.recurrence as ScheduledRule['recurrence'],
    anchor: rule.deadline_anchor as ScheduledRule['anchor'],
    offsetDays: rule.deadline_offset_days,
    month: rule.deadline_month,
    day: rule.deadline_day,
    requiredDocuments: rule.required_documents,
  }));
  report.rulesConsidered = scheduledRules.length;
  if (scheduledRules.length === 0) return report;

  // Holiday coverage: a year counts as covered only when the analyst-entered
  // set has at least one gazetted date in it — no jurisdiction has a
  // holiday-free year, so an empty year means missing data, and the engine
  // fails those occurrences loudly instead of computing without rolls.
  const { data: holidayRows, error: holidaysError } = await admin
    .from('public_holidays')
    .select('holiday_date')
    .eq('jurisdiction_code', 'BD')
    .gte('holiday_date', `${from.getUTCFullYear()}-01-01`)
    .lte('holiday_date', `${to.getUTCFullYear() + 1}-12-31`);

  if (holidaysError) {
    logger.error('obligations.generation_holidays_failed', {
      organizationId,
      message: holidaysError.message,
    });
    return report;
  }

  const holidays = (holidayRows ?? []).map((row) => ({ date: row.holiday_date }));
  const yearsCovered = new Set(holidays.map((h) => Number(h.date.slice(0, 4))));
  const calendar = bangladeshCalendar(holidays, yearsCovered);

  for (const company of companies) {
    // Companies carry no jurisdiction column yet (they are Bangladesh by
    // construction — the structure vocabulary is RJSC's); the BD calendar
    // above is the only one the corpus covers, and matchRule rejects any
    // rule scoped elsewhere.
    const entity: EntityFacts = {
      companyId: company.id,
      organizationId: company.organization_id,
      jurisdictionCode: 'BD',
      structure: company.structure,
      sector: null,
      incorporationDate: company.incorporation_date,
    };

    const plan = planObligations(scheduledRules, entity, calendar, { from, to });
    const companyReport = { companyId: company.id, plan, inserted: 0, alreadyPresent: 0 };

    for (const obligation of plan.obligations) {
      const rule = scheduledRules.find((r) => r.id === obligation.ruleId);
      const { error: insertError } = await admin.from('compliance_obligations').insert({
        organization_id: company.organization_id,
        company_id: company.id,
        obligation_type: rule?.topic ?? 'other',
        // Bengali analyst copy for rules is P2 backlog; until then both
        // labels carry the reviewed English title rather than a machine
        // translation of a regulatory term.
        label_en: obligation.ruleTitle,
        label_bn: obligation.ruleTitle,
        authority_name: rule?.responsibleAuthority ?? null,
        due_on: obligation.dueOn,
        source: 'verified_rule',
        source_rule_ref: obligation.ruleId,
        required_documents: rule?.requiredDocuments ?? [],
      });

      if (!insertError) {
        companyReport.inserted += 1;
      } else if (insertError.code === '23505') {
        companyReport.alreadyPresent += 1;
      } else {
        logger.error('obligations.generation_insert_failed', {
          organizationId,
          companyId: company.id,
          ruleId: obligation.ruleId,
          message: insertError.message,
        });
      }
    }

    for (const failure of plan.errors) {
      // Loud by contract: an occurrence the engine refused to compute is a
      // customer deadline nobody is watching until someone acts on this line.
      logger.error('obligations.generation_occurrence_failed', {
        organizationId,
        companyId: company.id,
        ruleId: failure.ruleId,
        error: failure.error,
        year: failure.year,
      });
    }
    for (const maybe of plan.ambiguous) {
      logger.warn('obligations.generation_rule_ambiguous', {
        organizationId,
        companyId: company.id,
        ruleId: maybe.ruleId,
        reason: maybe.reason,
      });
    }

    report.companies.push(companyReport);
  }

  return report;
}
