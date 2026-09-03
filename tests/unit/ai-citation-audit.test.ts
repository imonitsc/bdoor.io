import { describe, expect, it } from 'vitest';
import {
  auditCitations,
  auditTelemetry,
  isMaterialClaim,
  markersIn,
  splitSentences,
} from '@/features/ai/citations';

/**
 * CLAUDE.md §7.1 step 12, §7.2 and §23.2: every material claim maps to a
 * source, and a citation naming a source that was never retrieved is
 * fabricated.
 */

describe('sentence splitting', () => {
  it('does not shred the numbers regulatory prose is made of', () => {
    const text =
      'The government fee is Tk 5,000.50 for the filing. See s. 184 of the Act. Pay within 30 days.';
    const sentences = splitSentences(text);
    // "5,000.50" and "s. 184" must not each become their own sentence — if
    // they did, every claim would arrive pre-shredded and uncited.
    expect(sentences).toHaveLength(3);
    expect(sentences[0]).toContain('5,000.50');
  });

  it('keeps a trailing marker with the sentence it belongs to', () => {
    const [first] = splitSentences('The fee is BDT 1,000.[2] Then you file.');
    expect(first).toContain('[2]');
  });

  it('splits on the Bangla danda and on line breaks', () => {
    expect(splitSentences('প্রথম বাক্য। দ্বিতীয় বাক্য।')).toHaveLength(2);
    expect(splitSentences('One\nTwo\nThree')).toHaveLength(3);
  });

  it('ignores fenced code and markdown furniture', () => {
    const sentences = splitSentences('## Heading\n- Point one.\n```\nnot.prose.here\n```');
    expect(sentences.join(' ')).not.toContain('not.prose.here');
    expect(sentences.some((s) => s.includes('Point one'))).toBe(true);
  });
});

describe('marker parsing', () => {
  it('reads single, adjacent and comma-grouped markers', () => {
    expect(markersIn('A fee applies [1].')).toEqual([1]);
    expect(markersIn('Two sources [2][5].')).toEqual([2, 5]);
    expect(markersIn('Grouped [3, 4].')).toEqual([3, 4]);
    expect(markersIn('Repeated [1][1].')).toEqual([1]);
  });

  it('is not fooled by brackets that are not citations', () => {
    expect(markersIn('See section [a] and [] and [1.5].')).toEqual([]);
    expect(markersIn('No markers at all.')).toEqual([]);
  });
});

describe('material-claim detection', () => {
  it('flags money, proportions, periods, dates and duties', () => {
    const material = [
      'The government fee is BDT 5,000.',
      'The registration costs Tk 1,200 in total.',
      'VAT is charged at 15%.',
      'You must file the return within 30 days.',
      'The deadline is 30 November each year.',
      'Payment is due by 2026-11-30.',
      'A private limited company shall have at least two shareholders.',
      'The minimum tax threshold applies to this business.',
      'A penalty applies for late filing.',
    ];
    for (const sentence of material) {
      expect(isMaterialClaim(sentence), sentence).toBe(true);
    }
  });

  it('leaves ordinary prose, offers and questions alone', () => {
    const immaterial = [
      'bdoor can prepare and file this for you.',
      'This is general information and not professional advice.',
      'Would you like to start an assessment?',
      'RJSC is the authority responsible for company registration.',
      'The process has several stages.',
    ];
    for (const sentence of immaterial) {
      expect(isMaterialClaim(sentence), sentence).toBe(false);
    }
  });

  it('catches a Bangla answer that states a figure, since a figure is a figure', () => {
    // Bengali numerals in a Bangla sentence still name an amount.
    expect(isMaterialClaim('সরকারি ফি ৳ ৫০০০ টাকা।')).toBe(true);
    expect(isMaterialClaim('আপনাকে ৩০ দিন সময় দেওয়া হয়।')).toBe(true);
  });

  it('under-reports a Bangla duty rather than guessing at one', () => {
    // A documented limit, pinned so it is a decision and not a surprise: the
    // English modal list has no Bangla counterpart, because writing one from
    // memory would produce errors nobody on this codebase can audit. A Bangla
    // sentence whose only signal is a verb of obligation goes unflagged.
    expect(isMaterialClaim('আপনাকে অবশ্যই নিবন্ধন করতে হবে।')).toBe(false);
  });
});

