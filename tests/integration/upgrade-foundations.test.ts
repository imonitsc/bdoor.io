import type { Client } from 'pg';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { connect, disconnect } from './helpers/db';

let client: Client;

beforeAll(async () => {
  client = await connect();
});

afterAll(async () => {
  await disconnect(client);
});

describe('upgrade foundations RLS', () => {
  it('lets anon read verified public evidence claims only', async () => {
    await client.query('set role anon');
    const { rows } = await client.query<{ claim_code: string }>(
      'select claim_code from public.evidence_claims order by claim_code',
    );
    expect(rows.map((r) => r.claim_code)).toEqual(['POS-001']);
    await client.query('reset role');
  });

  it('hides inactive social profiles from anon', async () => {
    await client.query(`
      insert into public.social_profiles (network, handle, public_url, status, display_permission, last_verified_at)
      values
        ('facebook', '@hidden', 'https://facebook.com/hidden', 'reserved', false, null),
        ('linkedin', '@shown', 'https://linkedin.com/company/shown', 'active', true, current_date)
      on conflict (network, handle) do update
        set public_url = excluded.public_url,
            status = excluded.status,
            display_permission = excluded.display_permission,
            last_verified_at = excluded.last_verified_at
    `);
    await client.query('set role anon');
    const { rows } = await client.query<{ handle: string }>(
      'select handle from public.social_profiles order by handle',
    );
    expect(rows.map((r) => r.handle)).toEqual(['@shown']);
    await client.query('reset role');
  });

  it('exposes coming_soon countries but not inactive ones', async () => {
    await client.query('set role anon');
    const { rows } = await client.query<{ code: string; status: string }>(
      'select code, status from public.countries order by code',
    );
    expect(rows.some((r) => r.code === 'BD' && r.status === 'active')).toBe(true);
    expect(rows.every((r) => r.status !== 'inactive')).toBe(true);
    await client.query('reset role');
  });

  it('rejects public rendering of unverified evidence claims', async () => {
    await expect(
      client.query(`
        insert into public.evidence_claims (
          claim_code, claim_text_en, claim_text_bn, source_type, status, may_render_publicly
        ) values (
          'BAD-001', 'x', 'x', 'test', 'draft', true
        )
      `),
    ).rejects.toThrow(/evidence_claims_public_needs_verified|check constraint/i);
  });
});
