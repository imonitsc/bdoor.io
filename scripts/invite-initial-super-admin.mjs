#!/usr/bin/env node
/**
 * Grant the first super_admin.
 *
 * There is a bootstrap problem: `app.may_invite_template()` refuses to let
 * anybody hand out a permission they do not hold themselves, so on a fresh
 * database — where nobody holds anything — no invitation can create the first
 * super_admin. Something outside the permission system has to start it. This
 * script is that something, and it is deliberately the only thing that is.
 *
 *   node scripts/invite-initial-super-admin.mjs someone@example.com
 *
 * It does NOT create the account and it does NOT set a password. The person
 * signs up through the application like anyone else; this only raises an
 * account that already exists. Inserting into `auth.users` or seeding a
 * password would be inventing a credential, and this repository does not do
 * that.
 *
 * Requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY. Against anything
 * that is not obviously a local project it refuses unless ALLOW_NON_LOCAL=1,
 * because granting super_admin on the wrong project is not something to
 * discover afterwards.
 *
 * It refuses outright once a super_admin exists. Bootstrap happens once; every
 * later grant goes through the invitation flow, where it is attributable.
 */

import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const secret = process.env.SUPABASE_SECRET_KEY;
const email = process.argv[2]?.trim().toLowerCase();

function fail(message) {
  console.error(`invite-initial-super-admin: ${message}`);
  process.exit(1);
}

if (!url) fail('NEXT_PUBLIC_SUPABASE_URL is not set.');
if (!secret) fail('SUPABASE_SECRET_KEY is not set.');
if (!email) fail('Pass the email address of an existing account as the first argument.');
if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) fail(`Not an email address: ${email}`);

const local = /localhost|127\.0\.0\.1|\.local\b/.test(url);
if (!local && process.env.ALLOW_NON_LOCAL !== '1') {
  fail(
    `${url} does not look like a local project. Granting super_admin is not reversible ` +
      'by this script. Re-run with ALLOW_NON_LOCAL=1 if that is genuinely what you want.',
  );
}

const supabase = createClient(url, secret, {
  auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
});

// Refuse if the platform already has a super_admin. Bootstrap happens once;
// after that the invitation flow is the path, and it leaves a record of who
// granted what to whom.
const { data: existing, error: existingError } = await supabase
  .from('platform_roles')
  .select('user_id')
  .eq('role', 'super_admin')
  .limit(1);

if (existingError) fail(`Could not read platform_roles: ${existingError.message}`);
if (existing?.length) {
  fail(
    'A super_admin already exists. Use the invitation flow in the admin panel — ' +
      'it records who granted the role and why. This script is for bootstrap only.',
  );
}

// Find the account. listUsers is paged, so walk it rather than assuming the
// address is on the first page of a project that has been running a while.
let user;
for (let page = 1; page <= 50 && !user; page += 1) {
  const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 200 });
  if (error) fail(`Could not list users: ${error.message}`);
  if (!data.users.length) break;
  user = data.users.find((candidate) => candidate.email?.toLowerCase() === email);
}

if (!user) {
  fail(
    `No account exists for ${email}. Sign up through the application first, confirm the ` +
      'address, then run this again. This script does not create accounts.',
  );
}

if (!user.email_confirmed_at) {
  fail(
    `${email} has not confirmed their address. Confirm it before granting a platform role — ` +
      'an unconfirmed address is not proof anybody controls it.',
  );
}

const { error: roleError } = await supabase
  .from('platform_roles')
  .insert({ user_id: user.id, role: 'super_admin' });

if (roleError) fail(`Could not grant super_admin: ${roleError.message}`);

// Every platform role must carry MFA. Setting the flag here means the very
// first account is held to it too, rather than being the one exception.
const { error: securityError } = await supabase
  .from('user_security_settings')
  .upsert({ user_id: user.id, mfa_required: true }, { onConflict: 'user_id' });

if (securityError) {
  console.warn(
    `invite-initial-super-admin: granted the role, but could not set mfa_required: ` +
      `${securityError.message}. Set it before this account is used.`,
  );
}

await supabase.from('audit_logs').insert({
  actor_id: user.id,
  action: 'platform.super_admin_bootstrapped',
  target_type: 'platform_role',
  target_id: user.id,
  metadata: { via: 'invite-initial-super-admin script', local },
});

console.log(`Granted super_admin to ${email} (${user.id}).`);
console.log('');
console.log('Next, before this account is used for anything:');
console.log('  1. Sign in and enrol TOTP at /en/app/security. The workspace will');
console.log('     insist on it — every platform role requires a second factor.');
console.log('  2. Invite the rest of the team from the admin panel, so each grant');
console.log('     is attributable. Do not run this script again; it will refuse.');
