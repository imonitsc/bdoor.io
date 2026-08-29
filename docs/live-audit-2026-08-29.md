# Live-site audit — 29 August 2026

Findings on the deployed site at the time the immediate-operations
instructions were issued, and what this branch does about each. The earlier
pre-remediation audit is `docs/live-site-baseline-2026-08-29.md`; this file
records the delta the immediate-operations work addresses.

| #   | Finding on the live site                                                                                 | Root cause                                                                | Fix on this branch                                                                                               |
| --- | -------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| 1   | /how-it-works rendered raw translation keys (`one.title`, `one.body`, …) in its timeline                 | page requested the non-existent `home.howItWorks.steps` namespace         | points at `home.process.steps`; steps rewritten to the operational flow; e2e raw-key sweep added in both locales |
| 2   | International routes said "Register interest" / "route in preparation" despite the owner operating them  | catalog `publicStatus: register_interest` predated the owner's activation | all six routes are `applications_open` managed applications with published starting estimates and qualifiers     |
| 3   | No prices anywhere on international pages                                                                | `priceApproved: false` before the owner published the §5 figures          | featured starting prices + mandatory qualifiers render on country pages, the countries index and the homepage    |
| 4   | No application flow — country CTAs pointed at the contact form                                           | the assessment predated the country-first model                           | /start is country-first with branching, contact + consent, persistence, reference, acknowledgement and ops queue |
| 5   | Homepage hero used a generic illustrated person                                                          | placeholder visual pending a founder photograph that was never supplied   | hero rebuilt around a product module labelled "Product preview"; founder imagery removed, not replaced           |
| 6   | Header carried six top-level groups                                                                      | seven-country restructure predated the §7.3 simplification                | five destinations (Start/Services/Countries/Pricing/Resources); Partners and company links in drawer + footer    |
| 7   | Legal pre-launch notice said applications were effectively closed ("payments … not yet enabled" framing) | notice written before the applications-open model                         | §11.4 banner: applications open; paid engagements/identity/document collection only after terms are supplied     |
| 8   | Contact attribution columns missing in production (PGRST204 fallback active)                             | migrations 20260101001300–20260101002000 not yet applied by the owner     | unchanged here — owner action; the new applications migration (20260101002100) joins the same list               |

Unchanged and still true from the baseline audit: no real customer numbers,
reviews, logos or partnerships are published; storage and compliance schema
remain private; the legal gate keeps payments and identity collection off.
