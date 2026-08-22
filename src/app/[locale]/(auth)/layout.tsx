import { setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { BDoorLogo } from '@/components/layout/logo';
import { LocaleSwitcher } from '@/components/layout/locale-switcher';
import { IndependenceDisclosure } from '@/components/layout/disclosure';
import { SkipLink } from '@/components/layout/skip-link';
import { PortalVisual } from '@/components/marketing/portal-visual';
import { MARKETING_ROUTES } from '@/lib/navigation';

export default async function AuthLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div className="flex min-h-dvh flex-col lg:grid lg:grid-cols-[1fr_0.9fr]">
      <SkipLink />

      <div className="flex flex-1 flex-col">
        <header className="flex items-center justify-between gap-4 px-5 py-5 md:px-8">
          <Link
            href={MARKETING_ROUTES.home}
            className="rounded focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--color-focus)]"
          >
            <BDoorLogo />
          </Link>
          <LocaleSwitcher />
        </header>

        <main id="main-content" className="flex flex-1 items-center px-5 py-8 md:px-8">
          <div className="mx-auto w-full max-w-md">{children}</div>
        </main>

        <footer className="px-5 pb-8 md:px-8">
          <div className="mx-auto max-w-md">
            <IndependenceDisclosure variant="inline" />
          </div>
        </footer>
      </div>

      <aside className="relative hidden overflow-hidden bg-surface-inverse lg:flex lg:flex-col lg:justify-center lg:px-12">
        <PortalVisual className="pointer-events-none absolute -end-16 top-1/2 w-[28rem] -translate-y-1/2 opacity-70" />
        <div className="relative max-w-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[color:var(--bd-teal-500)]">
            BDoor
          </p>
          <p className="mt-4 text-2xl leading-snug text-ink-inverse">
            Company formation, licences, tax setup and compliance — in one secure workspace.
          </p>
        </div>
      </aside>
    </div>
  );
}
