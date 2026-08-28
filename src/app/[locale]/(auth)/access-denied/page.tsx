import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { ShieldAlert } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';
import { getSession } from '@/lib/auth/session';
import { APP_ROUTES, MARKETING_ROUTES } from '@/lib/navigation';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

/**
 * Explicit permission-denied page.
 *
 * Prefer this over letting AuthorizationError bubble into the generic error
 * boundary when a signed-in user hits a staff/partner route they cannot use.
 */
export default async function AccessDeniedPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const [t, session] = await Promise.all([getTranslations('accessDenied'), getSession()]);

  return (
    <div className="container-page flex min-h-[60vh] flex-col items-center justify-center gap-5 py-20 text-center">
      <span
        className="bg-danger-soft text-danger flex size-12 items-center justify-center rounded-full"
        aria-hidden="true"
      >
        <ShieldAlert className="size-6" />
      </span>
      <h1 className="text-ink text-3xl leading-tight md:text-4xl">{t('title')}</h1>
      <p className="text-muted max-w-md text-base leading-relaxed">{t('body')}</p>
      <div className="flex flex-col gap-3 sm:flex-row">
        {session ? (
          <Button asChild size="lg">
            <Link href={APP_ROUTES.dashboard}>{t('back')}</Link>
          </Button>
        ) : (
          <Button asChild size="lg">
            <Link href={MARKETING_ROUTES.login}>{t('signIn')}</Link>
          </Button>
        )}
        <Button asChild size="lg" variant="secondary">
          <Link href={MARKETING_ROUTES.home}>{t('home')}</Link>
        </Button>
      </div>
    </div>
  );
}
