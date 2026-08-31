import { getTranslations, setRequestLocale } from 'next-intl/server';

import { LocaleSwitcher } from '@/components/layout/locale-switcher';
import { BDoorLogo } from '@/components/layout/logo';
import { SkipLink } from '@/components/layout/skip-link';
import { Button } from '@/components/ui/button';
import { Link } from '@/i18n/navigation';
import { MARKETING_ROUTES } from '@/lib/navigation';

/**
 * The AI application shell.
 *
 * /ask is an application, not a marketing page: the normal bdoor header in a
 * compact height, no marketing footer, no competing surfaces, and a
 * `h-dvh` column so the complete initial experience — prompt included — fits
 * the first viewport on every device. The conversation region is the only
 * thing that scrolls.
 */
export default async function AskLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('nav');

  return (
    <div className="bg-canvas flex h-dvh flex-col overflow-hidden">
      <SkipLink />
      <header className="border-border bg-surface z-10 shrink-0 border-b">
        <div className="container-page flex h-12 items-center justify-between gap-3">
          <Link href={MARKETING_ROUTES.home} aria-label="bdoor" className="shrink-0">
            <BDoorLogo />
          </Link>
          <div className="flex items-center gap-2">
            <Button asChild size="sm" variant="secondary" className="hidden sm:inline-flex">
              <Link href={MARKETING_ROUTES.start}>{t('startShort')}</Link>
            </Button>
            <LocaleSwitcher />
          </div>
        </div>
      </header>
      <main id="main-content" className="flex min-h-0 flex-1 flex-col">
        {children}
      </main>
    </div>
  );
}
