# Launch gates

Machine-readable twin: `src/content/launch/gates.ts`.  
Staff view: `/admin/launch` (requires `settings.manage`).

A gate is **open** until its evidence is recorded. An open P0 gate means the product is not commercially launchable, even if the preview is green.

| ID  | Gate               | Owner                                | Status      | Evidence                                                                                                                 | Blocking consequence                                                                       |
| --- | ------------------ | ------------------------------------ | ----------- | ------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------ |
| A   | Legal              | Qualified Bangladesh counsel + owner | **open**    | Draft pages only (`awaitingCounselReview: true`)                                                                         | Must not take paying customers on these terms                                              |
| B   | Identity and trust | Owner                                | **open**    | No verified legal entity, address, phone, leadership bios                                                                | Must not publish operator identity                                                         |
| C   | Partners           | Owner + verifying staff              | **open**    | Seed partner is fictional `(sample)`; no live verified org                                                               | Must not advertise verified partners                                                       |
| D   | Security           | Engineering                          | **partial** | Auth, RLS, storage, tenancy and negative tests pass in CI. Preview shares production Supabase. Screening/malware mocked. | Must not onboard real identity documents at scale until scanner + split environments exist |
| E   | Operations         | Operations lead                      | **partial** | Queues, assignment, quotes, receipts, refunds exist in the app. Email is mock. No rehearsed SLA.                         | Must not promise operational SLAs                                                          |
| F   | Production release | Owner                                | **open**    | No approved preview of this branch                                                                                       | Must not merge or promote                                                                  |

## Gate A — Legal

Required before commercial launch: approved final text; legal entity and contacts; effective date and version; processor register; retention schedule; cross-border position; liability and governing law; refund/consumer position; AML officer and escalation; cookie statement matching the deployed system.

Cursor does not write final legal advice. Draft banners stay.

## Gate B — Identity and trust

Required: operator legal entity, registration details, address, business phone and WhatsApp, legal/privacy/complaints contacts, founders/leadership, role of bdoor in each service.

Until provided, public pages omit those fields rather than substituting placeholders.

## Gate C — Partners

Do not advertise verified partners until at least one relevant organisation has completed the verification workflow (`partners.verification_status = verified` on a real, non-seed organisation).

## Gate D — Security

Require passing Auth, RLS, Storage, tenancy, payment, backup, audit and negative-access tests. Split preview/production data. Configure a real malware scanner before staff download of customer identity files.

## Gate E — Operations

Require working staff queues, assignment, SLA, case communication, quotation, receipt, refund and escalation — with a live email adapter and a named on-call person.

## Gate F — Production release

Require owner approval of the exact tested Vercel preview artifact. This branch does not merge or promote itself.
