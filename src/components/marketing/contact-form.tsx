'use client';

import { useActionState, useEffect, useId, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { Send } from 'lucide-react';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/choice';
import { Field, FieldControl, FieldLabel } from '@/components/ui/field';
import { Input, NativeSelect, Textarea } from '@/components/ui/input';
import { useAnnounce } from '@/components/ui/announcer';
import { submitContactRequest, type ContactState } from '@/features/contact/actions';
import { CONTACT_TOPICS } from '@/features/contact/schema';

const INITIAL: ContactState = { status: 'idle' };

export function ContactForm({ defaultTopic }: { defaultTopic?: string }) {
  const t = useTranslations('contact');
  const tCommon = useTranslations('common');
  const tErrors = useTranslations('contact.errors');
  const announce = useAnnounce();
  const [state, action, pending] = useActionState(submitContactRequest, INITIAL);
  const consentId = useId();
  const headingRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    if (state.status === 'success') {
      announce(t('successBody'));
      headingRef.current?.focus();
    } else if (state.status === 'error') {
      announce(tErrors('generic'), true);
    }
  }, [state, announce, t, tErrors]);

  if (state.status === 'success') {
    return (
      <Alert tone="success" title={t('successTitle')} live="polite">
        <p ref={headingRef} tabIndex={-1}>
          {t('successBody')}
        </p>
      </Alert>
    );
  }

  const error = (field: string) =>
    state.fieldErrors?.[field] ? tErrors(state.fieldErrors[field]!) : undefined;

  return (
    <form action={action} className="flex flex-col gap-5" noValidate>
      {state.formError ? (
        <Alert tone="danger" live="assertive">
          {tErrors(state.formError)}
        </Alert>
      ) : null}

      <Field error={error('fullName')}>
        <FieldLabel required>{t('nameLabel')}</FieldLabel>
        <FieldControl hasDescription={false}>
          <Input name="fullName" autoComplete="name" required maxLength={120} />
        </FieldControl>
      </Field>

      <Field error={error('email')}>
        <FieldLabel required>{t('emailLabel')}</FieldLabel>
        <FieldControl hasDescription={false}>
          <Input name="email" type="email" autoComplete="email" required maxLength={254} />
        </FieldControl>
      </Field>

      <Field error={error('phone')}>
        <FieldLabel>{t('phoneLabel')}</FieldLabel>
        <FieldControl hasDescription={false}>
          <Input name="phone" type="tel" autoComplete="tel" inputMode="tel" maxLength={32} />
        </FieldControl>
      </Field>

      <Field error={error('topic')}>
        <FieldLabel required>{t('topicLabel')}</FieldLabel>
        <FieldControl hasDescription={false}>
          <NativeSelect name="topic" defaultValue={defaultTopic ?? 'general'} required>
            {CONTACT_TOPICS.map((topic) => (
              <option key={topic} value={topic}>
                {t(`topics.${topic}`)}
              </option>
            ))}
          </NativeSelect>
        </FieldControl>
      </Field>

      <Field error={error('message')}>
        <FieldLabel required>{t('messageLabel')}</FieldLabel>
        <FieldControl hasDescription={false}>
          <Textarea name="message" rows={6} required minLength={10} maxLength={5000} />
        </FieldControl>
      </Field>

      {/* Honeypot. Hidden from everyone, including screen readers. */}
      <div hidden aria-hidden="true">
        <label htmlFor="website">Website</label>
        <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <div className="flex items-start gap-3">
        <Checkbox id={consentId} name="consent" required />
        <label htmlFor={consentId} className="text-ink text-sm leading-relaxed">
          {t('consentLabel')}
        </label>
      </div>
      {state.fieldErrors?.consent ? (
        <p className="text-danger text-sm font-medium">{tErrors(state.fieldErrors.consent)}</p>
      ) : null}

      <Button type="submit" size="lg" disabled={pending} className="w-fit">
        {pending ? tCommon('saving') : t('submit')}
        <Send className="size-4" aria-hidden="true" />
      </Button>
    </form>
  );
}
