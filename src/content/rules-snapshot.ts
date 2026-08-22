// AUTO-GENERATED — DO NOT EDIT BY HAND.
//
// Offline copy of public.recommendation_rules, generated from supabase/seed.sql:
//   scripts/local-db/apply.sh --seed && node scripts/local-db/gen-rules-snapshot.mjs
//
// Used when the database is unreachable so the questionnaire still produces a
// recommendation. The hard manual-review checks in src/features/intake/rules.ts
// are in code and apply regardless of which source these rules came from.

import type { Rule } from '@/features/intake/rules';

export const SNAPSHOT_RULES: Rule[] = [
  {
    key: 'foreign-founder-review',
    description:
      'Any foreign founder or foreign ownership needs a partner eligibility review first.',
    conditions: {
      any: [
        {
          field: 'founder_location',
          equals: 'outside',
        },
        {
          field: 'foreign_owners',
          equals: true,
        },
        {
          gt: 0,
          field: 'foreign_ownership_percent',
        },
      ],
    },
    outcome: {
      services: ['foreign-ownership-eligibility-review'],
      assumptions: [
        'Foreign ownership rules depend on the exact activity, so this is confirmed by a partner before we quote.',
      ],
      partnerQuestions: [
        'Is the intended activity open to foreign ownership, and up to what percentage?',
      ],
    },
    priority: 10,
  },
  {
    key: 'entity-owner-manual-review',
    description: 'A corporate, trust or fund shareholder always goes to manual review.',
    conditions: {
      all: [
        {
          field: 'entity_owner',
          equals: true,
        },
      ],
    },
    outcome: {
      manualReview: true,
      partnerQuestions: [
        'Can the ownership chain of the corporate shareholder be fully documented?',
      ],
      manualReviewReasons: [
        'A corporate or trust shareholder requires the ultimate beneficial owners to be identified and documented.',
      ],
    },
    priority: 15,
  },
  {
    key: 'regulated-activity-manual-review',
    description: 'Regulated sectors need eligibility confirmed before anything is promised.',
    conditions: {
      all: [
        {
          field: 'regulated_activity',
          equals: true,
        },
      ],
    },
    outcome: {
      assumptions: ['Sector approval is a separate decision by the relevant regulator.'],
      manualReview: true,
      manualReviewReasons: [
        'The activity appears to be in a regulated sector, which has its own eligibility conditions.',
      ],
    },
    priority: 16,
  },
  {
    key: 'existing-business-compliance',
    description: 'Existing companies start from compliance, not formation.',
    conditions: {
      all: [
        {
          field: 'existing_business',
          equals: true,
        },
      ],
    },
    outcome: {
      services: ['rjsc-annual-return'],
      assumptions: [
        'We work from your existing registrations rather than starting a new formation.',
      ],
    },
    priority: 30,
  },
  {
    key: 'private-limited-default',
    description: 'Two or more owners, no special circumstances: private limited company.',
    conditions: {
      all: [
        {
          gte: 2,
          field: 'owner_count',
        },
        {
          field: 'existing_business',
          equals: false,
        },
      ],
    },
    outcome: {
      services: ['private-limited-company-incorporation', 'trade-licence', 'etin-and-tax-setup'],
      structure: 'private_limited',
    },
    priority: 40,
  },
  {
    key: 'sole-proprietor-default',
    description: 'One local owner, no foreign ownership, simple activity.',
    conditions: {
      all: [
        {
          field: 'owner_count',
          equals: 1,
        },
        {
          field: 'founder_location',
          equals: 'bangladesh',
        },
        {
          field: 'foreign_owners',
          equals: false,
        },
        {
          field: 'existing_business',
          equals: false,
        },
      ],
    },
    outcome: {
      services: ['trade-licence', 'etin-and-tax-setup'],
      structure: 'sole_proprietorship',
      assumptions: [
        'A sole proprietorship has no separate legal personality, so business debts are personal debts.',
      ],
    },
    priority: 45,
  },
  {
    key: 'import-adds-irc',
    description:
      'Importing requires an IRC, which itself requires a trade licence, TIN, BIN and bank account.',
    conditions: {
      any: [
        {
          field: 'import_export',
          equals: 'import',
        },
        {
          field: 'import_export',
          equals: 'both',
        },
      ],
    },
    outcome: {
      services: ['import-registration-certificate', 'bin-vat-registration'],
      assumptions: [
        'An IRC can only be filed once the trade licence, e-TIN, BIN and a bank account are in place.',
      ],
    },
    priority: 50,
  },
  {
    key: 'export-adds-erc',
    description: 'Exporting requires an ERC.',
    conditions: {
      any: [
        {
          field: 'import_export',
          equals: 'export',
        },
        {
          field: 'import_export',
          equals: 'both',
        },
      ],
    },
    outcome: {
      services: ['bin-vat-registration'],
      partnerQuestions: ['Confirm the current ERC application route for this product category.'],
    },
    priority: 51,
  },
  {
    key: 'work-in-bangladesh-note',
    description:
      'Founders intending to work in Bangladesh must be told incorporation is not immigration.',
    conditions: {
      all: [
        {
          field: 'founder_will_work',
          equals: true,
        },
      ],
    },
    outcome: {
      assumptions: [
        'Incorporation does not grant residency or work authorisation. A visa and usually a work permit are separate applications.',
      ],
      partnerQuestions: ["Which visa category fits the founder's intended role?"],
    },
    priority: 60,
  },
  {
    key: 'remittance-note',
    description: 'Capital remittance has a required order of steps.',
    conditions: {
      all: [
        {
          field: 'remit_capital',
          equals: true,
        },
      ],
    },
    outcome: {
      assumptions: [
        "Investment capital is remitted to a bank account in the company's name and evidenced by an encashment certificate. It is never paid to BDoor.",
      ],
    },
    priority: 61,
  },
];
