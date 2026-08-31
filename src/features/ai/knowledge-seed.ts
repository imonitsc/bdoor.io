import 'server-only';

import {
  BD_KNOWLEDGE_REVIEWED,
  BD_REGISTRATION_KNOWLEDGE,
} from '@/content/bd/registration-knowledge';
import { COUNTRY_GUIDES } from '@/content/countries/guides';
import {
  COMMERCIAL_REVIEW_DATE,
  publishedPackages,
  activePackageVersion,
} from '@/content/packages/catalog';
import { TAXONOMY_SERVICES } from '@/content/service-taxonomy';

/**
 * Candidate knowledge sources, derived from content this repository has
 * already reviewed and published.
 *
 * These are proposed as DRAFTS. Nothing here is published by importing it —
 * the workflow is Draft → Professional review → Approved → Published →
 * Indexed, and this module only supplies the first step. That is the whole
 * reason it is a separate module from the indexer.
 *
 * What is deliberately excluded, and why:
 *
 *   - `src/content/legal/documents.ts` — every document there is version 0.9
 *     with `awaitingCounselReview: true`. Draft policy text is exactly what the
 *     brief forbids indexing, and an assistant quoting an unapproved refund
 *     clause is worse than an assistant that says it cannot confirm one.
 *   - Any price, government fee or processing time. Those come from the live
 *     structured records at answer time (`structured.ts`). A fee embedded in a
 *     chunk is a photograph of a fee; it goes stale silently and cites itself
 *     confidently.
 *   - International route status and availability. Internal readiness is not
 *     public knowledge.
 */

export type SeedSource = {
  slug: string;
  title: string;
  country: string;
  locale: 'en' | 'bn';
  /** One of `public.ai_source_type`. */
  sourceType: 'guide' | 'faq' | 'legal_policy' | 'service_page' | 'government_reference';
  sourceUrl: string | null;
  body: string;
  /** The date a person last checked this content, carried from the content file. */
  lastReviewed: string;
  serviceCategory?: string;
  /** Registry authority tier, for sources that summarise an official authority. */
  authorityTier?: 1 | 2 | 3 | 4 | 5 | 6;
  issuingInstitution?: string;
  referenceNumber?: string;
};

const COUNTRY_CODE: Record<string, string> = {
  usa: 'us',
  uk: 'gb',
  uae: 'ae',
  'saudi-arabia': 'sa',
  qatar: 'qa',
  singapore: 'sg',
};

/**
 * One source per country guide, per language.
 *
 * Bangla and English are separate sources rather than one bilingual document,
 * because the chunk that gets retrieved is the chunk the model reads: mixing
 * both languages in one chunk halves the useful content in every retrieval and
 * makes the model answer in the wrong one.
 */
function countryGuideSources(): SeedSource[] {
  const sources: SeedSource[] = [];

  for (const guide of COUNTRY_GUIDES) {
    for (const locale of ['en', 'bn'] as const) {
      const sections = [
        ['Requirements', guide.requirements],
        ['Documents you provide', guide.documents],
        ['Ongoing obligations', guide.obligations],
      ] as const;

      const parts = sections
        .filter(([, items]) => items.length > 0)
        .map(
          ([heading, items]) => `${heading}\n\n${items.map((i) => `- ${i[locale]}`).join('\n')}`,
        );

      if (guide.faq.length) {
        parts.push(
          `Common questions\n\n${guide.faq.map((f) => `Q: ${f.q[locale]}\nA: ${f.a[locale]}`).join('\n\n')}`,
        );
      }

      sources.push({
        slug: `country-guide-${guide.countrySlug}-${locale}`,
        title: `${guide.countrySlug.replace(/-/g, ' ')} company formation guide`,
        country: COUNTRY_CODE[guide.countrySlug] ?? 'bd',
        locale,
        sourceType: 'guide',
        sourceUrl: `/countries/${guide.countrySlug}`,
        body: parts.join('\n\n'),
        lastReviewed: guide.reviewedAt,
      });
    }
  }

  return sources;
}

/**
 * What bdoor does in Bangladesh, as a navigable list. No prices: a customer
 * asking "do you handle VAT registration" needs a yes and a link, and the
 * figure comes from the live catalogue in the same answer.
 */
function serviceSources(): SeedSource[] {
  const available = TAXONOMY_SERVICES.filter((service) => service.status === 'available');
  if (available.length === 0) return [];

  const byCategory = new Map<string, typeof available>();
  for (const service of available) {
    const list = byCategory.get(service.category) ?? [];
    list.push(service);
    byCategory.set(service.category, list);
  }

  return (['en', 'bn'] as const).map((locale) => ({
    slug: `bdoor-services-bangladesh-${locale}`,
    title: 'bdoor services in Bangladesh',
    country: 'bd',
    locale,
    sourceType: 'service_page' as const,
    sourceUrl: '/services',
    lastReviewed: COMMERCIAL_REVIEW_DATE,
    body: [...byCategory.entries()]
      .map(
        ([category, services]) =>
          `${category.replace(/-/g, ' ')}\n\n${services
            .map((s) => `- ${s.title[locale]} (/services?category=${category})`)
            .join('\n')}`,
      )
      .join('\n\n'),
  }));
}

