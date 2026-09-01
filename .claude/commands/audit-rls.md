---
description: Audit row-level security, tenant isolation, storage exposure and PII leakage across the Supabase schema
argument-hint: [table name, or blank for full audit]
allowed-tools: Read, Grep, Glob, Bash(npx supabase:*), mcp__supabase__list_tables, mcp__supabase__list_migrations, mcp__supabase__execute_sql, mcp__supabase__get_advisors
---

# RLS and data-exposure audit — $ARGUMENTS

We hold company registration documents, national IDs, passports and shareholding
structures for real businesses. A tenant-isolation failure here is not a bug report, it is
a disclosure event. Audit accordingly, and assume nothing is safe because it looks safe.

If `$ARGUMENTS` names a table, scope to it and its foreign-key neighbours. Otherwise audit
everything.

## 1. Coverage

For every table in the public schema:

- Is RLS **enabled**? A policy on a table without RLS enabled does nothing.
- Does it have at least one policy per operation actually used (select / insert / update /
  delete)? A table with only a `SELECT` policy silently blocks writes, or worse, was
  created before RLS and is wide open.
- List any table with **zero policies**. That is the headline finding.

## 2. Correctness, not just presence

A present policy is not a correct policy. For each one:

- Does it scope to the authenticated user's organisation, or does it merely check
  `auth.uid() is not null`? The second is not isolation — it lets any logged-in customer
  read every other customer.
- Are there policies using `USING (true)` or `TO public`? Flag every one.
- Do `INSERT` policies have a `WITH CHECK` clause? Without it a user can insert rows
  attributed to another tenant.
- Is the `service_role` key used anywhere it could be reached from client code? Grep the
  repo, not just the schema.

## 3. Provider access

Providers (lawyers, auditors, VAT consultants) get scoped access to a single Case. Verify:

- Access is scoped to the specific Case, not to the Entity or the organisation
- It is time-boxed and revoked on Case close
- A provider cannot enumerate other Cases, other Entities, or the customer list

## 4. Storage

- Any public bucket holding customer documents is a critical finding
- Signed URLs: confirm short expiry, and confirm they are generated server-side
- Confirm storage policies mirror the table policies — a locked-down `documents` table with
  an open bucket protects nothing

## 5. Leakage in code and logs

Grep for:

- PII or document contents written to logs, analytics, or error reporting
- Customer identifiers in URLs that get captured by third-party scripts
- Service-role or API keys reachable from a client bundle
- Anthropic API calls made client-side (see @CLAUDE.md §6 — these must be server-side only)

## 6. Advisors

Run the Supabase security advisors and the performance advisors. Report everything the
security advisors flag. Do not dismiss a finding as pre-existing without saying so
explicitly.

## Output

A table of findings ordered by severity:

| Severity | Table / file | Finding | Fix |
| -------- | ------------ | ------- | --- |

Use **critical** only for cross-tenant read or write exposure, or customer documents
reachable without auth. Then: propose the migrations that fix the criticals, but do not
apply them without confirmation.

Finally, state whether the tenant-isolation integration test described in @CLAUDE.md §10
exists and currently passes. If it does not exist, write it.
