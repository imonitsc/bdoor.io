import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Link } from '@/i18n/navigation';
import { acceptStaffInvitation } from '@/features/admin/staff-invitations';
import { APP_ROUTES } from '@/lib/navigation';

// An invitation link is a credential. It must never be indexed, and it must
// never be rendered from a cache that another visitor could be served.
export const metadata: Metadata = { robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';

// Accepting on a GET is safe here only because acceptStaffInvitation() starts
// with requireSession() and then compares the signed-in address to the invited
// one. A link scanner or email-security proxy that follows the URL carries no
// session, so it cannot accept on the invitee's behalf. Nothing internal links
// to this route, so there is no prefetch either.

export default async function AcceptStaffInvitePage({
  params,
}: {
  params: Promise<{ locale: string; token: string }>;
}) {
  const { locale, token } = await params;
  setRequestLocale(locale);

  const [result, t] = await Promise.all([
    acceptStaffInvitation(token),
    getTranslations('organizations.staffInvitation'),
  ]);

  // Deliberately not redirecting on success, unlike the organisation flow. A
  // staff account cannot reach the workspace until it has a second factor, so
  // sending it to /admin would land on the enrolment redirect with no
  // explanation of why. Say what happened, then point at the one next step.
  if (result.ok) {
    return (
      <div className="flex flex-col gap-5">
        <h1 className="text-2xl font-semibold">{t('title')}</h1>
        <Alert tone="success" live="polite">
          {t('accepted')}
        </Alert>
        <p className="text-[var(--color-muted-foreground)]">{t('mfaNext')}</p>
        <Button asChild className="w-fit">
          <Link href={APP_ROUTES.security}>{t('setUpMfaCta')}</Link>
        </Button>
      </div>
    );
  }

  const reason =
    result.reason === 'expired'
      ? 'expired'
      : result.reason === 'wrong_email'
        ? 'wrongEmail'
        : result.reason === 'unconfirmed'
          ? 'unconfirmed'
          : result.reason === 'unavailable'
            ? 'unavailable'
            : 'invalid';

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-2xl font-semibold">{t('title')}</h1>
      <Alert tone="warning" live="polite">
        {t(reason)}
      </Alert>
      <Button asChild variant="secondary" className="w-fit">
        <Link href={APP_ROUTES.dashboard}>{t('backCta')}</Link>
      </Button>
    </div>
  );
}
