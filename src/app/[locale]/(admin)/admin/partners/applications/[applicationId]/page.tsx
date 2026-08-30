import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getFormatter, getTranslations, setRequestLocale } from 'next-intl/server';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { PageHeading } from '@/components/dashboard/page-heading';
import { ProviderApplicationReview } from '@/components/dashboard/provider-application-review';
import { requireStaff } from '@/lib/auth/session';
import { createClient } from '@/lib/supabase/server';

export const metadata: Metadata = { robots: { index: false, follow: false } };

/** Field groups rendered straight from the row; empty values are elided. */
const SECTIONS: ReadonlyArray<{ titleKey: string; fields: readonly string[] }> = [
  {
    titleKey: 'firmSection',
    fields: [
      'legal_name',
      'trading_name',
      'registration_no',
      'established_on',
      'firm_category',
      'registered_address',
      'operating_address',
      'website',
      'official_email_domain',
      'contact_name',
      'contact_email',
      'contact_phone',
      'signatory_name',
    ],
  },
  {
    titleKey: 'ownershipSection',
    fields: ['owners', 'related_entities_note', 'sanctions_declaration', 'integrity_declaration'],
  },
  {
    titleKey: 'standingSection',
    fields: [
      'regulator_name',
      'licence_no',
      'licence_expires_on',
      'disciplinary_declaration',
      'indemnity_insurer',
      'indemnity_expires_on',
    ],
  },
  {
    titleKey: 'servicesSection',
    fields: [
      'requested_categories',
      'jurisdictions',
      'services_note',
      'languages',
      'turnaround_note',
      'capacity_note',
      'fee_note',
    ],
  },
  {
    titleKey: 'controlsSection',
    fields: [
      'conflict_process_note',
      'complaint_process_note',
      'security_note',
      'retention_note',
      'subcontractors_note',
      'continuity_note',
    ],
  },
];

function displayValue(value: unknown): string | null {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value === 'boolean') return value ? 'yes' : 'no';
  if (Array.isArray(value)) return value.length > 0 ? value.join(', ') : null;
  return String(value);
}

export default async function ProviderApplicationDetailPage({
  params,
}: {
  params: Promise<{ locale: string; applicationId: string }>;
}) {
  const { locale, applicationId } = await params;
  setRequestLocale(locale);
  await requireStaff();

  const [t, format] = await Promise.all([
    getTranslations('admin.providerApplications'),
    getFormatter(),
  ]);

  const supabase = await createClient();
  const { data: app } = await supabase
    .from('provider_applications')
    .select('*')
    .eq('id', applicationId)
    .neq('status', 'draft')
    .maybeSingle();
  if (!app) notFound();

  const row = app as unknown as Record<string, unknown>;

  return (
    <div className="flex flex-col gap-6">
      <PageHeading
        title={(app.legal_name || app.reference) as string}
        description={
          <span className="flex flex-wrap items-center gap-2">
            <span>{app.reference}</span>
            <Badge tone={app.status === 'approved' ? 'success' : 'warning'}>
              {String(app.status).replace(/_/g, ' ')}
            </Badge>
            {app.submitted_at ? (
              <span>
                {t('submittedColumn')}: {format.dateTime(new Date(app.submitted_at), 'long')}
              </span>
            ) : null}
          </span>
        }
      />

      {app.information_request ? (
        <Card className="p-5">
          <h2 className="text-ink text-sm font-semibold">{t('informationRequested')}</h2>
          <p className="text-muted mt-2 text-sm leading-relaxed">{app.information_request}</p>
        </Card>
      ) : null}
      {app.decision_reason ? (
        <Card className="p-5">
          <h2 className="text-ink text-sm font-semibold">{t('decisionReason')}</h2>
          <p className="text-muted mt-2 text-sm leading-relaxed">{app.decision_reason}</p>
        </Card>
      ) : null}

      <Card className="p-5 md:p-6">
        <h2 className="text-ink text-base font-semibold">{t('reviewActions')}</h2>
        <div className="mt-4">
          <ProviderApplicationReview applicationId={app.id} status={app.status} />
        </div>
      </Card>

      {SECTIONS.map((section) => {
        const entries = section.fields
          .map((field) => [field, displayValue(row[field])] as const)
          .filter(([, value]) => value !== null);
        if (entries.length === 0) return null;
        return (
          <Card key={section.titleKey} className="p-5 md:p-6">
            <h2 className="text-ink text-base font-semibold">{t(section.titleKey)}</h2>
            <dl className="mt-4 grid gap-x-8 gap-y-3 md:grid-cols-2">
              {entries.map(([field, value]) => (
                <div key={field} className="min-w-0">
                  <dt className="text-muted text-xs font-medium tracking-wide uppercase">
                    {field.replace(/_/g, ' ')}
                  </dt>
                  <dd className="text-ink mt-0.5 text-sm break-words whitespace-pre-wrap">
                    {value}
                  </dd>
                </div>
              ))}
            </dl>
          </Card>
        );
      })}
    </div>
  );
}
