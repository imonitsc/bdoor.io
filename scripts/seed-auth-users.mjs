#!/usr/bin/env node
/**
 * Give the seeded sample accounts a password so they can actually sign in.
 *
 * `supabase/seed.sql` inserts `auth.users` rows with an id and an email only,
 * which is enough for foreign keys and for the RLS tests but not enough to log
 * in. This script fills in the rest through the Admin API, keeping the same ids
 * so every seeded organisation membership, case and document still lines up.
 *
 *   node scripts/seed-auth-users.mjs
 *
 * Requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY. It refuses to run
 * against anything that does not look like a development project unless
 * ALLOW_NON_LOCAL=1 is set, because it writes passwords into an auth schema.
 *
 * The password is read from SEED_PASSWORD. There is no default: a checked-in
 * default password is a credential, and this repository does not carry one.
 */

import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const secret = process.env.SUPABASE_SECRET_KEY;
const password = process.env.SEED_PASSWORD;

function fail(message) {
  console.error(`seed-auth-users: ${message}`);
  process.exit(1);
}

if (!url) fail('NEXT_PUBLIC_SUPABASE_URL is not set.');
if (!secret) fail('SUPABASE_SECRET_KEY is not set.');
if (!password) {
  fail('SEED_PASSWORD is not set. Choose one for this environment and export it.');
}
if (password.length < 12) fail('SEED_PASSWORD must be at least 12 characters.');

const local = /localhost|127\.0\.0\.1|\.local\b/.test(url);
if (!local && process.env.ALLOW_NON_LOCAL !== '1') {
  fail(
    `refusing to write passwords into ${url}. This is meant for a development project; ` +
      'set ALLOW_NON_LOCAL=1 if you are certain.',
  );
}

/**
 * Mirrors the ids in `supabase/seed.sql`. Every one of these is fictional; the
 * `.test` and `.example` suffixes are reserved by RFC 2606 and cannot resolve.
 */
const USERS = [
  { id: '11111111-1111-4111-8111-000000000001', email: 'founder.local@example.test' },
  { id: '11111111-1111-4111-8111-000000000002', email: 'founder.foreign@example.test' },
  { id: '11111111-1111-4111-8111-000000000003', email: 'colleague@example.test' },
  { id: '22222222-2222-4222-8222-000000000001', email: 'partner.owner@example.test' },
  { id: '22222222-2222-4222-8222-000000000002', email: 'partner.staff@example.test' },
  { id: '33333333-3333-4333-8333-000000000001', email: 'case.manager@bdoor.test' },
  { id: '33333333-3333-4333-8333-000000000002', email: 'compliance@bdoor.test' },
  { id: '33333333-3333-4333-8333-000000000003', email: 'finance@bdoor.test' },
  { id: '33333333-3333-4333-8333-000000000004', email: 'admin@bdoor.test' },
];

const admin = createClient(url, secret, { auth: { persistSession: false } });

let updated = 0;
let created = 0;

for (const user of USERS) {
  // The row usually already exists from seed.sql, so try the update first and
  // fall back to a create with an explicit id.
  const { error: updateError } = await admin.auth.admin.updateUserById(user.id, {
    password,
    email_confirm: true,
  });

  if (!updateError) {
    updated += 1;
    console.log(`updated  ${user.email}`);
    continue;
  }

  const { error: createError } = await admin.auth.admin.createUser({
    id: user.id,
    email: user.email,
    password,
    email_confirm: true,
  });

  if (createError) {
    // Never print the password or the key; the message alone is enough.
    fail(`${user.email}: ${createError.message}`);
  }

  created += 1;
  console.log(`created  ${user.email}`);
}

console.log(`\n${created} created, ${updated} updated.`);
console.log(
  'Staff and partner accounts still need TOTP enrolled before they can reach their workspace.',
);
