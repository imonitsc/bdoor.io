# Data model (upgrade notes)

Canonical schema documentation: `docs/DATA_MODEL.md`.

## Domains already present

profiles, organisations/memberships, services/categories/fees, assessments, companies/people, cases/assignments/milestones, documents/versions/access, KYC (public status) + compliance (private), quotes/invoices/payments, messages/notifications, compliance obligations, consents, audit logs.

## Additive upgrade targets (migrations must be reversible/additive)

| Area                          | Intent                                                          |
| ----------------------------- | --------------------------------------------------------------- |
| `evidence_claims`             | Public-claim gate: draft/verified/expired/withdrawn             |
| `countries`                   | International framework; inactive until providers ready         |
| `industries`                  | Sector pages; publish only when reviewed                        |
| `authorities`                 | Informational directory; no government logos without permission |
| `services.delivery_mode`      | online / hybrid / in_person                                     |
| `social_profiles`             | Footer/`sameAs` only when active+verified                       |
| Price versioning enhancements | Preserve historical quotation reproducibility                   |

Do not duplicate tables that already exist. Prefer columns/enums and join tables.
