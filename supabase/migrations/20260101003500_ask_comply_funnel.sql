-- ---------------------------------------------------------------------------
-- Ask becomes the top of the Comply funnel (ROADMAP P2).
--
-- Two small pieces of persistence:
--
-- 1. ai_messages.rule_ids — which published structured rules grounded an
--    answer, beside the knowledge-source ids already recorded. "Log the
--    question and what was retrieved" (CLAUDE.md §7) now covers the half of
--    retrieval the Comply funnel runs on, and "which answers cited rule X"
--    becomes answerable when a rule is superseded.
--
-- 2. Two funnel events in the analytics taxonomy:
--      ask_comply_exit        — a visitor followed an answer's "track this"
--                               exit into the Comply entry
--      comply_company_tracked — an existing company was added to the
--                               workspace through that entry
--    The check constraint is re-created in full; this file is now the
--    authority the taxonomy drift test reads.
--
-- Reversal: drop the rule_ids column; re-create the constraint with the
-- previous thirteen names.
-- ---------------------------------------------------------------------------

alter table public.ai_messages
  add column rule_ids uuid[] not null default '{}';

alter table public.analytics_events
  drop constraint analytics_events_name_values;

alter table public.analytics_events
  add constraint analytics_events_name_values check (
    event_name in (
      'application_started',
      'application_submitted',
      'contact_submitted',
      'provider_application_submitted',
      'provider_application_approved',
      'provider_assignment_accepted',
      'quote_issued',
      'quote_viewed',
      'quote_accepted',
      'payment_confirmed',
      'case_completed',
      'subscription_started',
      'subscription_renewed',
      'ask_comply_exit',
      'comply_company_tracked'
    )
  );
