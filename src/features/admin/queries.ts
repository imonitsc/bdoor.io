import 'server-only';

import { createClient } from '@/lib/supabase/server';

export type QueueCounts = {
  newLeads: number;
  kycDecisions: number;
  quotesToPrepare: number;
  customerOverdue: number;
  partnerOverdue: number;
  authorityQueries: number;
  paymentsToReconcile: number;
  complianceDue: number;
  failedJobs: number;
};

/**
 * The operations queues.
 *
 * Every count is a head-only query so the dashboard stays cheap, and each one
 * is scoped by RLS — a finance user's "quotes to prepare" is whatever finance
 * is allowed to see, not a number that leaks the existence of other work.
 */
export async function getQueueCounts(): Promise<QueueCounts> {
  const supabase = await createClient();
  const in30Days = new Date(Date.now() + 30 * 86_400_000).toISOString().slice(0, 10);
  const today = new Date().toISOString().slice(0, 10);

  const [leads, kyc, quotes, customerOverdue, partnerOverdue, queries, payments, compliance, jobs] =
    await Promise.all([
      supabase.from('leads').select('id', { count: 'exact', head: true }).eq('status', 'new'),
      supabase
        .from('kyc_cases')
        .select('id', { count: 'exact', head: true })
        .in('overall_status', ['pending', 'manual_review']),
      supabase
        .from('quotes')
        .select('id', { count: 'exact', head: true })
        .in('status', ['draft', 'internal_review']),
      supabase
        .from('document_requests')
        .select('id', { count: 'exact', head: true })
        .in('status', ['requested', 'replacement_requested'])
        .lt('due_on', today),
      supabase
        .from('tasks')
        .select('id', { count: 'exact', head: true })
        .eq('owner_kind', 'partner')
        .in('status', ['open', 'in_progress'])
        .lt('due_on', today),
      supabase
        .from('authority_queries')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'open'),
      supabase
        .from('payments')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'paid')
        .is('reconciled_at', null),
      supabase
        .from('compliance_obligations')
        .select('id', { count: 'exact', head: true })
        .in('status', ['upcoming', 'due', 'overdue'])
        .lte('due_on', in30Days),
      supabase
        .from('integration_events')
        .select('id', { count: 'exact', head: true })
        .in('status', ['failed', 'dead_letter']),
    ]);

  return {
    newLeads: leads.count ?? 0,
    kycDecisions: kyc.count ?? 0,
    quotesToPrepare: quotes.count ?? 0,
    customerOverdue: customerOverdue.count ?? 0,
    partnerOverdue: partnerOverdue.count ?? 0,
    authorityQueries: queries.count ?? 0,
    paymentsToReconcile: payments.count ?? 0,
    complianceDue: compliance.count ?? 0,
    failedJobs: jobs.count ?? 0,
  };
}
