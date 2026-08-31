/**
 * The Bangladesh knowledge taxonomy.
 *
 * Thirteen areas, mirrored exactly by the `ai_topic` database enum. Fixed in
 * code as well as in the schema so coverage reporting can enumerate what is
 * *missing* — a dashboard built from whatever topics happen to exist can only
 * ever say "everything we have is covered", which is the dishonest version.
 *
 * No 'server-only' import: the constants are pure data used by unit tests and
 * by admin client components alike.
 */

import type { Database } from '@/types/database';

export type Topic = Database['public']['Enums']['ai_topic'];

export const TOPICS: readonly Topic[] = [
  'formation_structure',
  'governance_rjsc',
  'tax_vat',
  'banking_fx_investment',
  'employment_labour',
  'import_export_customs',
  'trade_licence_local',
  'environment_factory_fire',
  'intellectual_property',
  'procurement',
  'startup_funding',
  'sector_licensing',
  'international_expansion',
] as const;

/**
 * Authority tiers, 1 (most authoritative) to 6. Tier 6 is discovery only: a
 * secondary source may point a reviewer at a document, but it is never the
 * sole authority for a legal, tax, regulatory, fee or deadline claim — the
 * source policy doc carries that rule, and the review playbook enforces it.
 */
export const AUTHORITY_TIERS = {
  gazette: 1,
  legislation: 2,
  regulator_issuance: 3,
  official_form_fee: 4,
  official_guidance: 5,
  secondary: 6,
} as const;

export type AuthorityTier = (typeof AUTHORITY_TIERS)[keyof typeof AUTHORITY_TIERS];

export const AUTHORITY_TIER_NAMES: Record<AuthorityTier, string> = {
  1: 'Bangladesh Gazette',
  2: 'Legislation (Laws of Bangladesh)',
  3: 'Acts, rules, SROs, circulars and orders of the regulator',
  4: 'Official forms, fee schedules and procedures',
  5: 'Official FAQs, manuals and notices',
  6: 'Trusted secondary (discovery only, never sole authority)',
};

/** Entity types a document or rule can apply to. */
export const ENTITY_TYPES = [
  'proprietorship',
  'partnership',
  'private_limited',
  'public_limited',
  'one_person_company',
  'foreign_company_branch',
  'liaison_office',
  'startup',
  'ngo',
  'cooperative',
] as const;

export type EntityType = (typeof ENTITY_TYPES)[number];

export function isTopic(value: string): value is Topic {
  return (TOPICS as readonly string[]).includes(value);
}

/**
 * Lower tier number = higher authority. Used wherever two sources disagree:
 * the comparison is explicit so tests can pin that a gazette outranks a
 * service page and a service page outranks a secondary write-up.
 */
export function moreAuthoritative(a: number, b: number): number {
  return Math.min(a, b);
}

/**
 * Topic detection from a customer question, English and Bangla. Used to pick
 * which published structured rules join the answer context. Deliberately
 * recall-poor and precision-high: a missed topic costs one structured block,
 * a wrong topic hands the model an irrelevant fee table.
 */
const TOPIC_SIGNALS: Array<[Topic, RegExp]> = [
  [
    'formation_structure',
    /\b(incorporat\w+|company formation|register (a|my|the) (company|business|firm)|proprietor|partnership|one person company|opc|limited company)\b|কোম্পানি (গঠন|নিবন্ধন)|মালিকানা/i,
  ],
  [
    'governance_rjsc',
    /\b(rjsc|annual return|name clearance|memorandum|articles of association|share transfer|director change|board)\b|নাম ছাড়পত্র|বার্ষিক রিটার্ন/i,
  ],
  [
    'tax_vat',
    /\b(tin|bin|vat|tax|withholding|nbr|return filing|corporate tax|income tax|mushak)\b|কর|ভ্যাট|টিআইএন/i,
  ],
  [
    'banking_fx_investment',
    /\b(bank account|remit\w*|foreign (investment|exchange|shareholding)|bida|repatriat\w+|capital|encashment|work permit)\b|ব্যাংক|বিনিয়োগ|রেমিট্যান্স/i,
  ],
  [
    'employment_labour',
    /\b(employee|labour|labor|payroll|provident fund|gratuity|working hours|dife|factory worker|dismissal|maternity)\b|শ্রমিক|কর্মচারী|বেতন/i,
  ],
  [
    'import_export_customs',
    /\b(import|export|customs|irc|erc|duty|tariff|bond licence|lc|letter of credit)\b|আমদানি|রপ্তানি|শুল্ক/i,
  ],
  [
    'trade_licence_local',
    /\b(trade licen[cs]e|city corporation|municipality|union parishad|holding tax)\b|ট্রেড লাইসেন্স|সিটি কর্পোরেশন/i,
  ],
  [
    'environment_factory_fire',
    /\b(environment(al)? clearance|fire (licen[cs]e|safety)|factory (licen[cs]e|registration)|doe|boiler)\b|পরিবেশ ছাড়পত্র|ফায়ার লাইসেন্স/i,
  ],
  [
    'intellectual_property',
    /\b(trademark|patent|copyright|industrial design|dpdt|brand registration)\b|ট্রেডমার্ক|পেটেন্ট/i,
  ],
  [
    'procurement',
    /\b(e-?gp|tender|government procurement|cptu|bppa|supplier registration)\b|টেন্ডার|সরকারি ক্রয়/i,
  ],
  [
    'startup_funding',
    /\b(startup (grant|fund|recognition)|idea project|startup bangladesh|venture|seed fund|incentive)\b|স্টার্টআপ|অনুদান/i,
  ],
  [
    'sector_licensing',
    /\b(bsti|btrc|drug licen[cs]e|tourism licen[cs]e|isp licen[cs]e|sector permit|certification mark)\b/i,
  ],
  [
    'international_expansion',
    /\b(expand (abroad|overseas)|foreign (branch|subsidiary)|offshore|overseas company)\b/i,
  ],
];

export function detectTopics(question: string): Topic[] {
  const found: Topic[] = [];
  for (const [topic, pattern] of TOPIC_SIGNALS) {
    if (pattern.test(question)) found.push(topic);
  }
  return found;
}
