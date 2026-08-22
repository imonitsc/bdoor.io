import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Briefcase } from 'lucide-react';
import { EmptyState } from '@/components/ui/empty-state';
import { PageHeading } from '@/components/dashboard/page-heading';
import { CaseCard } from '@/components/dashboard/case-card';
import { requirePartnerOrganization } from '@/lib/auth/require-organization';
import { listCases } from '@/features/cases/queries';

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function PartnerCasesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  await requirePartnerOrganization();

  const [t, tNav, cases] = await Promise.all([
    getTranslations('partnerWorkspace'),
    getTranslations('partnerWorkspace.nav'),
    listCases({ includeClosed: true }),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeading title={tNav('cases')} description={t('assignment.scopeNote')} />
      {cases.length === 0 ? (
        <EmptyState icon={<Briefcase className="size-5" />} title={t('empty')} />
      ) : (
        <ul className="grid gap-4 lg:grid-cols-2">
          {cases.map((item) => (
            <li key={item.id}>
              <CaseCard item={item} basePath="/partner/cases" />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