/**
 * Package inclusions and exclusions — what a package covers, never what it
 * costs. "Is the government fee included" is the most common pricing question
 * bdoor gets and it is answerable from inclusions alone.
 */
const CURRENCY_FIGURE = /(?:BDT|USD|GBP|AED|SAR|QAR|SGD|[$£৳])\s?[\d,]/;

function packageScopeSources(): SeedSource[] {
  const blocks: string[] = [];

  // A bullet carrying a currency figure is dropped rather than rewritten. The
  // figure it names is live in the catalogue and reaches the answer through
  // `structured.ts`; the same figure frozen into a chunk would keep being cited
  // long after the catalogue moved on, and it would cite itself confidently.
  const withoutFigures = (items: readonly { en: string }[]) =>
    items.map((item) => item.en).filter((text) => !CURRENCY_FIGURE.test(text));

  for (const pkg of publishedPackages()) {
    const version = activePackageVersion(pkg);
    if (!version) continue;

    const lines = [pkg.name.en];
    const included = withoutFigures(version.inclusions);
    const excluded = withoutFigures(version.exclusions);
    const limits = withoutFigures(version.limits);

    if (included.length) lines.push(`Included:\n${included.map((i) => `- ${i}`).join('\n')}`);
    if (excluded.length) lines.push(`Not included:\n${excluded.map((i) => `- ${i}`).join('\n')}`);
    if (limits.length) lines.push(`Limits:\n${limits.map((i) => `- ${i}`).join('\n')}`);

    lines.push(
      'Prices are not stated here. The current price for this package, and what is a bdoor fee rather than a government fee, comes from the live bdoor price list.',
    );
    blocks.push(lines.join('\n\n'));
  }

  if (blocks.length === 0) return [];

  return [
    {
      slug: 'bdoor-package-scope-en',
      title: 'What bdoor packages include and exclude',
      country: 'bd',
      locale: 'en',
      sourceType: 'service_page',
      sourceUrl: '/pricing',
      lastReviewed: COMMERCIAL_REVIEW_DATE,
      body: blocks.join('\n\n---\n\n'),
    },
  ];
}

/**
 * The boundary statements. Every one of these is a thing bdoor must say
 * consistently, so they are knowledge rather than prompt text — a reviewer can
 * change them without a code deploy, and the answer cites them.
 */
