import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Link } from '@/i18n/navigation';
import { PageHeading } from '@/components/dashboard/page-heading';
import { acceptInvitation } from '@/features/organizations/actions';
import { APP_ROUTES } from '@/lib/navigation';

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function AcceptInvitationPage({
  params,
}: {
  params: Promise<{ locale: string; token: string }>;
}) {
  const { locale, token } = await params;
  setRequestLocale(locale);

  const [result, t] = await Promise.all([
    acceptInvitation(token),
    getTranslations('organizations.invitation'),
  ]);

  if (result.ok) redirect(`/${locale}/app/team?joined=1`);

  const tOnboarding = await getTranslations('onboarding');

  return (
    <div className="mx-auto flex max-w-md flex-col gap-5">
      <PageHeading title={tOnboarding('joinTitle')} />
      <Alert tone="warning" live="polite">
        {t(
          result.reason === 'expired'
            ? 'expired'
            : result.reason === 'wrong_email'
              ? 'wrongEmail'
              : result.reason === 'unavailable'
                ? 'unavailable'
                : 'invalid',
        )}
      </Alert>
      <Button asChild variant="secondary" className="w-fit">
        <Link href={APP_ROUTES.dashboard}>{tOnboarding('declineCta')}</Link>
      </Button>
    </div>
  );
}
