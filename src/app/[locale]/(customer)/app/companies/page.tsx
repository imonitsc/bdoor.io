import type { Metadata } from 'next';
import { getFormatter, getTranslations, setRequestLocale } from 'next-intl/server';
import { Building2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { PageHeading } from '@/components/dashboard/page-heading';
import { requireCustomerOrganization } from '@/lib/auth/require-organization';
import { serverEnv } from '@/lib/env';
import { createClient } from '@/lib/supabase/server';

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function CompaniesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  await requireCustomerOrganization();

  const [t, tCommon, format] = await Promise.all([
    getTranslations('workspace.nav'),
    getTranslations('common'),
    getFormatter(),
  ]);

  // bdoor ID display is flag-gated for staged rollout; the column itself
  // always exists and stays inside the table's tenancy either way.
  const showBdoorId = serverEnv().BDOOR_ID_ENABLED;
  const tBdoorId = await getTranslations('workspace.bdoorId');

  const supabase = await createClient();
  const { data } = await supabase
    .from('companies')
    .select(
      'id, bdoor_id, legal_name, trading_name, structure, status, registration_no, incorporation_date, company_people(id, full_name, role)',
    )
    .order('created_at', { ascending: false });

  type Row = {
    id: string;
    bdoor_id: string;
    legal_name: string;
    trading_name: string | null;
    structure: string;
    status: string;
    registration_no: string | null;
    incorporation_date: string | null;
    company_people: Array<{ id: string; full_name: string; role: string }>;
  };

  const companies = (data ?? []) as unknown as Row[];

  return (
    <div className="flex flex-col gap-6">
      <PageHeading title={t('companies')} />

      {showBdoorId && companies.length > 0 ? (
        // The §4.2 disclaimers travel with the identifier wherever it is
        // shown: private, not a government identifier, never a rating.
        <p className="text-muted text-sm">{tBdoorId('privacy')}</p>
      ) : null}

      {companies.length === 0 ? (
        <EmptyState icon={<Building2 className="size-5" />} title={tCommon('noResults')} />
      ) : (
        <ul className="grid gap-4 lg:grid-cols-2">
          {companies.map((company) => (
            <li key={company.id}>
              <Card as="article" className="p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="text-ink text-base font-semibold">{company.legal_name}</h2>
                    {company.trading_name ? (
                      <p className="text-muted text-sm">{company.trading_name}</p>
                    ) : null}
                  </div>
                  <Badge tone={company.status === 'incorporated' ? 'success' : 'neutral'}>
                    {company.status}
                  </Badge>
                </div>

                <dl className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm">
                  {showBdoorId ? (
                    <div>
                      <dt className="text-muted text-xs">{tBdoorId('label')}</dt>
                      <dd className="text-ink font-mono">{company.bdoor_id}</dd>
                    </div>
                  ) : null}
                  <div>
                    <dt className="text-muted text-xs">{tCommon('status')}</dt>
                    <dd className="text-ink">{company.structure.replace(/_/g, ' ')}</dd>
                  </div>
                  {company.registration_no ? (
                    <div>
                      <dt className="text-muted text-xs">{tCommon('created')}</dt>
                      <dd className="text-ink font-mono">{company.registration_no}</dd>
                    </div>
                  ) : null}
                  {company.incorporation_date ? (
                    <div>
                      <dt className="text-muted text-xs">{tCommon('created')}</dt>
                      <dd className="text-ink">
                        {format.dateTime(new Date(company.incorporation_date), 'short')}
                      </dd>
                    </div>
                  ) : null}
                </dl>

                {company.company_people.length > 0 ? (
                  <ul className="mt-4 flex flex-wrap gap-1.5">
                    {company.company_people.map((person) => (
                      <li key={person.id}>
                        <Badge tone="neutral">
                          {person.full_name} · {person.role.replace(/_/g, ' ')}
                        </Badge>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
