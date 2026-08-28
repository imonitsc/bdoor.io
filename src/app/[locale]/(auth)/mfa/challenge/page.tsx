import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Button } from '@/components/ui/button';
import { Link } from '@/i18n/navigation';
import { MfaChallenge } from '@/components/forms/mfa-challenge';
import { getSession } from '@/lib/auth/session';
import { safeNextPath } from '@/lib/auth/safe-next';
import { createClient } from '@/lib/supabase/server';
import { APP_ROUTES } from '@/lib/navigation';

export const metadata: Metadata = { robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';

/**
 * Present an enrolled second factor.
 *
 * Without this page a staff account that had enrolled TOTP was stranded: on a
 * fresh session it is at aal1, the workspace requires aal2, and the security
 * page only offers *enrolment* — so the code input it needed existed nowhere.
 * `challengeMfa` had been written and never wired to anything.
 */
export default async function MfaChallengePage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ next?: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const query = await searchParams;

  const session = await getSession();
  if (!session) redirect(`/${locale}/login?next=/${locale}/mfa/challenge`);

  const next = safeNextPath(query.next, `/${locale}/app`);

  // Already at aal2 — nothing to prove. Going on to the destination is right;
  // rendering a code box for a satisfied session would just be confusing.
  if (session.mfaStep === 'satisfied') redirect(next);

  const t = await getTranslations('auth.mfa');

  // No verified factor to present. Enrolment is the step, not a challenge.
  const supabase = await createClient();
  const { data: factors } = await supabase.auth.mfa.listFactors();
  const hasVerifiedFactor = (factors?.totp ?? []).some((f) => f.status === 'verified');

  if (!hasVerifiedFactor) {
    return (
      <div className="flex flex-col gap-5">
        <h1 className="text-2xl font-semibold">{t('challengeTitle')}</h1>
        <p className="text-muted">{t('challengeNoFactor')}</p>
        <Button asChild className="w-fit">
          <Link href={APP_ROUTES.security}>{t('challengeEnrolCta')}</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-2xl font-semibold">{t('challengeTitle')}</h1>
      <p className="text-muted">{t('challengeSubtitle')}</p>
      <MfaChallenge next={next} />
    </div>
  );
}
