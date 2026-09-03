-- ---------------------------------------------------------------------------
-- The claim/citation audit, persisted (CLAUDE.md §7.1 step 12, §16.4, §19).
--
-- src/features/ai/citations.ts already audits every completed answer against
-- the sources it was given. Until now the verdict was logged as counts and
-- thrown away, so "how often do we state a fee with nothing behind it" — an
-- investor metric in §19 and a review queue in §16.4 — could not be answered
-- at all. These columns make it a query.
--
-- Six columns, and citation_count is the one that is not optional.
--
-- The audit needs to know how many numbered sources the prompt carried, and
-- that number CANNOT be derived from what was already stored. `source_ids` is
-- de-duplicated — two chunks from one gazette are two numbered citations but
-- one source id — and the catalogue citation [1] has no source id at all.
-- Recomputing the count as source_ids + rule_ids therefore under-counts, and
-- an under-count makes legitimate high-numbered markers look fabricated. That
-- is precisely the false accusation the audit is designed never to make, so
-- the real count is recorded rather than inferred.
--
-- The other five are counts the audit produced at the time. They are stored
-- rather than recomputed on read because a column can be indexed, filtered and
-- averaged, and "show me answers with uncited claims" is not a question you
-- can ask by re-running string analysis across a table. Per-sentence detail is
-- NOT stored: the admin trace recomputes it from the answer text on demand, so
-- it always reflects the current detector instead of a frozen verdict, and the
-- answer text stays in exactly one place.
--
-- Note for anyone comparing the two: the stored counts came from the answer as
-- generated, while a recomputation runs over the REDACTED content column. They
-- are usually identical and are not guaranteed to be. The stored counts are
-- the record; the recomputed sentences are the explanation.
--
-- No new RLS policy: ai_messages already carries ai_messages_own_read and
-- ai_messages_staff_read, and row-level security governs rows, not columns, so
-- these inherit the existing grants. tests/integration cover that explicitly.
--
-- Reversal: drop the six columns. Nothing reads them that does not tolerate
-- null, and no other object depends on them.
-- ---------------------------------------------------------------------------

alter table public.ai_messages
  -- How many numbered sources the prompt carried. Null for rows written
  -- before this migration and for any answer that did not complete.
  add column citation_count smallint,
  add column material_claims smallint,
  add column supported_claims smallint,
  add column uncited_claims smallint,
  add column fabricated_marker_count smallint,
  add column citation_audit_ok boolean;

comment on column public.ai_messages.citation_count is
  'Numbered sources in the prompt. Not derivable from source_ids: those are de-duplicated and exclude the catalogue citation.';
comment on column public.ai_messages.fabricated_marker_count is
  'Distinct citation markers naming a source that was never retrieved. Non-zero is a defect, not a heuristic opinion (CLAUDE.md §7.4).';

-- The review queue reads "answers whose audit failed, newest first". A partial
-- index keeps it to the rows that are actually interesting: a healthy corpus
-- makes this index small, and an unhealthy one makes it earn its keep.
create index ai_messages_citation_audit_failed_idx
  on public.ai_messages (created_at desc)
  where citation_audit_ok is false;
