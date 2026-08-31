# Bangladesh Knowledge Coverage Report

Snapshot at the initial release of the authoritative knowledge system
(31 Aug 2026). The live version of this report is `/admin/ai/coverage`,
which recomputes from the database; this file records where the system
_started_, so later reports have a baseline.

Coverage is partial and will remain partial. Nothing in this system can
claim "all Bangladesh information complete", by design.

## What is published and retrievable today

- **19 bdoor-authored knowledge sources** (the reviewed site content:
  what bdoor is and is not, the Bangladesh service catalogue, package
  inclusions/exclusions, the six international country formation guides, and
  the assistant's own data-boundary disclosures — several in both English and
  Bangla). These answer service, process and pricing-context questions with
  citations to bdoor's own published pages, and live prices always come from
  the structured catalogue records, never from prose.
- **0 official government documents** and **0 structured rules** — the
  registry pipeline ships empty of published official material on purpose:
  nothing enters the customer-facing corpus without review, and this
  environment cannot reach `.gov.bd` (egress-restricted), so the first
  fetches run from the production cron after the merge.

## What is watched

**31 official institutions seeded** across all six authority tiers — the
Gazette (tier 1), Laws of Bangladesh (tier 2), and the regulators, agencies,
ministries, programmes and three city corporations listed in
`docs/BANGLADESH_SOURCE_POLICY.md` (tiers 3–5). Twelve of the thirteen
taxonomy topics have at least one watched source; `international_expansion`
is served by bdoor's own country guides rather than a Bangladesh regulator.

## Gaps, honestly

Until documents clear review, every regulatory figure — fee, deadline, tax
rate — that is not in bdoor's reviewed content is answered as "cannot be
confirmed" with a specialist offer. That is the designed behaviour, not a
degraded state. The immediate review backlog, in the order customers ask:

1. RJSC fee schedule and name-clearance/incorporation procedure pages
2. City-corporation trade licence procedures and fee schedules (DNCC/DSCC/CCC)
3. NBR TIN/BIN registration procedures and current-year rates
4. CCI&E IRC/ERC procedures and renewal fees
5. Bangladesh Bank FE circulars relevant to foreign investors
6. DoE clearance categories; Fire Service licence procedure
7. DPDT trademark procedure and fees; e-GP registration; startup programmes

## How this report updates

The admin coverage screen is live. Re-issue this file (new date, same path)
at each knowledge release; the `missing topics` list and per-topic counts
come from `/admin/ai/coverage`, which enumerates the fixed taxonomy so a gap
cannot hide.
