import { describe, expect, it } from 'vitest';

import { canTransitionDocument, DOCUMENT_TRANSITIONS } from '@/features/ai/registry/documents';
import { detectChanges } from '@/features/ai/registry/diff';
import { detectLanguage, encodingLooksBroken, htmlToText } from '@/features/ai/registry/extract';
import { parseRobots, robotsAllows } from '@/features/ai/registry/fetcher';
import { backoffMinutes } from '@/features/ai/registry/jobs';
import { REGISTRY_SEED } from '@/features/ai/registry/registry-seed';
import { canTransitionRule, publishBlockers, renderRules } from '@/features/ai/registry/rules';
import { AUTHORITY_TIERS, detectTopics, TOPICS } from '@/features/ai/registry/taxonomy';
import type { StructuredRule } from '@/features/ai/registry/rules';

/**
 * The registry's load-bearing guarantees: the taxonomy is complete, the seed
 * is sane, lifecycles have no shortcuts, changed fees raise alerts, robots
 * rules are honoured, and an unverified fee cannot be published.
 */

describe('taxonomy', () => {
  it('covers all thirteen areas exactly once', () => {
    expect(TOPICS).toHaveLength(13);
    expect(new Set(TOPICS).size).toBe(13);
  });

  it('ranks the gazette above everything and secondary sources last', () => {
    expect(AUTHORITY_TIERS.gazette).toBe(1);
    expect(AUTHORITY_TIERS.legislation).toBe(2);
    expect(AUTHORITY_TIERS.secondary).toBe(6);
  });

  it('detects topics in English and Bangla questions', () => {
    expect(
      detectTopics('How do I get a trade licence from Dhaka North City Corporation?'),
    ).toContain('trade_licence_local');
    expect(detectTopics('আমি কীভাবে ভ্যাট নিবন্ধন করব?')).toContain('tax_vat');
    expect(detectTopics('Do I need an IRC to import machinery?')).toContain(
      'import_export_customs',
    );
    expect(detectTopics('hello there')).toHaveLength(0);
  });
});

