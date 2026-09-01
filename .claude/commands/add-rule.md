---
description: Add a regulatory rule to the corpus with mandatory provenance and effective dating
argument-hint: <jurisdiction> <short description of the requirement>
allowed-tools: Read, Grep, Glob, Write, Edit, WebFetch
disable-model-invocation: true
---

# Add rule — $ARGUMENTS

The rules corpus is the company's moat. A competitor can point a model at the same public
sources tomorrow; they cannot clone a verified, provenance-carrying, effective-dated
corpus. Treat every row as something a regulator, an auditor or a customer's lawyer might
one day read back to us.

## Hard rules — do not proceed if any cannot be satisfied

1. **No provenance, no row.** Every rule requires `source_url`, `source_authority`,
   `source_published_at`. A rule sourced from "general knowledge", a blog, a consultancy
   marketing page, or the model's own training is **not admissible**. Only primary sources:
   the authority's own site, the gazette, the act, the official circular.

2. **Never invent a deadline, fee, or licence name.** If you cannot find the primary
   source, stop and report what is missing. A missing rule is a gap; a fabricated rule is a
   liability that reaches a real business.

3. **Effective-dated, never overwritten.** If this rule supersedes an existing one, close
   the old row with `effective_to` and insert a new row. Never `UPDATE` a rule's substance.
   We must be able to answer "what was true in March?"

4. **Rules are data, not code.** Nothing about this requirement goes into a component, an
   API route or a prompt.

5. **`verified_by` is a human.** Set it to the analyst who confirmed it, not to Claude. If
   no human has verified it, mark the row unverified and it must not be servable to Ask.

## Fields to fill

- `jurisdiction_code`, and the entity types and sectors it applies to (be specific — an
  over-broad rule is worse than no rule, because it fires on the wrong customers)
- The obligation itself: what must be done, with which authority
- Trigger: what causes it to apply (incorporation, turnover threshold, sector, headcount)
- Deadline: expressed as a rule relative to a trigger date, **not** a fixed calendar date
- Frequency: one-off, annual, quarterly, monthly
- Official fee, as minor units + currency
- Penalty for non-compliance, if the source states one
- Provenance block (above)
- `effective_from`, `effective_to`

## Deadline arithmetic

Bangladesh's fiscal year runs July–June. Do not assume January. Express deadlines as
offsets from a trigger with an explicit calendar basis, and add a test case covering: a
leap year, a deadline landing on a weekend, and a deadline landing on a public holiday in
that jurisdiction.

## Before finishing

- Fetch the source URL and confirm it currently says what the rule claims. Quote the
  relevant line in the PR description.
- Check the corpus for a duplicate or a conflicting rule. Conflicts are more dangerous than
  gaps — flag any you find rather than silently adding a second version.
- Confirm an analyst can read and edit this row without a developer.
- Add the test cases described above.

## Report back

State the source you used, the line that supports the rule, what you could **not** verify,
and what a human still needs to confirm before this rule is marked verified.
