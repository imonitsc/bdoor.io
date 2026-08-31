# Bangladesh Source Policy

What Ask bdoor AI is allowed to treat as an authority, and in which order.
This policy is executable: the tiers live in `ai_source_registry` /
`ai_knowledge_sources.authority_tier`, retrieval prefers lower tiers, and the
review playbook applies the rules below before anything is published.

## The hierarchy

| Tier | Source                                                             | Examples                                            |
| ---- | ------------------------------------------------------------------ | --------------------------------------------------- |
| 1    | Bangladesh Gazette and extraordinary gazettes                      | dpp.gov.bd/bgpress                                  |
| 2    | Laws of Bangladesh maintained by the Ministry of Law               | bdlaws.minlaw.gov.bd                                |
| 3    | Acts, rules, SROs, circulars and orders published by the regulator | nbr.gov.bd, bb.org.bd, roc.gov.bd, doe.gov.bd       |
| 4    | Official agency forms, fee schedules, procedures and service pages | app.roc.gov.bd services, city-corporation fee pages |
| 5    | Official FAQs, manuals, notices and government publications        | banglabiz.gov.bd guidance, programme pages          |
| 6    | Trusted secondary sources — **discovery only**                     | professional firm write-ups, reputable press        |

A tier-6 source may point a reviewer at a document. It is **never** the sole
authority for a legal, tax, regulatory, fee or deadline claim: the claim is
published only once tiers 1–5 confirm it, or it is not published.

## Rules

1. **A `.gov.bd` domain proves nothing by itself.** Every document records
   its issuing institution; review verifies the document is genuine, current
   and relevant before publication. A ministry page mirroring another
   authority's document is catalogued under the _issuing_ authority.
2. **When sources disagree, the higher authority wins** — and the answer says
   the sources differ. The gazette text of an SRO beats a regulator's summary
   of it; the regulator's circular beats a service portal's paraphrase.
3. **Currency is tracked, not assumed.** Every document carries publication,
   effective and (where applicable) expiry dates plus a
   current/amended/superseded/withdrawn/proposed status. Retrieval serves
   only effective, unexpired sources; historical versions stay in the
   registry, linked to their replacements, and are never silently deleted.
4. **A proposal is not a rule.** Draft amendments, budget speeches and
   consultation papers are `proposed` and cannot be published to the
   assistant until a reviewer records evidence they took effect (the gazette
   notification, the enacted Finance Act).
5. **Fees and deadlines are quoted verbatim with their instrument** (act,
   rule, SRO, circular, form or fee-schedule number) or not at all. An
   unverified figure renders as "quoted after review".
6. **Local requirements are labelled local.** A city-corporation trade
   licence fee belongs to that corporation's jurisdiction; the assistant must
   not present Dhaka North's schedule as national law.
7. **Collection is polite and lawful.** robots.txt is honoured, requests are
   rate-limited per host, and nothing bypasses authentication, CAPTCHAs or
   access controls — a document behind a login is recorded as not publicly
   retrievable, full stop. Site terms flagged in review are recorded on the
   registry row.
8. **Originals are preserved privately.** The exact retrieved bytes live in
   the private `ai-source-documents` bucket with their sha-256 checksum;
   nothing downloaded from a government site is committed to git or served
   publicly by bdoor.

## The registry

The starting registry (31 institutions: gazette, bdlaws, RJSC ×2, NBR, BIDA,
BanglaBiz, Bangladesh Bank/BFIU, the commerce/industries/labour ministries,
DIFE, DoE, Fire Service, CCI&E, EPB, DPDT, BSEC, BTRC, BSTI, Customs,
e-GP/CPTU, Startup Bangladesh, iDEA, BSCIC, BEZA, BEPZA, Hi-Tech Park
Authority, and the Dhaka North/South and Chattogram city corporations) is
seeded from `src/features/ai/registry/registry-seed.ts` and editable at
`/admin/ai/registry` — frequency, enablement and additions are operational
decisions, not deploys. Gazettes and circular feeds are checked daily to
every 3 days; static guidance weekly.
