'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Menu, X } from 'lucide-react';
import { Link, usePathname } from '@/i18n/navigation';
import { HEADER_LINKS, MARKETING_ROUTES } from '@/lib/navigation';
import { BDoorLogo } from './logo';
import { LocaleSwitcher } from './locale-switcher';
import { Button } from '@/components/ui/button';
import { useIsSignedIn } from '@/features/auth/use-is-signed-in';
import { cn } from '@/lib/utils/cn';

export function MarketingHeader() {
  const t = useTranslations();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [drawerPath, setDrawerPath] = useState(pathname);
  const isSignedIn = useIsSignedIn();

  // Close the drawer when the route changes. Adjusting state during render is
  // the pattern React recommends for "reset when an input changes"; doing it in
  // an effect would render the stale open drawer first and then close it.
  if (drawerPath !== pathname) {
    setDrawerPath(pathname);
    if (open) setOpen(false);
  }

  // Lock the body scroll while the drawer is open.
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <header className="border-border sticky top-0 z-40 border-b">
      {/*
        The frosted backdrop lives on its own layer rather than on <header>.
        `backdrop-filter` makes an element the containing block for its
        `position: fixed` descendants, which collapsed the mobile drawer below
        to the height of the header bar.
      */}
      <div aria-hidden="true" className="bg-surface/90 absolute inset-0 -z-10 backdrop-blur-sm" />
      <div className="container-page flex h-16 items-center justify-between gap-4 md:h-[4.5rem]">
        <Link
          href={MARKETING_ROUTES.home}
          className="rounded-[var(--radius-control)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--color-focus)]"
          aria-label={`${t('brand.name')} — ${t('brand.tagline')}`}
        >
          <BDoorLogo />
        </Link>

        <nav aria-label={t('nav.mainNavigation')} className="hidden lg:block">
          <ul className="flex items-center gap-1">
            {HEADER_LINKS.map((link) => {
              const active = pathname === link.href || pathname.startsWith(`${link.href}/`);
              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    aria-current={active ? 'page' : undefined}
                    className={cn(
                      'inline-flex h-11 items-center rounded-[var(--radius-control)] px-3 text-sm font-medium transition-colors',
                      'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus)]',
                      active ? 'bg-primary-soft text-info' : 'text-ink hover:bg-surface-sunken',
                    )}
                  >
                    {t(link.labelKey)}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="hidden items-center gap-2 lg:flex">
          <LocaleSwitcher />
          {isSignedIn ? (
            <Button asChild variant="secondary" size="md">
              <Link href="/app">{t('nav.workspace')}</Link>
            </Button>
          ) : (
            <Button asChild variant="ghost" size="md">
              <Link href={MARKETING_ROUTES.login}>{t('common.signIn')}</Link>
            </Button>
          )}
          <Button asChild size="md">
            <Link href={MARKETING_ROUTES.start}>{t('nav.primaryCta')}</Link>
          </Button>
        </div>

        <div className="flex items-center gap-1 lg:hidden">
          <Button asChild size="sm">
            <Link href={MARKETING_ROUTES.start}>{t('nav.primaryCta')}</Link>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-expanded={open}
            aria-controls="mobile-navigation"
            aria-label={open ? t('common.closeMenu') : t('common.openMenu')}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
          </Button>
        </div>
      </div>

      {open ? (
        <div
          id="mobile-navigation"
          className="border-border bg-surface fixed inset-x-0 top-16 bottom-0 z-40 overflow-y-auto border-t md:top-[4.5rem] lg:hidden"
        >
          <nav aria-label={t('nav.mainNavigation')} className="container-page py-6">
            <ul className="flex flex-col gap-1">
              {HEADER_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-ink hover:bg-surface-sunken flex min-h-[3rem] items-center rounded-[var(--radius-control)] px-3 text-base font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus)]"
                  >
                    {t(link.labelKey)}
                  </Link>
                </li>
              ))}
              <li className="border-border mt-2 border-t pt-3">
                <Link
                  href={isSignedIn ? '/app' : MARKETING_ROUTES.login}
                  className="text-ink hover:bg-surface-sunken flex min-h-[3rem] items-center rounded-[var(--radius-control)] px-3 text-base font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus)]"
                >
                  {isSignedIn ? t('nav.workspace') : t('common.signIn')}
                </Link>
              </li>
            </ul>
            <div className="border-border mt-4 border-t pt-4">
              <LocaleSwitcher />
            </div>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
