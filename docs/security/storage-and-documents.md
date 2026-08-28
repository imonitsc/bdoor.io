# Storage and documents

Buckets (from `20260101001100_storage.sql`):

| Bucket                | Public | Holds                   |
| --------------------- | ------ | ----------------------- |
| `identity-documents`  | no     | passports, NIDs, photos |
| `case-documents`      | no     | filings, drafts         |
| `official-records`    | no     | issued certificates     |
| `message-attachments` | no     | message files           |
| `partner-credentials` | no     | partner evidence        |
| `public-marketing`    | yes    | marketing images only   |

Rules that must survive this upgrade:

- Opaque paths from `app.canonical_document_path()`; the client never chooses the path.
- Short-lived signed URLs after an authorisation check.
- Magic-byte sniffing before upload.
- Mock malware scanner never marks a file clean.
- Document access is an explicit grant (recipient, case, purpose, expiry, actions).
- Download events are audited.
- No public KYC URLs.

See [DATA-RETENTION.md](../DATA-RETENTION.md) for retention placeholders that still need counsel and an accountant.
