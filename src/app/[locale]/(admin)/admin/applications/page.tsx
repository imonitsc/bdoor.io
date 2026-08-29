import type { Metadata } from 'next';
import { getFormatter, getTranslations, setRequestLocale } from 'next-intl/server';
import { Inbox } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { DataList, type DataListColumn } from '@/components/ui/data-list';
import { EmptyState } from '@/components/ui/empty-state';
import { NativeSelect } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { PageHeading } from '@/components/dashboard/page-heading';
import { requireCapability } from '@/lib/auth/session';
import { createClient } from '@/lib/supabase/server';
import { OBJECTIVES, TARGET_COUNTRIES, targetCountrySlug } from '@/features/intake/questions';

export const metadata: Metadata = { robots: { index: false, follow: false } };

/**
 * The operations queue (immediate-operations instructions §10): every
 * submitted application, filterable by country, objective and status, so
 * the specialist review the public SLA promises has one place to work
 * from. Reads go through the session-bound client — the staff-only RLS
 * policy on `public.applications` is the authorisation, `requireCapability`
 * merely keeps the page from rendering an empty shell to the wrong role.
 */

const STATUSES = ['new', 'in_review', 'quoted', 'engaged', 'closed'] as const;
const COUNTRY_SLUGS = TARGET_COUNTRIES.map(targetCountrySlug);

type ApplicationRow = {
  id: string;
  reference: string;
  country: string;
  objective: string;
  fullName: string;
  email: string;
  status: string;
  createdAt: string;
};

function pick(value: string | string[] | undefined, allowed: readonly string[]): string | null {
  const first = Array.isArray(value) ? value[0] : value;
  return first && allowed.includes(first) ? first : null;
}

export default async function AdminApplicationsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  await requireCapability('case.manage');

  const query = await searchParams;
  const country = pick(query.country, COUNTRY_SLUGS);
  const objective = pick(query.objective, OBJECTIVES);
  const status = pick(query.status, STATUSES);

  const [t, tQuestions, tCommon, format] = await Promise.all([
    getTranslations('admin.applications'),
    getTranslations('start.questions'),
    getTranslations('common'),
    getFormatter(),
  ]);

  const supabase = await createClient();
  let request = supabase
    .from('applications')
    .select('id, reference, country, objective, full_name, email, status, created_at')
    .order('created_at', { ascending: false })
    .limit(200);
  if (country) request = request.eq('country', country);
  if (objective) request = request.eq('objective', objective);
  if (status) request = request.eq('status', status);
  const { data } = await request;

  const rows: ApplicationRow[] = (data ?? []).map((row) => ({
    id: row.id,
    reference: row.reference,
    country: row.country,
    objective: row.objective,
    fullName: row.full_name,
    email: row.email,
    status: row.status,
    createdAt: row.created_at,
  }));

  const countryLabel = (slug: string) =>
    tQuestions(`target_country.options.${slug.replace(/-/g, '_')}`);

  const columns: ReadonlyArray<DataListColumn<ApplicationRow>> = [
    {
      key: 'reference',
      header: t('reference'),
      cell: (row) => <span className="font-mono text-xs">{row.reference}</span>,
    },
    {
      key: 'applicant',
      header: t('applicant'),
      cell: (row) => (
        <div className="min-w-0">
          <p className="text-ink truncate font-medium">{row.fullName}</p>
          <p className="text-muted truncate text-xs">{row.email}</p>
        </div>
      ),
    },
    { key: 'country', header: t('country'), cell: (row) => countryLabel(row.country) },
    {
      key: 'objective',
      header: t('objective'),
      cell: (row) => tQuestions(`objective.options.${row.objective}`),
    },
    {
      key: 'status',
      header: tCommon('status'),
      cell: (row) => (
        <Badge
          tone={row.status === 'new' ? 'warning' : row.status === 'closed' ? 'neutral' : 'info'}
        >
          {t(`statuses.${row.status}`)}
        </Badge>
      ),
    },
    {
      key: 'created',
      header: tCommon('created'),
      cell: (row) => format.dateTime(new Date(row.createdAt), 'short'),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <PageHeading title={t('title')} description={t('description')} />

      <form method="get" className="flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1.5">
          <span className="text-muted text-xs font-medium">{t('country')}</span>
          <NativeSelect name="country" defaultValue={country ?? ''} className="min-w-40">
            <option value="">{t('any')}</option>
            {COUNTRY_SLUGS.map((slug) => (
              <option key={slug} value={slug}>
                {countryLabel(slug)}
              </option>
            ))}
          </NativeSelect>
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-muted text-xs font-medium">{t('objective')}</span>
          <NativeSelect name="objective" defaultValue={objective ?? ''} className="min-w-40">
            <option value="">{t('any')}</option>
            {OBJECTIVES.map((value) => (
              <option key={value} value={value}>
                {tQuestions(`objective.options.${value}`)}
              </option>
            ))}
          </NativeSelect>
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-muted text-xs font-medium">{tCommon('status')}</span>
          <NativeSelect name="status" defaultValue={status ?? ''} className="min-w-40">
            <option value="">{t('any')}</option>
            {STATUSES.map((value) => (
              <option key={value} value={value}>
                {t(`statuses.${value}`)}
              </option>
            ))}
          </NativeSelect>
        </label>
        <Button type="submit" variant="secondary" size="sm">
          {t('filter')}
        </Button>
      </form>

      <DataList
        rows={rows}
        columns={columns}
        getRowKey={(row) => row.id}
        caption={t('title')}
        empty={<EmptyState icon={<Inbox className="size-5" />} title={tCommon('noResults')} />}
      />
    </div>
  );
}
