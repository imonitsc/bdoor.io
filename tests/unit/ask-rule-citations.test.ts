import { describe, expect, it } from 'vitest';

import { ruleCitations } from '@/features/ai/retrieval';
import { renderRules, ruleReviewDate, type StructuredRule } from '@/features/ai/registry/rules';
import { trackCompanySchema } from '@/features/compliance/track-schema';

/**
 * ROADMAP P2: rules are citable sources. A deadline answer must carry the
 * rule's own review date, the numbering the model cites must match the
 * citation list, and only an analyst-set recurrence may light the Comply
 * exit — never an inferred one.
 */

function rule(overrides: Partial<StructuredRule>): StructuredRule {
  return {
    id: '11111111-1111-4111-8111-000000000001',
    registry_document_id: null,
    knowledge_source_id: null,
    topic: 'governance_rjsc',
    title: 'Annual return filing (sample)',
    applies_to: 'Sample entities',
    entity_types: ['private_limited'],
    sectors: [],
    trigger_event: null,
    required_action: 'File the sample return',
    required_documents: [],
    responsible_authority: 'Registrar (sample)',
    government_fee_text: null,
    government_fee_minor: null,
    government_fee_currency: 'BDT',
    government_fee_verified: false,
    professional_fee_note: null,
    submission_channel: null,
    processing_time_official: null,
    deadline_text: null,
    penalty: null,
    exemptions: null,
    legal_authority: 'Sample Act, s 1',
    effective_from: '2026-01-01',
    effective_to: null,
    status: 'published',
    extracted_by_model: null,
    jurisdiction_code: 'BD',
    recurrence: null,
    deadline_anchor: null,
    deadline_offset_days: 0,
    deadline_month: null,
    deadline_day: null,
    superseded_by_id: null,
    reviewed_by: null,
    reviewed_at: '2026-08-15T10:00:00Z',
    published_by: null,
    published_at: '2026-08-20T10:00:00Z',
    created_by: null,
    created_at: '2026-08-01T10:00:00Z',
    updated_at: '2026-08-20T10:00:00Z',
    ...overrides,
  } as StructuredRule;
}

describe('rule citations', () => {
  it('numbers rules after the document citations and carries the review date', () => {
    const { citations } = ruleCitations([rule({})], 3);
    expect(citations).toHaveLength(1);
    expect(citations[0]).toMatchObject({
      index: 4,
      title: 'Annual return filing (sample)',
      institution: 'Registrar (sample)',
      referenceNumber: 'Sample Act, s 1',
      lastReviewed: '2026-08-15',
      ruleId: '11111111-1111-4111-8111-000000000001',
    });
  });

  it('falls back to the publication date when no reviewer sign-off is recorded', () => {
    expect(ruleReviewDate(rule({ reviewed_at: null }))).toBe('2026-08-20');
    expect(ruleReviewDate(rule({ reviewed_at: null, published_at: null }))).toBeNull();
  });

  it('offers the Comply exit only for an analyst-scheduled recurrence', () => {
    const unscheduled = ruleCitations([rule({})], 0);
    expect(unscheduled.complyTrack).toBeNull();

    const scheduled = ruleCitations(
      [
        rule({}),
        rule({
          id: '22222222-2222-4222-8222-000000000002',
          title: 'Recurring filing (sample)',
          recurrence: 'annual',
        }),
      ],
      0,
    );
    expect(scheduled.complyTrack).toEqual({
      ruleId: '22222222-2222-4222-8222-000000000002',
      title: 'Recurring filing (sample)',
    });
  });

  it('renders the same bracketed numbers into the prompt block', () => {
    const block = renderRules([rule({}), rule({ id: 'x', title: 'Second (sample)' })], 3);
    expect(block).toContain('[4] RULE: Annual return filing (sample)');
    expect(block).toContain('[5] RULE: Second (sample)');
    expect(block).toContain('last reviewed: 2026-08-15');
  });
});

describe('track-company schema', () => {
  it('accepts a complete existing company', () => {
    const parsed = trackCompanySchema.safeParse({
      legalName: 'Padma Textiles Limited (sample)',
      structure: 'private_limited',
      incorporationDate: '2020-03-15',
    });
    expect(parsed.success).toBe(true);
  });

  it('treats an empty incorporation date as absent, not invalid', () => {
    const parsed = trackCompanySchema.safeParse({
      legalName: 'Padma Textiles Limited (sample)',
      structure: 'partnership',
      incorporationDate: '',
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) expect(parsed.data.incorporationDate).toBeUndefined();
  });

  it('accepts the identifiers and sector, treating empties as absent (P3)', () => {
    const parsed = trackCompanySchema.safeParse({
      legalName: 'Padma Textiles Limited (sample)',
      structure: 'private_limited',
      sector: 'garments_textiles',
      registrationNo: 'C-SAMPLE-000042',
      etin: '',
      bin: '',
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.sector).toBe('garments_textiles');
      expect(parsed.data.registrationNo).toBe('C-SAMPLE-000042');
      expect(parsed.data.etin).toBeUndefined();
      expect(parsed.data.bin).toBeUndefined();
    }
  });

  it('rejects an off-vocabulary sector and an implausible identifier with keys', () => {
    const badSector = trackCompanySchema.safeParse({
      legalName: 'Valid Name',
      structure: 'private_limited',
      sector: 'banking',
    });
    expect(badSector.success).toBe(false);
    if (!badSector.success) expect(badSector.error.issues[0]?.message).toBe('sectorInvalid');

    const badIdentifier = trackCompanySchema.safeParse({
      legalName: 'Valid Name',
      structure: 'private_limited',
      etin: 'not;an;identifier',
    });
    expect(badIdentifier.success).toBe(false);
    if (!badIdentifier.success)
      expect(badIdentifier.error.issues[0]?.message).toBe('identifierInvalid');
  });

  it('rejects with translation keys, never prose', () => {
    const cases: Array<[Record<string, string>, string]> = [
      [{ legalName: 'A', structure: 'private_limited' }, 'nameTooShort'],
      [{ legalName: 'Valid Name', structure: 'plc' }, 'structureInvalid'],
      [
        { legalName: 'Valid Name', structure: 'private_limited', incorporationDate: '15-03-2020' },
        'dateInvalid',
      ],
      [
        { legalName: 'Valid Name', structure: 'private_limited', incorporationDate: '2999-01-01' },
        'dateInFuture',
      ],
    ];
    for (const [input, key] of cases) {
      const parsed = trackCompanySchema.safeParse(input);
      expect(parsed.success).toBe(false);
      if (!parsed.success) expect(parsed.error.issues[0]?.message).toBe(key);
    }
  });
});
