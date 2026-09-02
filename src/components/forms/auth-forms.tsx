'use client';

import { useActionState, useEffect, useId, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { LogIn, Mail, UserPlus } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/choice';
import { Field, FieldControl, FieldDescription, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { useAnnounce } from '@/components/ui/announcer';
import {
  requestMagicLink,
  requestPasswordReset,
  signIn,
  signUp,
  updatePassword,
  type AuthState,
} from '@/features/auth/actions';
import { MARKETING_ROUTES } from '@/lib/navigation';

const INITIAL: AuthState = { status: 'idle' };

function useAuthFeedback(state: AuthState) {
  const tErrors = useTranslations('auth.errors');
  const announce = useAnnounce();
  const errorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (state.status === 'error') {
      announce(tErrors(state.message ?? 'generic'), true);
      errorRef.current?.focus();
    }
  }, [state, announce, tErrors]);

  return { errorRef, tErrors };
}

function FormError({
  state,
  errorRef,
  tErrors,
}: {
  state: AuthState;
  errorRef: React.RefObject<HTMLDivElement | null>;
  tErrors: (key: string) => string;
}) {
  if (state.status !== 'error' || !state.message) return null;
  return (
    <div ref={errorRef} tabIndex={-1} className="outline-none">
      <Alert tone="danger" live="assertive">
        {tErrors(state.message)}
      </Alert>
    </div>
  );
}

export function SignInForm({ next }: { next?: string }) {
  const t = useTranslations('auth');
  const tCommon = useTranslations('common');
  const [state, action, pending] = useActionState(signIn, INITIAL);
  const { errorRef, tErrors } = useAuthFeedback(state);
  // The sign-in page now carries two forms with an email field each. Naming
  // both from their own heading is what keeps them distinguishable to a
  // screen reader moving by landmark, and to anything else that has to pick
  // one of them out.
  const titleId = useId();

  const fieldError = (name: string) =>
    state.fieldErrors?.[name] ? tErrors(state.fieldErrors[name]!) : undefined;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 id={titleId} className="text-ink text-2xl font-semibold">
          {t('signInTitle')}
        </h1>
        <p className="text-muted mt-1.5 text-sm">{t('signInSubtitle')}</p>
      </div>

      <form action={action} aria-labelledby={titleId} className="flex flex-col gap-4" noValidate>
        {next ? <input type="hidden" name="next" value={next} /> : null}
        <FormError state={state} errorRef={errorRef} tErrors={tErrors} />

        <Field error={fieldError('email')}>
          <FieldLabel required>{t('email')}</FieldLabel>
          <FieldControl hasDescription={false}>
            <Input name="email" type="email" autoComplete="email" required autoFocus />
          </FieldControl>
        </Field>

        <Field error={fieldError('password')}>
          <FieldLabel required>{t('password')}</FieldLabel>
          <FieldControl hasDescription={false}>
            <Input name="password" type="password" autoComplete="current-password" required />
          </FieldControl>
        </Field>

        <Button type="submit" size="lg" block disabled={pending}>
          {pending ? tCommon('loading') : t('signInCta')}
          <LogIn className="size-4" aria-hidden="true" />
        </Button>
      </form>

      <div className="flex flex-col gap-2 text-sm">
        <Link
          href="/forgot-password"
          className="text-primary rounded underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus)]"
        >
          {t('forgotPassword')}
        </Link>
        <p className="text-muted">
          {t('noAccount')}{' '}
          <Link
            href={MARKETING_ROUTES.signup}
            className="text-primary hover:text-primary-hover rounded underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus)]"
          >
            {t('signUpCta')}
          </Link>
        </p>
      </div>
    </div>
  );
}

/**
 * Magic-link sign-in, offered beneath the password form rather than instead of
 * it. It carries its own email field on purpose: the two forms post to
 * different actions, and a shared field would make the password form's
 * required-password validation fire when the caller only wanted a link.
 *
 * The success copy is the same whether or not the address has an account —
 * see `requestMagicLink` for why.
 */