describe('the source registry seed', () => {
  it('has unique codes and valid tiers', () => {
    const codes = REGISTRY_SEED.map((source) => source.code);
    expect(new Set(codes).size).toBe(codes.length);
    for (const source of REGISTRY_SEED) {
      expect(source.authorityTier).toBeGreaterThanOrEqual(1);
      expect(source.authorityTier).toBeLessThanOrEqual(6);
      expect(source.baseUrl).toMatch(/^https?:\/\//);
      expect(source.topics.length).toBeGreaterThan(0);
    }
  });

  it('assigns tier 1 only to the gazette and tier 2 only to legislation', () => {
    for (const source of REGISTRY_SEED) {
      if (source.authorityTier === 1) expect(source.kind).toBe('gazette');
      if (source.authorityTier === 2) expect(source.kind).toBe('legislation');
    }
  });

  it('checks gazettes and circular feeds more often than static guidance', () => {
    const gazette = REGISTRY_SEED.find((source) => source.code === 'bd-gazette');
    const nbr = REGISTRY_SEED.find((source) => source.code === 'nbr');
    const guidance = REGISTRY_SEED.find((source) => source.code === 'banglabiz');
    expect(gazette && nbr && guidance).toBeTruthy();
    expect(gazette!.checkFrequencyHours).toBeLessThan(guidance!.checkFrequencyHours);
    expect(nbr!.checkFrequencyHours).toBeLessThan(guidance!.checkFrequencyHours);
  });

  it('covers every taxonomy topic with at least one watched source', () => {
    const covered = new Set(REGISTRY_SEED.flatMap((source) => source.topics));
    for (const topic of TOPICS) {
      if (topic === 'international_expansion') continue; // served by bdoor country content
      expect(covered.has(topic), topic).toBe(true);
    }
  });
});

describe('document lifecycle', () => {
  it('moves forward one step at a time, with no shortcut to published', () => {
    expect(canTransitionDocument('discovered', 'downloaded')).toBe(true);
    expect(canTransitionDocument('downloaded', 'extracted')).toBe(true);
    expect(canTransitionDocument('extracted', 'review_required')).toBe(true);
    expect(canTransitionDocument('review_required', 'approved')).toBe(true);
    expect(canTransitionDocument('approved', 'published')).toBe(true);

    expect(canTransitionDocument('discovered', 'published')).toBe(false);
    expect(canTransitionDocument('extracted', 'published')).toBe(false);
    expect(canTransitionDocument('review_required', 'published')).toBe(false);
  });

  it('lets a withdrawn document return only through review', () => {
    expect(DOCUMENT_TRANSITIONS.withdrawn).toEqual(['review_required']);
  });
});

describe('structured rules', () => {
  it('enforces the same no-shortcut discipline', () => {
    expect(canTransitionRule('draft', 'published')).toBe(false);
    expect(canTransitionRule('in_review', 'published')).toBe(false);
    expect(canTransitionRule('approved', 'published')).toBe(true);
  });

  it('refuses to publish a rule carrying an unverified government fee', () => {
    const rule = {
      government_fee_text: 'BDT 1,000 per lakh of authorised capital',
      government_fee_verified: false,
      legal_authority: 'Companies Act 1994, Schedule II',
    };
    expect(publishBlockers(rule)).toContain('unverified_fee');
    expect(publishBlockers({ ...rule, government_fee_verified: true })).toHaveLength(0);
    expect(publishBlockers({ ...rule, government_fee_text: null })).toHaveLength(0);
  });

  it('refuses a rule with no legal authority', () => {
    expect(
      publishBlockers({
        government_fee_text: null,
        government_fee_verified: false,
        legal_authority: '  ',
      }),
    ).toContain('missing_legal_authority');
  });

  it('renders an unverified fee as unconfirmed, never as a figure to repeat', () => {
    const rule = {
      title: 'Trade licence renewal',
      applies_to: 'Every business in a city corporation area',
      required_action: 'Renew the trade licence annually',
      responsible_authority: 'City corporation',
      legal_authority: 'Local Government (City Corporation) Act 2009',
      government_fee_text: 'BDT 5,000',
      government_fee_verified: false,
      required_documents: [],
      trigger_event: null,
      submission_channel: null,
      processing_time_official: null,
      deadline_text: null,
      penalty: null,
      exemptions: null,
      effective_from: null,
    } as unknown as StructuredRule;

    const rendered = renderRules([rule]);
    expect(rendered).not.toContain('BDT 5,000');
    expect(rendered).toContain('not verified');
  });
});

describe('change detection', () => {
  const before = [
    'The renewal fee is Tk 5,000 for a general trade licence.',
    'Applications must be filed within 30 days of expiry.',
    'Use Form K for renewals.',
    'Offices are open Sunday to Thursday.',
  ].join('\n');

  it('flags fee, deadline and form changes and ignores unchanged lines', () => {
    const after = [
      'The renewal fee is Tk 7,000 for a general trade licence.',
      'Applications must be filed within 15 days of expiry.',
      'Use Form K-2 for renewals.',
      'Offices are open Sunday to Thursday.',
    ].join('\n');
    const signals = detectChanges(before, after);
    const types = signals.map((signal) => signal.type);
    expect(types).toContain('fee_change');
    expect(types).toContain('deadline_change');
    expect(types).toContain('form_change');
    expect(signals.some((signal) => signal.line.includes('Sunday'))).toBe(false);
  });

  it('treats a moved line as no change', () => {
    const reordered = before.split('\n').reverse().join('\n');
    expect(detectChanges(before, reordered)).toHaveLength(0);
  });

  it('recognises a withdrawal notice above all else', () => {
    const signals = detectChanges(before, `${before}\nS.R.O. 100 is hereby rescinded.`);
    expect(signals.some((signal) => signal.type === 'withdrawn_notice')).toBe(true);
  });
});

describe('the polite fetcher', () => {
  it('honours Disallow for the wildcard agent', () => {
    const rules = parseRobots(
      'User-agent: *\nDisallow: /private/\nAllow: /private/public-notices/',
    );
    expect(robotsAllows(rules, '/fees/schedule.pdf')).toBe(true);
    expect(robotsAllows(rules, '/private/internal.pdf')).toBe(false);
    // The more specific Allow wins, per the convention.
    expect(robotsAllows(rules, '/private/public-notices/2026.pdf')).toBe(true);
  });

  it('ignores groups addressed to other agents and caps crawl delay', () => {
    const rules = parseRobots(
      'User-agent: OtherBot\nDisallow: /\n\nUser-agent: *\nCrawl-delay: 3600\nDisallow:',
    );
    expect(robotsAllows(rules, '/anything')).toBe(true);
    expect(rules.crawlDelayMs).toBe(30_000);
  });

  it('backs off exponentially and stays bounded', () => {
    expect(backoffMinutes(1)).toBe(5);
    expect(backoffMinutes(2)).toBe(20);
    expect(backoffMinutes(3)).toBe(80);
    expect(backoffMinutes(10)).toBe(1_440);
  });
});

describe('extraction hygiene', () => {
  it('detects Bangla, English and mixed documents', () => {
    expect(detectLanguage('The Companies Act 1994 provides for registration.')).toBe('en');
    expect(detectLanguage('কোম্পানি আইন ১৯৯৪ অনুযায়ী নিবন্ধন করতে হবে।')).toBe('bn');
    expect(
      detectLanguage(
        'ধারা ২৫ অনুযায়ী প্রতিটি কোম্পানি নিবন্ধন করতে হবে। Every company shall be registered under the Companies Act.',
      ),
    ).toBe('mixed');
  });

  it('flags a decode that lost characters', () => {
    expect(encodingLooksBroken('normal text')).toBe(false);
    expect(encodingLooksBroken('br�ken t�xt �verywhere'.repeat(10))).toBe(true);
  });

  it('turns HTML into structured text and drops scripts', () => {
    const text = htmlToText(
      '<html><head><script>steal()</script></head><body><h2>Section 5. Fees</h2><p>The fee is stated in the schedule.</p><li>Item one</li></body></html>',
    );
    expect(text).toContain('## Section 5. Fees');
    expect(text).toContain('- Item one');
    expect(text).not.toContain('steal');
  });

  it('drops scripts even with a spaced end tag, and never double-unescapes', () => {
    // `</script >` is valid HTML; a filter that misses it leaks script text.
    const spaced = htmlToText('<p>Before</p><script>evil()</script ><p>After</p>');
    expect(spaced).not.toContain('evil');
    expect(spaced).toContain('Before');
    expect(spaced).toContain('After');

    // `&amp;lt;` is the ESCAPED text "&lt;" — decoding it twice would turn a
    // quoted markup example in a legal text into a real angle bracket.
    expect(htmlToText('<p>Use &amp;lt; in the form &amp; sign here.</p>')).toBe(
      'Use &lt; in the form & sign here.',
    );
  });
});
