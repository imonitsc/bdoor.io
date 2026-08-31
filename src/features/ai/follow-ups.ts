/**
 * Follow-up suggestions and conversion actions for an answer.
 *
 * Deterministic, not model-generated: the topics detected in the customer's
 * question map to a small set of curated next questions and to whether bdoor
 * can actually convert the answer into an application. Truthful by
 * construction — "Start this process" appears only for work bdoor's /start
 * journey genuinely covers.
 *
 * Pure and unit-tested.
 */

import { detectTopics, type Topic } from './registry/taxonomy';

type Localized = { en: string; bn: string };

const FOLLOW_UPS: Partial<Record<Topic, Localized[]>> = {
  formation_structure: [
    {
      en: 'What documents do I need to register a company?',
      bn: 'কোম্পানি নিবন্ধনে কী কী কাগজপত্র লাগে?',
    },
    { en: 'How long does company registration take?', bn: 'কোম্পানি নিবন্ধনে কত সময় লাগে?' },
  ],
  governance_rjsc: [
    { en: 'What must I file with RJSC every year?', bn: 'প্রতি বছর আরজেএসসি-তে কী জমা দিতে হয়?' },
    { en: 'How do I get name clearance?', bn: 'নাম ছাড়পত্র কীভাবে পাব?' },
  ],
  tax_vat: [
    { en: 'When do I need a BIN for VAT?', bn: 'ভ্যাটের জন্য কখন বিআইএন লাগে?' },
    { en: 'How do I get a TIN for my business?', bn: 'ব্যবসার জন্য টিআইএন কীভাবে করব?' },
  ],
  trade_licence_local: [
    { en: 'What does a trade licence require?', bn: 'ট্রেড লাইসেন্সে কী কী লাগে?' },
    { en: 'When must I renew my trade licence?', bn: 'ট্রেড লাইসেন্স কখন নবায়ন করতে হয়?' },
  ],
  import_export_customs: [
    { en: 'How do I get an import registration (IRC)?', bn: 'আমদানি নিবন্ধন (আইআরসি) কীভাবে পাব?' },
    { en: 'Do I need an ERC to export?', bn: 'রপ্তানির জন্য কি ইআরসি লাগে?' },
  ],
  banking_fx_investment: [
    {
      en: 'How does a foreign investor bring in capital?',
      bn: 'বিদেশি বিনিয়োগকারী কীভাবে মূলধন আনবেন?',
    },
  ],
  employment_labour: [
    { en: 'What are my obligations when hiring staff?', bn: 'কর্মী নিয়োগে আমার দায়িত্ব কী কী?' },
  ],
  environment_factory_fire: [
    { en: 'Which businesses need environmental clearance?', bn: 'কোন ব্যবসায় পরিবেশ ছাড়পত্র লাগে?' },
  ],
  intellectual_property: [
    { en: 'How do I register a trademark?', bn: 'ট্রেডমার্ক কীভাবে নিবন্ধন করব?' },
  ],
  startup_funding: [
    { en: 'What startup grants are available?', bn: 'স্টার্টআপদের জন্য কী অনুদান আছে?' },
  ],
};

/** Fallback when no topic was detected — the safest useful next steps. */
const GENERIC: Localized[] = [
  { en: 'How do I register a company in Bangladesh?', bn: 'বাংলাদেশে কোম্পানি কীভাবে নিবন্ধন করব?' },
  { en: 'Which licences does my business need?', bn: 'আমার ব্যবসায় কোন লাইসেন্সগুলো লাগবে?' },
  { en: 'What do I have to file every year?', bn: 'প্রতি বছর কী কী জমা দিতে হয়?' },
];

/** Topics the /start journey can genuinely take on as an application today. */
const STARTABLE: ReadonlySet<Topic> = new Set([
  'formation_structure',
  'governance_rjsc',
  'tax_vat',
  'trade_licence_local',
  'import_export_customs',
  'sector_licensing',
  'international_expansion',
]);

export type AnswerActions = {
  /** Up to three next questions, in the customer's language. */
  followUps: string[];
  /** True when bdoor's /start journey covers this kind of work. */
  startProcess: boolean;
};

export function actionsFor(question: string, locale: 'en' | 'bn'): AnswerActions {
  const topics = detectTopics(question);
  const pool = topics.flatMap((topic) => FOLLOW_UPS[topic] ?? []);
  const chosen = (pool.length ? pool : GENERIC).slice(0, 3);

  return {
    followUps: chosen.map((entry) => entry[locale]),
    startProcess: topics.some((topic) => STARTABLE.has(topic)),
  };
}
