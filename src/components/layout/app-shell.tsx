'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Menu, X, type LucideIcon } from 'lucide-react';
import { Link, usePathname } from '@/i18n/navigation';
import { BDoorLogo } from './logo';
import { LocaleSwitcher } from './locale-switcher';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils/cn';

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  badge?: number;
};

/**
 * Protected application shell.
 *
 * Desktop gets a persistent sidebar; below `lg` the same navigation moves into
 * a full-height drawer with no items removed — the mobile experience is the
 * same product, not a reduced one.
 */
export function AppShell({
  items,
  areaLabel,
  headerActions,
  children,
}: {
  items: NavItem[];
  areaLabel: string;
  headerActions?: React.ReactNode;
  children: React.ReactNode;
}) {
  const t = useTranslations('common');
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  function isActive(href: string) {
    if (pathname === href) return true;
    // Avoid /app matching everything: only treat deeper paths as active.
    return href !== '/app' && href !== '/partner' && href !== '/admin' && pathname.startsWith(`${href}/`);
  }

  const nav = (
    <ul className="flex flex-col gap-0.5">
      {items.map((item) => {
        const Icon = item.icon;
        const active = isActive(item.href);
        return (
          <li key={item.href}>
            <Link
              href={item.href}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'flex min-h-11 items-center gap-3 rounded-[var(--radius-control)] px-3 text-sm font-medium transition-colors',
                'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus)]',
                active
                  ? 'bg-primary-soft text-info'
                  : 'text-ink hover:bg-surface-sunken',
              )}
            >
              <Icon className={cn('size-4 shrink-0', active ? 'text-primary' : 'text-muted')} aria-hidden="true" />
              <span className="flex-1 truncate">{item.label}</span>
              {item.badge && item.badge > 0 ? (
                <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-xs font-semibold text-on-primary">
                  {item.badge > 99 ? '99+' : item.badge}
                </span>
              ) : null}
            </Link>
          </li>
        );
      })}
    </ul>
  );

  return (
    <div className="min-h-dvh bg-canvas">
      <header className="sticky top-0 z-30 border-b border-border bg-surface">
        <div className="flex h-16 items-center gap-3 px-4 md:px-6">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            aria-expanded={open}
            aria-controls="app-navigation"
            aria-label={open ? t('closeMenu') : t('openMenu')}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
          </Button>

          <Link
            href="/"
            className="rounded focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--color-focus)]"
          >
            <BDoorLogo />
          </Link>

          <span className="hidden rounded-full bg-surface-sunken px-2.5 py-1 text-xs font-medium text-muted sm:inline">
            {areaLabel}
          </span>

          <div className="ms-auto flex items-center gap-2">
            <LocaleSwitcher />
            {headerActions}
          </div>
        </div>
      </header>

      <div className="lg:grid lg:grid-cols-[16rem_1fr]">
        <nav
          aria-label={areaLabel}
          className="sticky top-16 hidden h-[calc(100dvh-4rem)] overflow-y-auto border-e border-border bg-surface p-3 lg:block"
        >
          {nav}
        </nav>

        {open ? (
          <nav
            id="app-navigation"
            aria-label={areaLabel}
            className="fixed inset-x-0 bottom-0 top-16 z-30 overflow-y-auto border-t border-border bg-surface p-4 lg:hidden"
          >
            {nav}
          </nav>
        ) : null}

        <main id="main-content" className="min-w-0 px-4 py-6 md:px-6 md:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
