# Content approval matrix

Who may approve each class of public claim, what evidence the approval
needs, and where the claim is enforced in code. "Owner" means the business
owner; nothing below may be approved by an engineer, a coding agent or a
copywriter on their own.

| Claim class                                       | May be published when                                                                                                                          | Approver                               | Enforced by                                                                                                                |
| ------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| Prices (Bangladesh packages, standalone services) | The figure matches `src/content/packages/catalog.ts`, whose values are pinned to the owner-approved sheet                                      | Owner                                  | `tests/unit/commercial-catalog.test.ts` (figures), `tests/e2e/remediation.spec.ts` (page consistency)                      |
| Price display type                                | `fixed`/`from` may show figures; `estimated` must say so; `quote_required` shows none                                                          | Owner                                  | `priceType` in the catalog + unit schema tests                                                                             |
| International route status / prices               | Per the ladder in `docs/INTERNATIONAL_LAUNCH_MATRIX.md`; no price without `priceApproved`                                                      | Owner                                  | unit tests reject `publicLabel` without approval and pin the published figures exactly                                     |
| Featured starting prices (applications open)      | Only the owner-published table (29 Aug 2026 immediate-operations §5), always with its qualifier, as a starting estimate never a checkout total | Owner                                  | `tests/unit/commercial-catalog.test.ts` pins label, alt figure and qualifier; e2e asserts qualifier renders with the price |
| "Applications open — specialist reviewed" claim   | Only while the route runs `mode: managed_application` with the review SLA staffed                                                              | Owner                                  | `publicStatus`+`mode` ladder invariants in unit tests; e2e asserts no register-interest/coming-soon                        |
| Route availability ("available" wording)          | Only in availability `available_by_quote`/`available_online`; Saudi/Qatar stay eligibility-led                                                 | Owner, from signed partner agreement   | `availability` in the catalog + `tests/unit/commercial-catalog.test.ts` ladder invariants                                  |
| Statutory / authority fee sources                 | Only figures whose source row in `docs/COUNTRY_SOURCES.md` is within its re-verify date                                                        | Owner, from the authority's schedule   | fee components carry `sourceUrl`/`reviewedAt`; the ledger records the re-verify deadline                                   |
| Processing times                                  | Only with a reviewed figure and its review date, rendered as an estimate                                                                       | Owner, from authority evidence         | `displayableEstimate()` hides unreviewed estimates; e2e asserts the review date renders                                    |
| Government fees                                   | Only verified figures with a review date; otherwise "Quoted after review"                                                                      | Owner, from the authority's schedule   | fee components carry `isEstimate`/`reviewedAt`; service pages render the fallback                                          |
| Partner availability                              | No verified-network claim until ≥1 partner is verified **and** profile-approved                                                                | Admin (per partner), owner (page copy) | `partners.public_profile_approved` + `verified_partners_public` predicate + integration tests                              |
| Security claims                                   | Only controls that are implemented and testable (private storage, RLS, signed URLs, MFA, audit log)                                            | Owner, against the codebase            | claims live next to the features; no certification wording exists anywhere                                                 |
| Reviews / ratings / statistics / logos            | Not published. None exist that could be verified                                                                                               | Owner (future)                         | no components render them; adding one is a reviewed change                                                                 |
| Government affiliation                            | Never claimed; pages state non-affiliation where an authority is named                                                                         | —                                      | copy assertions in `tests/e2e/marketing.spec.ts`                                                                           |
| Approval / visa / bank-account promises           | Never made; everything is coordination with outcomes decided by authorities                                                                    | —                                      | "never promises approval" e2e assertion                                                                                    |
| Legal document status                             | Pre-launch notice while `LEGAL_CONTENT_STATUS=draft`; approved text only after counsel sign-off                                                | Owner + qualified counsel              | `src/lib/launch/gates.ts`, `docs/LEGAL_REVIEW_CHECKLIST.md`, e2e notice assertions                                         |
| Brand naming                                      | Public brand lowercase `bdoor`; contracting entity `bdoor compliance ltd`; no office address                                                   | Owner                                  | `tests/unit/brand-naming.test.ts`, e2e title-case check                                                                    |

## Process for a new or changed claim

1. The change lands in the relevant configuration (catalog, gates, legal
   documents) — never as ad-hoc page copy — in a PR.
2. The PR records the evidence class (owner sheet, authority schedule,
   counsel approval) and its date.
3. Both locales change in the same PR; `tests/unit/messages.test.ts` fails
   on drift.
4. If a test in the table above blocks the change, the test is the
   specification: update it in the same PR only with the matching approval
   recorded in the commit message.