export function MagicLinkForm({ next }: { next?: string }) {
  const t = useTranslations('auth');
  const tCommon = useTranslations('common');
  const [state, action, pending] = useActionState(requestMagicLink, INITIAL);
  const { errorRef, tErrors } = useAuthFeedback(state);
  const titleId = useId();

  if (state.status === 'success') {
    return (
      <Alert tone="info" live="polite">
        {t('magicLinkSent')}
      </Alert>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <span className="bg-border h-px flex-1" aria-hidden="true" />
        <span className="text-muted text-xs font-medium tracking-wide uppercase">
          {t('orContinueWith')}
        </span>
        <span className="bg-border h-px flex-1" aria-hidden="true" />
      </div>

      <div>
        <h2 id={titleId} className="text-ink text-base font-semibold">
          {t('magicLinkTitle')}
        </h2>
        <p className="text-muted mt-1 text-sm">{t('magicLinkSubtitle')}</p>
      </div>

      <form action={action} aria-labelledby={titleId} className="flex flex-col gap-4" noValidate>
        {next ? <input type="hidden" name="next" value={next} /> : null}
        <FormError state={state} errorRef={errorRef} tErrors={tErrors} />

        <Field error={state.fieldErrors?.email ? tErrors(state.fieldErrors.email) : undefined}>
          <FieldLabel required>{t('email')}</FieldLabel>
          <FieldControl hasDescription={false}>
            <Input name="email" type="email" autoComplete="email" required />
          </FieldControl>
        </Field>

        <Button type="submit" variant="secondary" size="lg" block disabled={pending}>
          {pending ? tCommon('loading') : t('magicLinkCta')}
          <Mail className="size-4" aria-hidden="true" />
        </Button>
      </form>

      <p className="text-muted text-sm">{t('magicLinkNoAccount')}</p>
    </div>
  );
}

export function SignUpForm() {
  const t = useTranslations('auth');
  const tCommon = useTranslations('common');
  const tLegal = useTranslations('legal');
  const [state, action, pending] = useActionState(signUp, INITIAL);
  const { errorRef, tErrors } = useAuthFeedback(state);
  const termsId = useId();

  const fieldError = (name: string) =>
    state.fieldErrors?.[name] ? tErrors(state.fieldErrors[name]!) : undefined;

  if (state.status === 'success') {
    return (
      <Alert tone="success" title={t('verifyTitle')} live="polite">
        {/* The address the caller just typed. It used to interpolate
            tCommon('email'), a UI label key that does not exist — so the screen
            read "we sent a link to common.email". */}
        <p>{t('verifyBody', { email: state.email ?? '' })}</p>
      </Alert>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-ink text-2xl font-semibold">{t('signUpTitle')}</h1>
        <p className="text-muted mt-1.5 text-sm">{t('signUpSubtitle')}</p>
      </div>

      <form action={action} className="flex flex-col gap-4" noValidate>
        <FormError state={state} errorRef={errorRef} tErrors={tErrors} />

        <Field error={fieldError('fullName')}>
          <FieldLabel required>{t('fullName')}</FieldLabel>
          <FieldControl hasDescription={false}>
            <Input name="fullName" autoComplete="name" required autoFocus maxLength={120} />
          </FieldControl>
        </Field>

        <Field error={fieldError('email')}>
          <FieldLabel required>{t('email')}</FieldLabel>
          <FieldControl hasDescription={false}>
            <Input name="email" type="email" autoComplete="email" required />
          </FieldControl>
        </Field>

        <Field error={fieldError('password')}>
          <FieldLabel required>{t('password')}</FieldLabel>
          <FieldDescription>{t('passwordHint')}</FieldDescription>
          <FieldControl>
            <Input
              name="password"
              type="password"
              autoComplete="new-password"
              required
              minLength={12}
            />
          </FieldControl>
        </Field>

        <Field error={fieldError('confirmPassword')}>
          <FieldLabel required>{t('confirmPassword')}</FieldLabel>
          <FieldControl hasDescription={false}>
            <Input name="confirmPassword" type="password" autoComplete="new-password" required />
          </FieldControl>
        </Field>

        <div className="flex items-start gap-3">
          <Checkbox id={termsId} name="acceptTerms" required />
          <label htmlFor={termsId} className="text-ink text-sm leading-relaxed">
            {t('termsNotice')}{' '}
            <Link
              href={MARKETING_ROUTES.terms}
              className="text-primary underline underline-offset-4"
            >
              {tLegal('terms')}
            </Link>
            {' · '}
            <Link
              href={MARKETING_ROUTES.privacy}
              className="text-primary underline underline-offset-4"
            >
              {tLegal('privacy')}
            </Link>
          </label>
        </div>
        {state.fieldErrors?.acceptTerms ? (
          <p className="text-danger text-sm font-medium">
            {tErrors(state.fieldErrors.acceptTerms)}
          </p>
        ) : null}

        <Button type="submit" size="lg" block disabled={pending}>
          {pending ? tCommon('loading') : t('signUpCta')}
          <UserPlus className="size-4" aria-hidden="true" />
        </Button>
      </form>

      <p className="text-muted text-sm">
        {t('haveAccount')}{' '}
        <Link
          href={MARKETING_ROUTES.login}
          className="text-primary hover:text-primary-hover rounded underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus)]"
        >
          {t('signInCta')}
        </Link>
      </p>
    </div>
  );
}

export function ForgotPasswordForm() {
  const t = useTranslations('auth');
  const tCommon = useTranslations('common');
  const [state, action, pending] = useActionState(requestPasswordReset, INITIAL);
  const { errorRef, tErrors } = useAuthFeedback(state);

  if (state.status === 'success') {
    return (
      <Alert tone="info" live="polite">
        {t('resetSent')}
      </Alert>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-ink text-2xl font-semibold">{t('resetTitle')}</h1>
        <p className="text-muted mt-1.5 text-sm">{t('resetSubtitle')}</p>
      </div>

      <form action={action} className="flex flex-col gap-4" noValidate>
        <FormError state={state} errorRef={errorRef} tErrors={tErrors} />
        <Field error={state.fieldErrors?.email ? tErrors(state.fieldErrors.email) : undefined}>
          <FieldLabel required>{t('email')}</FieldLabel>
          <FieldControl hasDescription={false}>
            <Input name="email" type="email" autoComplete="email" required autoFocus />
          </FieldControl>
        </Field>
        <Button type="submit" size="lg" block disabled={pending}>
          {pending ? tCommon('loading') : t('resetCta')}
          <Mail className="size-4" aria-hidden="true" />
        </Button>
      </form>

      <Link
        href={MARKETING_ROUTES.login}
        className="text-primary rounded text-sm underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus)]"
      >
        {t('signInCta')}
      </Link>
    </div>
  );
}

export function ResetPasswordForm() {
  const t = useTranslations('auth');
  const tCommon = useTranslations('common');
  const [state, action, pending] = useActionState(updatePassword, INITIAL);
  const { errorRef, tErrors } = useAuthFeedback(state);

  const fieldError = (name: string) =>
    state.fieldErrors?.[name] ? tErrors(state.fieldErrors[name]!) : undefined;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-ink text-2xl font-semibold">{t('updatePasswordTitle')}</h1>
      </div>

      <form action={action} className="flex flex-col gap-4" noValidate>
        <FormError state={state} errorRef={errorRef} tErrors={tErrors} />

        <Field error={fieldError('password')}>
          <FieldLabel required>{t('password')}</FieldLabel>
          <FieldDescription>{t('passwordHint')}</FieldDescription>
          <FieldControl>
            <Input
              name="password"
              type="password"
              autoComplete="new-password"
              required
              minLength={12}
              autoFocus
            />
          </FieldControl>
        </Field>

        <Field error={fieldError('confirmPassword')}>
          <FieldLabel required>{t('confirmPassword')}</FieldLabel>
          <FieldControl hasDescription={false}>
            <Input name="confirmPassword" type="password" autoComplete="new-password" required />
          </FieldControl>
        </Field>

        <Button type="submit" size="lg" block disabled={pending}>
          {pending ? tCommon('loading') : t('updatePasswordCta')}
        </Button>
      </form>
    </div>
  );
}
