import type { Metadata } from 'next';
import { getFormatter, getTranslations, setRequestLocale } from 'next-intl/server';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeading } from '@/components/dashboard/page-heading';
import { IndependenceDisclosure } from '@/components/layout/disclosure';
import { requirePartnerOrganization } from '@/lib/auth/require-organization';
import { createClient } from '@/lib/supabase/server';

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function PartnerOrganizationPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const { active } = await requirePartnerOrganization();

  const [t, tCommon, format] = await Promise.all([
    getTranslations('partnerWorkspace.nav'),
    getTranslations('common'),
    getFormatter(),
  ]);

  const supabase = await createClient();
  // `payment_details` is deliberately not selected: it is finance-restricted.
  const { data: partner } = await supabase
    .from('partners')
    .select(
      'legal_name, practice_type, geographic_coverage, contact_name, contact_email, verification_status, conflict_policy_accepted_at, dpa_accepted_at, insurance_expires_on',
    )
    .eq('organization_id', active.organizationId)
    .maybeSingle();

  return (
    <div className="flex flex-col gap-6">
      <PageHeading title={t('organization')} description={active.organizationName} />

      <Card>
        <CardHeader>
          <CardTitle as="h2">{partner?.legal_name ?? active.organizationName}</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-muted text-xs font-semibold tracking-wide uppercase">
                {tCommon('status')}
              </dt>
              <dd className="mt-1">
                <Badge tone={partner?.verification_status === 'verified' ? 'success' : 'warning'}>
                  {partner?.verification_status ?? 'unverified'}
                </Badge>
              </dd>
            </div>
            <div>
              <dt className="text-muted text-xs font-semibold tracking-wide uppercase">
                {tCommon('status')}
              </dt>
              <dd className="text-ink mt-1 text-sm">{partner?.practice_type ?? '—'}</dd>
            </div>
            <div>
              <dt className="text-muted text-xs font-semibold tracking-wide uppercase">
                {tCommon('none')}
              </dt>
              <dd className="mt-1 flex flex-wrap gap-1.5">
                {(partner?.geographic_coverage ?? []).map((area) => (
                  <Badge key={area} tone="neutral">
                    {area}
                  </Badge>
                ))}
              </dd>
            </div>
            <div>
              <dt className="text-muted text-xs font-semibold tracking-wide uppercase">
                {tCommon('updated')}
              </dt>
              <dd className="text-ink mt-1 text-sm">
                {partner?.dpa_accepted_at
                  ? format.dateTime(new Date(partner.dpa_accepted_at), 'long')
                  : tCommon('notSet')}
              </dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      <IndependenceDisclosure />
    </div>
  );
}
