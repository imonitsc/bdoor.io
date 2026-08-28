import { describe, expect, it } from 'vitest';
import { verifiedClaimsFor, EVIDENCE_CLAIMS } from '@/content/evidence-register';

describe('evidence register', () => {
  it('returns only verified claims publicly', () => {
    const verified = verifiedClaimsFor();
    expect(verified.every((c) => c.status === 'verified')).toBe(true);
    expect(verified.length).toBeGreaterThan(0);
    expect(verified.length).toBeLessThanOrEqual(EVIDENCE_CLAIMS.length);
  });

  it('filters by country when claim has country scope', () => {
    const bd = verifiedClaimsFor('BD');
    expect(bd.length).toBeGreaterThan(0);
  });
});
