import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Alert } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeading } from '@/components/dashboard/page-heading';
import { DataRequestForm, ProfileForm } from '@/components/forms/settings-forms';
import { requireCustomerOrganization } from '@/lib/auth/require-organization';

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function SettingsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  const [{ session, active }, t] = await Promise.all([
    requireCustomerOrganization(),
    getTranslations('workspace.settings'),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeading title={t('title')} />

      <Card>
        <CardHeader>
          <CardTitle as="h2">{t('profile')}</CardTitle>
        </CardHeader>
        <CardContent>
          <ProfileForm
            fullName={session.fullName}
            email={session.email ?? ''}
            preferredLocale={session.preferredLocale}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle as="h2">{t('organisation')}</CardTitle>
          <CardDescription>{active.organizationName}</CardDescription>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle as="h2">{t('dataRequests')}</CardTitle>
          <CardDescription>{t('retentionNote')}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Alert tone="neutral">{t('retentionNote')}</Alert>
          <DataRequestForm organizationId={active.organizationId} />
        </CardContent>
      </Card>
    </div>
  );
}
