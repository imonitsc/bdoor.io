import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Card } from '@/components/ui/card';
import { PageHeading } from '@/components/dashboard/page-heading';
import { OrganizationForm } from '@/components/forms/organization-form';
import { IndependenceDisclosure } from '@/components/layout/disclosure';
import { customerMemberships, requireSession } from '@/lib/auth/session';

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function OnboardingPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  const session = await requireSession();
  if (customerMemberships(session).length > 0) redirect(`/${locale}/app`);

  const t = await getTranslations('onboarding');

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-6">
      <PageHeading title={t('title')} description={t('subtitle')} />
      <Card className="p-5 md:p-6">
        <OrganizationForm defaultName={session.fullName} />
      </Card>
      <IndependenceDisclosure />
    </div>
  );
}
