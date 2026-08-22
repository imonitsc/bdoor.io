import type { Metadata } from 'next';
import { getFormatter, getTranslations, setRequestLocale } from 'next-intl/server';
import { ShieldAlert } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { Alert } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { PageHeading } from '@/components/dashboard/page-heading';
import { ComplianceDecisionForm } from '@/components/dashboard/compliance-forms';
import { requireCapability } from '@/lib/auth/session';
import { createClient } from '@/lib/supabase/server';
import { screeningIsMock } from '@/lib/screening';
import { ADMIN_ROUTES } from '@/lib/navigation';
import type { Enums } from '@/types/database';

export const metadata: Metadata = { robots: { index: false, follow: false } };

const CHECK_TONE: Record<
  Enums<'kyc_check_status'>,
  'neutral' | 'info' | 'success' | 'warning' | 'danger'
> = {
  not_started: 'neutral',
  pending: 'info',
  passed: 'success',
  failed: 'danger',
  manual_review: 'warning',
  waived: 'neutral',
};

export default async function AdminKycPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  const [session, t, tCommon, format] = await Promise.all([
    requireCapability('kyc.read'),
    getTranslations('admin.kyc'),
    getTranslations('common'),
    getFormatter(),
  ]);

  const supabase = await createClient();
  const { data } = await supabase
    .from('kyc_cases')
    .select(
      'id, case_id, subject_label, subject_type, overall_status, risk_rating, opened_at, decided_at, kyc_checks(check_type, status, customer_note, performed_at), cases(reference, title)',
    )
    .order('opened_at', { ascending: false })
    .limit(50);

  type Row = {
    id: string;
    case_id: string;
    subject_label: string;
    subject_type: string;
    overall_status: Enums<'kyc_check_status'>;
    risk_rating: Enums<'risk_rating'> | null;
    opened_at: string;
    decided_at: string | null;
    kyc_checks: Array<{
      check_type: Enums<'kyc_check_type'>;
      status: Enums<'kyc_check_status'>;
      customer_note: string | null;
    }>;
    cases: { reference: string; title: string } | null;
  };

  const cases = (data ?? []) as unknown as Row[];
  const canDecide = session.capabilities.has('kyc.decide');

  return (
    <div className="flex flex-col gap-6">
      <PageHeading title={t('title')} />

      {screeningIsMock() ? <Alert tone="danger" title={t('mockProviderWarning')} /> : null}

      <Alert tone="restricted">{t('restrictedNotice')}</Alert>

      {cases.length === 0 ? (
        <EmptyState icon={<ShieldAlert className="size-5" />} title={tCommon('noResults')} />
      ) : (
        <ul className="flex flex-col gap-5">
          {cases.map((kyc) => (
            <li key={kyc.id}>
              <Card>
                <CardHeader>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <CardTitle as="h2">{kyc.subject_label}</CardTitle>
                      <CardDescription>
                        <Link
                          href={`${ADMIN_ROUTES.cases}/${kyc.case_id}`}
                          className="rounded font-mono underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus)]"
                        >
                          {kyc.cases?.reference}
                        </Link>
                        {kyc.cases ? ` — ${kyc.cases.title}` : ''}
                      </CardDescription>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge tone={CHECK_TONE[kyc.overall_status]}>{kyc.overall_status}</Badge>
                      {kyc.risk_rating ? (
                        <Badge
                          tone={
                            kyc.risk_rating === 'low'
                              ? 'success'
                              : kyc.risk_rating === 'medium'
                                ? 'warning'
                                : 'danger'
                          }
                        >
                          {t('riskRating')}: {kyc.risk_rating}
                        </Badge>
                      ) : null}
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="flex flex-col gap-5">
                  <ul className="grid gap-2 sm:grid-cols-2">
                    {kyc.kyc_checks.map((check) => (
                      <li
                        key={check.check_type}
                        className="border-border flex items-center justify-between gap-3 rounded-[var(--radius-control)] border px-3 py-2"
                      >
                        <span className="text-ink text-sm">
                          {t(
                            check.check_type === 'beneficial_owner'
                              ? 'beneficialOwner'
                              : check.check_type === 'source_of_funds'
                                ? 'sourceOfFunds'
                                : check.check_type === 'adverse_media'
                                  ? 'sanctions'
                                  : check.check_type,
                          )}
                        </span>
                        <Badge tone={CHECK_TONE[check.status]}>{check.status}</Badge>
                      </li>
                    ))}
                  </ul>

                  {kyc.decided_at ? (
                    <p className="text-muted text-sm">
                      {t('decisionBy', {
                        name: '—',
                        date: format.dateTime(new Date(kyc.decided_at), 'long'),
                      })}
                    </p>
                  ) : canDecide ? (
                    <ComplianceDecisionForm kycCaseId={kyc.id} caseId={kyc.case_id} />
                  ) : (
                    <Button variant="secondary" size="sm" disabled>
                      {t('decision')}
                    </Button>
                  )}
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
