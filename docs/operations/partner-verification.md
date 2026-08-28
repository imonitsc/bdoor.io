# Partner verification

Partners are organisations of kind `partner`, not a second database.

1. Admin creates the organisation (`unverified`).
2. Invite the owner; they enrol TOTP (required).
3. Credential evidence goes to `partner-credentials`.
4. A BDoor admin sets `verification_status = verified`. A partner cannot verify itself (`app.partners_guard()`).
5. Only verified partners appear in `verified_partners_public`.
6. Case assignment is explicit. Documents are visible only while the customer grant stands.

Do not create ordinary partner accounts for government officials. Do not advertise verified partners until a real (non-seed) organisation has completed this flow.

See [ROLES.md](../ROLES.md) and the README partner section.
