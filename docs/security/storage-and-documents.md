# Storage and documents

## Buckets

| Bucket              | Public?                        |
| ------------------- | ------------------------------ |
| identity-documents  | private                        |
| case-documents      | private                        |
| official-records    | private                        |
| message-attachments | private                        |
| partner-credentials | private                        |
| public-marketing    | public (marketing assets only) |

## Rules

- Opaque paths via `app.canonical_document_path()` — clients never choose paths
- Authorisation before signed URL minting
- Upload type/size validation server + client
- Malware scan before staff/partner download (live provider required for launch)
- Checksums + document versions
- Download audit events
- Explicit document access grants (recipient, purpose, expiry, actions)
- Customer visibility of which partner can access which documents and why
