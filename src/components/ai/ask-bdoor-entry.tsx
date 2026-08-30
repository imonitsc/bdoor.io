'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { ArrowRight, Sparkles, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Link } from '@/i18n/navigation';
import { MARKETING_ROUTES } from '@/lib/navigation';
import { AskBdoorPanel } from './ask-bdoor-panel';

/**
 * The homepage entry point.
 *
 * A compact card with a real input, not a floating bubble and not a replacement
 * for the hero: the brief is explicit on both counts, and a section that
 * answers a question is worth more than a mascot that waves.
 *
 * Typing a question here opens the conversation with that question already
 * sent, so the first interaction costs one action rather than two.
 */
export function AskBdoorEntry({ locale }: { locale: 'en' | 'bn' }) {
  const t = useTranslations('ask');
  const [open, setOpen] = useState(false);
  const [question, setQuestion] = useState('');
  const [opening, setOpening] = useState<string | undefined>(undefined);

  const start = (value: string) => {
    const text = value.trim();
    setOpening(text || undefined);
    setOpen(true);
  };

  return (
    <div className="border-border bg-surface rounded-[var(--radius-panel)] border p-6 shadow-xs md:p-8">
      <p className="text-primary flex items-center gap-2 text-xs font-semibold tracking-wide uppercase">
        <Sparkles className="size-4" aria-hidden="true" />
        {t('eyebrow')}
      </p>
      <h2 className="text-ink mt-2 text-2xl font-semibold md:text-3xl">{t('heading')}</h2>
      <p className="text-muted mt-2 max-w-2xl text-sm leading-relaxed md:text-base">
        {t('description')}
      </p>

      <form
        className="mt-5 flex flex-col gap-2 sm:flex-row"
        onSubmit={(event) => {
          event.preventDefault();
          start(question);
        }}
      >
        <label htmlFor="ask-bdoor-entry" className="sr-only">
          {t('inputLabel')}
        </label>
        <input
          id="ask-bdoor-entry"
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          placeholder={t('placeholder')}
          maxLength={2000}
          autoComplete="off"
          className="border-border bg-surface text-ink placeholder:text-muted h-12 min-w-0 flex-1 rounded-[var(--radius-control)] border px-4 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus)]"
        />
        <Button type="submit" size="lg">
          {t('cta')}
          <ArrowRight className="size-5" aria-hidden="true" />
        </Button>
      </form>

      <ul className="mt-4 flex flex-wrap gap-2">
        {(['one', 'two', 'three'] as const).map((key) => (
          <li key={key}>
            <button
              type="button"
              onClick={() => start(t(`suggestions.${key}`))}
              className="border-border text-muted hover:border-primary hover:bg-primary-soft hover:text-ink rounded-full border px-3 py-1.5 text-xs transition-colors"
            >
              {t(`suggestions.${key}`)}
            </button>
          </li>
        ))}
      </ul>

      <p className="text-muted mt-4 text-xs">
        {t('entryFooter')}{' '}
        <Link
          href={MARKETING_ROUTES.ask}
          className="text-primary underline underline-offset-2"
          prefetch={false}
        >
          {t('openFullPage')}
        </Link>
      </p>

      <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
        <DialogPrimitive.Portal>
          <DialogPrimitive.Overlay className="data-[state=open]:animate-in data-[state=open]:fade-in fixed inset-0 z-50 bg-[color-mix(in_srgb,var(--bd-midnight)_55%,transparent)]" />
          {/*
            Full-screen on mobile, a side drawer from md up. One element with
            responsive positioning rather than two components, so focus
            management and the escape key behave identically at every width.
          */}
          <DialogPrimitive.Content
            className="bg-surface border-border fixed inset-0 z-50 flex flex-col border-s p-4 shadow-lg md:inset-y-0 md:start-auto md:end-0 md:w-[30rem] md:p-6"
            aria-describedby="ask-bdoor-drawer-description"
          >
            <div className="flex items-start justify-between gap-4 pb-3">
              <div>
                <DialogPrimitive.Title className="text-ink text-lg font-semibold">
                  {t('heading')}
                </DialogPrimitive.Title>
                <DialogPrimitive.Description
                  id="ask-bdoor-drawer-description"
                  className="text-muted mt-1 text-sm"
                >
                  {t('drawerDescription')}
                </DialogPrimitive.Description>
              </div>
              <DialogPrimitive.Close
                aria-label={t('close')}
                className="text-muted hover:bg-surface-sunken hover:text-ink inline-flex size-9 shrink-0 items-center justify-center rounded-[var(--radius-control)] transition-colors"
              >
                <X className="size-4" aria-hidden="true" />
              </DialogPrimitive.Close>
            </div>

            {open ? (
              <AskBdoorPanel locale={locale} initialQuestion={opening} autoFocus={!opening} />
            ) : null}
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>
    </div>
  );
}
