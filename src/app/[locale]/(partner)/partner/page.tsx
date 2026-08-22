import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Briefcase } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { PageHeading } from '@/components/dashboard/page-heading';
import { CaseCard } from '@/components/dashboard/case-card';
import { AssignmentResponse } from '@/components/dashboard/assignment-response';
import { StatCard } from '@/components/dashboard/stat-card';
import { requirePartnerOrganization } from '@/lib/auth/require-organization';
import { listCases } from '@/features/cases/queries';
import { createClient } from '@/lib/supabase/server';
import { IndependenceDisclosure } from '@/components/layout/disclosure';

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function PartnerDashboard({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const [{ active }, t, tNav, tAssignment] = await Promise.all([
    requirePartnerOrganization(),
    getTranslations('partnerWorkspace'),
    getTranslations('partnerWorkspace.nav'),
    getTranslations('partnerWorkspace.assignment'),
  ]);

  const supabase = await createClient();

  const [cases, offersResult, tasksResult] = await Promise.all([
    listCases(),
    supabase
      .from('case_partner_assignments')
      .select('id, case_id, scope_note, offered_at, cases(reference, title)')
      .eq('partner_org_id', active.organizationId)
      .eq('status', 'offered'),
    supabase
      .from('tasks')
      .select('id', { count: 'exact', head: true })
      .eq('assigned_org_id', active.organizationId)
      .in('status', ['open', 'in_progress']),
  ]);

  type OfferRow = {
    id: string;
    case_id: string;
    scope_note: string;
    offered_at: string;
    cases: { reference: string; title: string } | null;
  };
  const offers = (offersResult.data ?? []) as unknown as OfferRow[];

  return (
    <div className="flex flex-col gap-6">
      <PageHeading title={tNav('dashboard')} description={active.organizationName} />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label={tNav('cases')}
          value={cases.length}
          icon={<Briefcase className="size-4" />}
        />
        <StatCard
          label={tAssignment('pending')}
          value={offers.length}
          tone={offers.length ? 'warning' : 'neutral'}
        />
        <StatCard label={tNav('tasks')} value={tasksResult.count ?? 0} />
      </div>

      {offers.length > 0 ? (
        <section className="flex flex-col gap-4">
          <h2 className="text-ink text-lg font-semibold">{tAssignment('pending')}</h2>
          {offers.map((offer) => (
            <Card key={offer.id}>
              <CardHeader>
                <CardTitle as="h3">{offer.cases?.title ?? offer.case_id}</CardTitle>
                <CardDescription>
                  <span className="font-mono">{offer.cases?.reference}</span> — {offer.scope_note}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AssignmentResponse assignmentId={offer.id} />
              </CardContent>
            </Card>
          ))}
        </section>
      ) : null}

      <section>
        <h2 className="text-ink text-lg font-semibold">{tNav('cases')}</h2>
        {cases.length === 0 ? (
          <EmptyState className="mt-4" icon={<Briefcase className="size-5" />} title={t('empty')} />
        ) : (
          <ul className="mt-4 grid gap-4 lg:grid-cols-2">
            {cases.map((item) => (
              <li key={item.id}>
                <CaseCard item={item} basePath="/partner/cases" />
              </li>
            ))}
          </ul>
        )}
      </section>

      <IndependenceDisclosure />
    </div>
  );
}