describe('the audit', () => {
  it('passes an answer that cites every figure it states', () => {
    const answer = [
      'A private limited company registers with RJSC.',
      'The name clearance fee is BDT 1,150 [1].',
      'You must file the annual return within 30 days of the AGM [2].',
      'bdoor can handle the filing for you.',
    ].join(' ');

    const audit = auditCitations(answer, 2);
    expect(audit.ok).toBe(true);
    expect(audit.materialClaims).toBe(2);
    expect(audit.supportedClaims).toBe(2);
    expect(audit.uncitedClaims).toBe(0);
    expect(audit.fabricatedMarkers).toEqual([]);
  });

  it('catches a figure stated with no source behind it', () => {
    const audit = auditCitations('The government fee is BDT 5,000. RJSC handles this.', 3);
    expect(audit.ok).toBe(false);
    expect(audit.uncitedClaims).toBe(1);
    expect(audit.claims.find((claim) => claim.material)?.supported).toBe(false);
  });

  it('catches a citation naming a source that was never retrieved', () => {
    // The unambiguous defect: three sources went into the prompt and the
    // answer cited a seventh. §7.4 makes this release-blocking.
    const audit = auditCitations('The fee is BDT 5,000 [7].', 3);
    expect(audit.fabricatedMarkers).toEqual([7]);
    expect(audit.ok).toBe(false);
    // And a fabricated marker does not count as support.
    expect(audit.supportedClaims).toBe(0);
  });

  it('reports every fabricated marker once, in order', () => {
    const audit = auditCitations('Fee is Tk 100 [9][4]. Rate is 15% [9].', 3);
    expect(audit.fabricatedMarkers).toEqual([4, 9]);
  });

  it('treats an answer with no sources as unable to support any claim', () => {
    const audit = auditCitations('The fee is BDT 5,000 [1].', 0);
    expect(audit.fabricatedMarkers).toEqual([1]);
    expect(audit.ok).toBe(false);
  });

  it('passes an answer that makes no material claim at all', () => {
    // The refusal path §7.2 requires: no figures, so nothing to support.
    const audit = auditCitations(
      'That cannot be confirmed from the available sources. A specialist can review it for you.',
      0,
    );
    expect(audit.ok).toBe(true);
    expect(audit.materialClaims).toBe(0);
  });

  it('accepts a mixed sentence where one valid marker sits beside a fabricated one', () => {
    // Still not ok — the fabrication is real — but the claim itself is
    // supported by the valid marker, so it is not also counted as uncited.
    const audit = auditCitations('The fee is BDT 5,000 [1][9].', 2);
    expect(audit.uncitedClaims).toBe(0);
    expect(audit.fabricatedMarkers).toEqual([9]);
    expect(audit.ok).toBe(false);
  });
});

describe('telemetry', () => {
  it('carries counts and never a word of the answer', () => {
    const audit = auditCitations('The government fee is BDT 5,000. RJSC handles this.', 1);
    const telemetry = auditTelemetry(audit);
    expect(telemetry).toEqual({
      materialClaims: 1,
      supportedClaims: 0,
      uncitedClaims: 1,
      fabricatedMarkers: 0,
      ok: false,
    });
    // §17: answer content never reaches a general log line.
    const serialised = JSON.stringify(telemetry);
    expect(serialised).not.toContain('BDT');
    expect(serialised).not.toContain('RJSC');
    for (const value of Object.values(telemetry)) {
      expect(typeof value === 'number' || typeof value === 'boolean').toBe(true);
    }
  });
});