const BOUNDARY_FAQ: SeedSource[] = [
  {
    slug: 'bdoor-what-bdoor-is-en',
    title: 'What bdoor is, and what it is not',
    country: 'global',
    locale: 'en',
    sourceType: 'legal_policy',
    sourceUrl: '/about',
    lastReviewed: COMMERCIAL_REVIEW_DATE,
    body: `bdoor compliance ltd. coordinates business formation, registration, licensing and compliance work. bdoor is not a law firm, not an audit firm, not a bank and not a licensed tax practice.

Regulated work — legal opinions, statutory audits, tax filings that require a licensed practitioner, and immigration advice — is performed by independent qualified professionals. bdoor identifies the right professional, coordinates the engagement and manages the paperwork around it. The professional is engaged separately and is responsible for their own advice.

bdoor's professional fee is separate from government fees and from any independent professional's fee. Government fees are paid to the authority, not to bdoor, and change when the authority changes them.

Information on this website and from Ask bdoor AI is general business information. It is not legal, tax, audit, immigration, banking, insurance or investment advice, and it does not create a professional relationship.`,
  },
  {
    slug: 'bdoor-what-bdoor-is-bn',
    title: 'bdoor কী এবং কী নয়',
    country: 'global',
    locale: 'bn',
    sourceType: 'legal_policy',
    sourceUrl: '/about',
    lastReviewed: COMMERCIAL_REVIEW_DATE,
    body: `bdoor compliance ltd. ব্যবসা গঠন, নিবন্ধন, লাইসেন্সিং ও কমপ্লায়েন্স কাজের সমন্বয় করে। bdoor কোনো আইনি প্রতিষ্ঠান নয়, নিরীক্ষা প্রতিষ্ঠান নয়, ব্যাংক নয় এবং লাইসেন্সপ্রাপ্ত কর প্র্যাকটিস নয়।

নিয়ন্ত্রিত কাজ — আইনি মতামত, বিধিবদ্ধ নিরীক্ষা, লাইসেন্সপ্রাপ্ত ব্যক্তির প্রয়োজন এমন কর দাখিল, এবং অভিবাসন পরামর্শ — স্বাধীন যোগ্য পেশাজীবীরা সম্পাদন করেন। bdoor সঠিক পেশাজীবী নির্ধারণ করে, চুক্তির সমন্বয় করে এবং সংশ্লিষ্ট কাগজপত্র পরিচালনা করে। পেশাজীবী আলাদাভাবে নিযুক্ত হন এবং নিজের পরামর্শের জন্য নিজেই দায়ী।

bdoor-এর পেশাদার ফি সরকারি ফি এবং স্বাধীন পেশাজীবীর ফি থেকে আলাদা। সরকারি ফি কর্তৃপক্ষকে দেওয়া হয়, bdoor-কে নয়, এবং কর্তৃপক্ষ পরিবর্তন করলে তা বদলায়।

এই ওয়েবসাইট ও Ask bdoor AI-এর তথ্য সাধারণ ব্যবসায়িক তথ্য। এটি আইনি, কর, নিরীক্ষা, অভিবাসন, ব্যাংকিং, বিমা বা বিনিয়োগ পরামর্শ নয় এবং কোনো পেশাদার সম্পর্ক তৈরি করে না।`,
  },
  {
    slug: 'bdoor-privacy-of-your-information-en',
    title: 'What Ask bdoor AI can and cannot see',
    country: 'global',
    locale: 'en',
    sourceType: 'legal_policy',
    sourceUrl: '/privacy',
    lastReviewed: COMMERCIAL_REVIEW_DATE,
    body: `Ask bdoor AI answers only from published bdoor information and bdoor's live published price list.

It cannot see your application, your case, your uploaded documents, your identity documents, your payment details or anything another customer has sent. It has no access to those systems at all, so it cannot retrieve them for you or for anyone else — if you need something from your own case, a specialist can help.

Your questions are stored so the answers can be improved. Anything that looks like an identity number, card number, phone number or email address is removed before it is stored. Conversations are deleted automatically after 90 days, and you can delete a conversation yourself at any time.

Please do not paste identity documents, card numbers or passwords into any chat.`,
  },
  {
    slug: 'bdoor-privacy-of-your-information-bn',
    title: 'Ask bdoor AI কী দেখতে পায় এবং কী পায় না',
    country: 'global',
    locale: 'bn',
    sourceType: 'legal_policy',
    sourceUrl: '/privacy',
    lastReviewed: COMMERCIAL_REVIEW_DATE,
    body: `Ask bdoor AI শুধু প্রকাশিত bdoor তথ্য এবং bdoor-এর সক্রিয় প্রকাশিত মূল্যতালিকা থেকে উত্তর দেয়।

এটি আপনার আবেদন, আপনার কেস, আপনার আপলোড করা নথি, আপনার পরিচয়পত্র, আপনার পেমেন্টের তথ্য বা অন্য কোনো গ্রাহকের পাঠানো কিছুই দেখতে পায় না। এসব সিস্টেমে এর কোনো প্রবেশাধিকার নেই, তাই আপনার বা অন্য কারও জন্য এগুলো আনতে পারে না — নিজের কেস সম্পর্কে কিছু প্রয়োজন হলে একজন বিশেষজ্ঞ সাহায্য করতে পারবেন।

উত্তরের মান উন্নত করার জন্য আপনার প্রশ্ন সংরক্ষণ করা হয়। পরিচয় নম্বর, কার্ড নম্বর, ফোন নম্বর বা ইমেইলের মতো কিছু থাকলে সংরক্ষণের আগে তা সরিয়ে ফেলা হয়। ৯০ দিন পর কথোপকথন স্বয়ংক্রিয়ভাবে মুছে যায়, এবং আপনি যেকোনো সময় নিজে মুছে ফেলতে পারেন।

অনুগ্রহ করে কোনো চ্যাটে পরিচয়পত্র, কার্ড নম্বর বা পাসওয়ার্ড লিখবেন না।`,
  },
];

/**
 * The Bangladesh registration knowledge: bdoor's end-to-end walkthrough plus
 * bdoor-authored summaries of the official sources, each linking to the
 * authority it describes and carrying that authority's registry tier. This is
 * what lets a regulatory answer cite RJSC, NBR or the Gazette rather than only
 * bdoor's own pages.
 */
function bdRegistrationSources(): SeedSource[] {
  return BD_REGISTRATION_KNOWLEDGE.flatMap((entry) =>
    (['en', 'bn'] as const).map((locale) => ({
      slug: `${entry.slug}-${locale}`,
      title: entry.title[locale],
      country: 'bd',
      locale,
      sourceType: entry.sourceType,
      sourceUrl: entry.sourceUrl,
      body: entry.body[locale],
      lastReviewed: BD_KNOWLEDGE_REVIEWED,
      authorityTier: entry.authorityTier,
      issuingInstitution: entry.issuingInstitution,
      referenceNumber: entry.referenceNumber,
    })),
  );
}

/** Everything importable, in the order an admin will review it. */
export function seedSources(): SeedSource[] {
  return [
    ...BOUNDARY_FAQ,
    ...bdRegistrationSources(),
    ...countryGuideSources(),
    ...serviceSources(),
    ...packageScopeSources(),
  ];
}
