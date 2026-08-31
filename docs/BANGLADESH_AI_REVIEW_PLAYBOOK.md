# Bangladesh AI Review Playbook

How a bdoor reviewer (capability: `content.publish`) turns an ingested
government document into something Ask bdoor AI may cite. The workflow is
enforced in code — this playbook explains how to use it well, not how to keep
to it, because the shortcuts it forbids do not exist as buttons.

## The reviewer's screens

| Screen                     | Job                                                                                         |
| -------------------------- | ------------------------------------------------------------------------------------------- |
| `/admin/ai`                | Overview, alert/failed-job summary, the existing knowledge table                            |
| `/admin/ai/registry`       | Which institutions are watched, how often, and their fetch health                           |
| `/admin/ai/documents`      | The pipeline: change alerts, failed jobs, every document's lifecycle                        |
| `/admin/ai/documents/{id}` | One document: metadata, extracted text beside the stored original, version chain, its rules |
| `/admin/ai/rules`          | Draft structured rules: review, verify fees, publish                                        |
| `/admin/ai/coverage`       | Honest coverage by topic and regulator; gaps; review-due dates                              |
| `/admin/ai/testing`        | The exact retrieval context for any question, without a model call                          |

## Reviewing a document (`review_required` → `approved` → published)

1. **Open the original.** Read the extracted text _against_ the stored
   original (signed 10-minute link). Reject back for refetch if extraction
   mangled tables, Bangla text or numbering — an `encoding_suspect` note on
   the record means exactly that check.
2. **Verify provenance.** Is the issuing institution the one with authority
   to issue this? Is the reference number (act/rule/SRO/circular/form) on the
   document itself? Correct the metadata before approving; the metadata _is_
   the citation customers will see.
3. **Verify currency.** Confirm the document is in force: effective date
   present, no later amendment in the registry, no withdrawal notice. If it
   is a draft or budget proposal, set currency to `proposed` — a proposed
   document refuses publication until you record evidence it took effect.
4. **Set scope and review date.** Topics, entity types, jurisdiction (a city
   corporation schedule is local, never national), and a `review_due_on` that
   matches how fast this source really changes.
5. **Approve, then publish.** Publication copies the reviewed text into the
   retrievable corpus under your identity and is audit-logged. Then **index**
   it (the existing embed step) — published-but-not-indexed is flagged on the
   overview and is live everywhere except retrieval.
6. **Test.** Ask the retrieval console the questions this document should now
   answer, in both languages. If the right section does not surface, the
   chunking or metadata needs work before customers meet it.

## Reviewing structured rules

"Extract draft rules" runs the extraction model over a reviewed document and
creates **drafts** — the model cannot publish, and its name is recorded on
every row it wrote.

For each draft: check every field against the document (not against memory);
delete what the model over-read; then the two gates the code enforces:

- **Fee verification.** "Verify fee" is your personal assertion that the
  figure matches the instrument, recorded in the audit trail. A rule with an
  unverified fee cannot be published, and an unverified fee renders to the
  model as "quoted after review", never as a number.
- **Legal authority.** A rule must name the instrument and provision it
  rests on. No authority, no publication.

Publish only rules a customer could rely on as written. When an amendment
lands (you will get a fee/deadline/form change alert), publish the new
version and mark the old rule superseded — never edit a published rule's
substance in place.

## Alerts and failures

- **Change alerts** (new version, fee/deadline/form change, withdrawal
  notice) are review work with a deadline of "before a customer asks".
  Resolve an alert only after the new version is reviewed or the change
  dismissed as irrelevant — resolution is audited.
- **Failed sources** (abandoned jobs, consecutive fetch failures on the
  registry screen) mean the watch on that institution is dark. Fix the URL,
  adjust the frequency, or accept and record the gap.
- **Coverage gaps** on `/admin/ai/coverage` are the backlog, ordered by what
  customers actually ask (the unanswered-questions queue feeds it).

## Model changes

`AI_EXTRACTION_MODEL` may move to a cheaper slug only after that slug passes
an extraction evaluation: run it over at least ten already-reviewed documents
spanning Bangla, English, PDF and HTML, and compare its drafts against the
approved rules. Adopt it when its drafts need no _more_ correction than the
current model's. The answer model change bar is higher and belongs to the
release process, not this playbook.

## What never happens

No publication without a named human reviewer. No editing a published
answer, document text or rule substance in place — corrections are new
versions. No fee, deadline or requirement published on the strength of a
tier-6 (secondary) source. No OCR guesswork: a scanned document without a
configured OCR provider waits for manual transcription in review.
