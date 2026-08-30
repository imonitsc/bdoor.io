import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { BDoorLogo } from '@/components/layout/logo';
import { LocaleSwitcher } from '@/components/layout/locale-switcher';
import { SkipLink } from '@/components/layout/skip-link';
import { MARKETING_ROUTES } from '@/lib/navigation';

/**
 * The focused application layout (production hotfix P1): logo, language,
 * the form, a help link and the two policies someone mid-application might
 * actually need. The full marketing footer — services, seven countries,
 * company links, ten legal pages — stays on the content pages where a
 * visitor is browsing, not underneath a form they are trying to finish.
 */
export default async function ApplyLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('applyLayout');
  const tLegal = await getTranslations('legal');

  return (
    <div className="flex min-h-dvh flex-col">
      <SkipLink />
      <header className="border-border bg-surface/95 sticky top-0 z-40 border-b backdrop-blur">
        <div className="container-page flex h-16 items-center justify-between gap-4">
          <Link
            href="/"
            aria-label="bdoor"
            className="rounded focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus)]"
          >
            <BDoorLogo />
          </Link>
          <LocaleSwitcher />
        </div>
      </header>
      <main id="main-content" className="flex-1">
        {children}
      </main>
      <footer className="border-border border-t">
        <div className="container-page flex flex-wrap items-center justify-between gap-x-6 gap-y-3 py-6 text-sm">
          <Link
            href={MARKETING_ROUTES.contact}
            className="text-primary hover:text-primary-hover rounded font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus)]"
          >
            {t('needHelp')}
          </Link>
          <div className="text-muted flex flex-wrap gap-x-5 gap-y-2">
            <Link href={MARKETING_ROUTES.terms} className="hover:text-ink rounded">
              {tLegal('terms')}
            </Link>
            <Link href={MARKETING_ROUTES.privacy} className="hover:text-ink rounded">
              {tLegal('privacy')}
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
