import { describe, expect, it } from 'vitest';
import {
  applicableQuestions,
  firstUnansweredIndex,
  isComplete,
  pruneInapplicable,
  validateAnswer,
  type PartialAnswers,
} from '@/features/intake/questions';
import { hardManualReviewReasons, recommend, type Rule } from '@/features/intake/rules';
import { SNAPSHOT_RULES } from '@/content/rules-snapshot';
import { expandWithPrerequisites } from '@/features/intake/guide';

const LOCAL_SOLE_TRADER: PartialAnswers = {
  market_scope: 'bangladesh',
  target_country: 'bangladesh',
  objective: 'new',
  founder_location: 'bangladesh',
  nationality: 'BD',
  activity: 'Sell handmade leather bags from a shop in Dhaka.',
  location: 'Dhaka',
  structure: 'sole_proprietorship',
  owner_count: 1,
  foreign_owners: false,
  entity_owner: false,
  import_export: 'none',
  hire_employees: false,
  regulated_activity: false,
  need_address: false,
  start_window: 'immediately',
  full_name: 'Sample Founder (sample)',
  email: 'founder@example.com',
  phone: '',
  consent: true,
};

describe('questionnaire branching', () => {
  it('asks market_scope first, then country/objective when still needed', () => {
    const keys = applicableQuestions({}).map((q) => q.key);
    expect(keys[0]).toBe('market_scope');
    expect(keys[1]).toBe('target_country');
    expect(keys[2]).toBe('objective');
  });

  it('asks existing_business only when the objective is unsure', () => {
    for (const objective of ['new', 'existing', 'expand'] as const) {
      const keys = applicableQuestions({ target_country: 'bangladesh', objective }).map(
        (q) => q.key,
      );
      expect(keys, objective).not.toContain('existing_business');
    }
    const unsureKeys = applicableQuestions({
      target_country: 'bangladesh',
      objective: 'unsure',
    }).map((q) => q.key);
    expect(unsureKeys).toContain('existing_business');
  });

  it('does not ask a Bangladesh-based founder about their country of residence', () => {
    const keys = applicableQuestions(LOCAL_SOLE_TRADER).map((q) => q.key);
    expect(keys).not.toContain('residence');
    expect(keys).not.toContain('founder_will_work');
  });

  it('asks a foreign founder about residence, ownership share and remittance', () => {
    const keys = applicableQuestions({
      ...LOCAL_SOLE_TRADER,
      founder_location: 'outside',
    }).map((q) => q.key);

    expect(keys).toContain('residence');
    expect(keys).toContain('foreign_ownership_percent');
    expect(keys).toContain('remit_capital');
    expect(keys).toContain('founder_will_work');
  });

  it('skips the director count for structures that have no directors', () => {
    expect(applicableQuestions(LOCAL_SOLE_TRADER).map((q) => q.key)).not.toContain(
      'director_count',
    );
    expect(
      applicableQuestions({ ...LOCAL_SOLE_TRADER, structure: 'private_limited' }).map((q) => q.key),
    ).toContain('director_count');
  });

  it('asks an existing business what it already has, and not how to structure it', () => {
    const keys = applicableQuestions({ ...LOCAL_SOLE_TRADER, objective: 'existing' }).map(
      (q) => q.key,
    );
    expect(keys).toContain('existing_registrations');
    expect(keys).not.toContain('structure');
    expect(keys).not.toContain('owner_count');
  });

  it('drops answers that stop applying when an earlier one changes', () => {
    const answered: PartialAnswers = {
      ...LOCAL_SOLE_TRADER,
      founder_location: 'outside',
      residence: 'SG',
      founder_will_work: true,
    };
    // The founder corrects themselves: they are in Bangladesh after all.
    const pruned = pruneInapplicable({ ...answered, founder_location: 'bangladesh' });

    expect(pruned).not.toHaveProperty('residence');
    expect(pruned).not.toHaveProperty('founder_will_work');
    expect(pruned.activity).toBe(answered.activity);
  });

  it('reports the first gap, and completeness once there are none', () => {
    expect(isComplete(LOCAL_SOLE_TRADER)).toBe(true);
    const partial = { ...LOCAL_SOLE_TRADER };
    delete partial.location;
    expect(isComplete(partial)).toBe(false);
    expect(firstUnansweredIndex(partial)).toBe(
      applicableQuestions(partial).findIndex((q) => q.key === 'location'),
    );
  });
});

describe('answer validation', () => {
  it('rejects a one-word business description', () => {
    expect(validateAnswer('activity', 'shop')).toMatchObject({ success: false, error: 'tooShort' });
  });

  it('normalises a country code to upper case', () => {
    expect(validateAnswer('nationality', 'bd')).toEqual({ success: true, data: 'BD' });
  });

  it('keeps ownership percentage inside 0–100', () => {
    expect(validateAnswer('foreign_ownership_percent', 101)).toMatchObject({ success: false });
    expect(validateAnswer('foreign_ownership_percent', 100)).toMatchObject({ success: true });
  });

  it('requires at least one owner', () => {
    expect(validateAnswer('owner_count', 0)).toMatchObject({ success: false, error: 'minOwners' });
  });
});

