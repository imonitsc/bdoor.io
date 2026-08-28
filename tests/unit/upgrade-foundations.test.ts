import { describe, expect, it } from 'vitest';
import {
  allEvidenceClaims,
  getEvidenceClaim,
  publicEvidenceClaims,
} from '@/content/evidence/register';
import { activeSocialProfiles, organisationSameAs } from '@/content/social/profiles';
import { flagshipCountry, publicCountries } from '@/content/countries';

describe('evidence register', () => {
  it('exposes at least the standing positioning claim', () => {
    expect(getEvidenceClaim('POS-001')?.status).toBe('verified');
    expect(allEvidenceClaims().length).toBeGreaterThan(0);
  });

  it('never returns draft claims for public render', () => {
    const publicIds = publicEvidenceClaims().map((c) => c.id);
    expect(publicIds).toContain('POS-001');
    expect(publicIds).not.toContain('FEE-GOV-EXAMPLE');
  });

  it('filters by country when requested', () => {
    const bd = publicEvidenceClaims({ country: 'BD' });
    expect(bd.every((c) => c.countries.includes('BD') || c.countries.length === 0)).toBe(true);
  });
});

describe('social profiles', () => {
  it('renders nothing until a profile is active and verified', () => {
    expect(activeSocialProfiles()).toEqual([]);
    expect(organisationSameAs()).toEqual([]);
  });
});

describe('country framework', () => {
  it('keeps Bangladesh as the only active flagship', () => {
    const flagship = flagshipCountry();
    expect(flagship.code).toBe('BD');
    expect(flagship.status).toBe('active');
    expect(publicCountries().filter((c) => c.status === 'active')).toHaveLength(1);
  });

  it('lists secondary routes as coming soon, not available', () => {
    const secondary = publicCountries().filter((c) => c.code !== 'BD');
    expect(secondary.length).toBeGreaterThan(0);
    expect(secondary.every((c) => c.status === 'coming_soon')).toBe(true);
  });
});
