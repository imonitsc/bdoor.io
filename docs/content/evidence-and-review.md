# Evidence and review

Public regulatory or marketing claims require an evidence-register record before render.

Schema (YAML/JSON under `content/evidence-register/` and DB table `evidence_claims`):

- claim ID
- claim text
- source type
- official source URL
- source publication/update date
- date last verified
- reviewer
- status: `draft` | `verified` | `expired` | `withdrawn`
- countries/services where the claim may appear

**Unverified claims must not render publicly.** UI helpers filter to `verified` with non-expired `lastVerifiedAt`.

Content pages and services already carry `content_sources` / `internal_source_ref` / review dates — evidence-register is the cross-cutting gate for homepage trust, stats, affiliations and fee assertions beyond the fee-component constraints.
