# Data model (upgrade delta)

The live schema is described in [DATA_MODEL.md](../DATA_MODEL.md). This file records **additive** structures introduced by the production-upgrade migration `20260101001700_directory_and_evidence.sql`.

## New tables

| Table                   | Purpose                                                                                         | Public read                                       |
| ----------------------- | ----------------------------------------------------------------------------------------------- | ------------------------------------------------- |
| `countries`             | Jurisdiction config. `operational_status` is `active`, `pilot` or `coming_soon`.                | published rows                                    |
| `industries`            | Sector pages. Informational; not legal advice.                                                  | published / coming_soon                           |
| `authorities`           | Independent directory. No government logos. Official URLs only when `source_status = verified`. | published name + disclaimer; URL only if verified |
| `evidence_claims`       | Claim register. `status` draft / verified / expired / withdrawn.                                | verified only                                     |
| `social_profiles`       | Network, URL, handle, status.                                                                   | `active` and verified only                        |
| `legal_policy_versions` | Draft / approved / published snapshots of policy text.                                          | published only; none are published in this branch |

## Service columns added

`country_code`, `delivery_mode`, `ownership_scope`, `is_recurring`, `finder_intent`. Defaults keep existing rows valid (`BD`, `hybrid`, `any`, `false`, null).

## What was not duplicated

Quotes, cases, documents, KYC, payments, consent and audit tables already exist. This upgrade does not create parallel copies.