describe('recommendation engine', () => {
  it('suggests a proprietorship for a single local owner', () => {
    const result = recommend(LOCAL_SOLE_TRADER, SNAPSHOT_RULES);
    expect(result.suggestedStructure).toBe('sole_proprietorship');
    expect(result.serviceSlugs).toContain('trade-licence');
    expect(result.requiresManualReview).toBe(false);
  });

  it('suggests a private limited company for two or more owners', () => {
    const result = recommend({ ...LOCAL_SOLE_TRADER, owner_count: 2 }, SNAPSHOT_RULES);
    expect(result.suggestedStructure).toBe('private_limited');
    expect(result.serviceSlugs).toContain('private-limited-company-incorporation');
  });

  it('routes a foreign founder to a partner eligibility review', () => {
    const result = recommend(
      {
        ...LOCAL_SOLE_TRADER,
        founder_location: 'outside',
        foreign_owners: true,
        foreign_ownership_percent: 100,
      },
      SNAPSHOT_RULES,
    );
    expect(result.serviceSlugs).toContain('foreign-ownership-eligibility-review');
    expect(result.partnerQuestions.length).toBeGreaterThan(0);
    expect(result.requiresManualReview).toBe(true);
  });

  it('adds import registration when the business will import', () => {
    const result = recommend({ ...LOCAL_SOLE_TRADER, import_export: 'both' }, SNAPSHOT_RULES);
    expect(result.serviceSlugs).toContain('import-registration-certificate');
    expect(result.serviceSlugs).toContain('bin-vat-registration');
  });

  it('applies the higher-priority rule first when two name a structure', () => {
    const rules: Rule[] = [
      {
        key: 'low-priority',
        description: 'later',
        conditions: { all: [{ field: 'owner_count', gte: 1 }] },
        outcome: { structure: 'partnership' },
        priority: 90,
      },
      {
        key: 'high-priority',
        description: 'earlier',
        conditions: { all: [{ field: 'owner_count', gte: 1 }] },
        outcome: { structure: 'private_limited' },
        priority: 10,
      },
    ];
    expect(recommend({ owner_count: 2 }, rules).suggestedStructure).toBe('private_limited');
  });

  it('does not echo "unsure" back as a recommendation', () => {
    const result = recommend({ structure: 'unsure', owner_count: 1 }, []);
    expect(result.suggestedStructure).toBeNull();
  });

  it('forces manual review for cases the rule table must not be able to wave through', () => {
    // An empty rule table: these come from code, not configuration.
    expect(recommend({ entity_owner: true }, []).requiresManualReview).toBe(true);
    expect(recommend({ regulated_activity: true }, []).requiresManualReview).toBe(true);
    expect(recommend({ remit_capital: true }, []).requiresManualReview).toBe(true);
    expect(recommend({ structure: 'branch_office' }, []).requiresManualReview).toBe(true);
    expect(recommend({ target_country: 'usa' }, []).requiresManualReview).toBe(true);
    expect(recommend({ objective: 'unsure' }, []).requiresManualReview).toBe(true);

    expect(hardManualReviewReasons({ entity_owner: true })).toContain('corporate_or_trust_owner');
    expect(hardManualReviewReasons({ target_country: 'qatar' })).toContain(
      'international_formation',
    );
  });

  it('evaluates any/all/not groups', () => {
    const rules: Rule[] = [
      {
        key: 'combo',
        description: 'combination',
        conditions: {
          all: [
            {
              any: [
                { field: 'import_export', equals: 'import' },
                { field: 'import_export', equals: 'both' },
              ],
            },
            { not: { field: 'existing_business', equals: true } },
          ],
        },
        outcome: { services: ['import-registration-certificate'] },
        priority: 10,
      },
    ];

    expect(
      recommend({ import_export: 'both', existing_business: false }, rules).serviceSlugs,
    ).toEqual(['import-registration-certificate']);
    expect(
      recommend({ import_export: 'both', existing_business: true }, rules).serviceSlugs,
    ).toEqual([]);
    expect(
      recommend({ import_export: 'none', existing_business: false }, rules).serviceSlugs,
    ).toEqual([]);
  });

  it('records which rules matched so a recommendation can be explained', () => {
    const result = recommend(LOCAL_SOLE_TRADER, SNAPSHOT_RULES);
    expect(result.ruleKeysMatched).toContain('sole-proprietor-default');
    expect(result.engineVersion).toBe('rules-1');
  });
});

describe('checklist prerequisites', () => {
  it('pulls in the services an IRC depends on', () => {
    const checklist = expandWithPrerequisites(['import-registration-certificate']);
    const slugs = checklist.map((c) => c.serviceSlug);

    expect(slugs).toContain('trade-licence');
    expect(slugs).toContain('etin-and-tax-setup');
    expect(checklist.find((c) => c.serviceSlug === 'trade-licence')?.reason).toBe('prerequisite');
    expect(checklist.find((c) => c.serviceSlug === 'import-registration-certificate')?.reason).toBe(
      'recommended',
    );
  });

  it('does not demote an explicitly recommended service to a prerequisite', () => {
    const checklist = expandWithPrerequisites(['trade-licence', 'import-registration-certificate']);
    expect(checklist.find((c) => c.serviceSlug === 'trade-licence')?.reason).toBe('recommended');
  });
});
