import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { FileText, Plus } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { PageHeading } from '@/components/dashboard/page-heading';
import { CaseCard } from '@/components/dashboard/case-card';
import { requireCustomerOrganization } from '@/lib/auth/require-organization';
import { listCases } from '@/features/cases/queries';
import { MARKETING_ROUTES } from '@/lib/navigation';

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function ApplicationsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ show?: string }>;
}) {
  const [{ locale }, { show }] = await Promise.all([params, searchParams]);
  setRequestLocale(locale);
  await requireCustomerOrganization();

  const includeClosed = show === 'all';
  const [t, tCommon, cases] = await Promise.all([
    getTranslations('workspace'),
    getTranslations('common'),
    listCases({ includeClosed }),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeading
        title={t('nav.applications')}
        actions={
          <>
            <Button asChild variant="secondary">
              <Link href={includeClosed ? '/app/applications' : '/app/applications?show=all'}>
                {includeClosed ? tCommon('filter') : tCommon('viewAll')}
              </Link>
            </Button>
            <Button asChild>
              <Link href={MARKETING_ROUTES.start}>
                <Plus className="size-4" aria-hidden="true" />
                {t('nav.startNew')}
              </Link>
            </Button>
          </>
        }
      />

      {cases.length === 0 ? (
        <EmptyState
          icon={<FileText className="size-5" />}
          title={t('dashboard.emptyApplications')}
          action={
            <Button asChild>
              <Link href={MARKETING_ROUTES.start}>{t('dashboard.startFirst')}</Link>
            </Button>
          }
        />
      ) : (
        <ul className="grid gap-4 lg:grid-cols-2">
          {cases.map((item) => (
            <li key={item.id}>
              <CaseCard item={item} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
