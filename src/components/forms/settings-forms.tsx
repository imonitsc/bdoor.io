'use client';

import { useActionState } from 'react';
import { useTranslations } from 'next-intl';
import { Save, Send } from 'lucide-react';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Field, FieldControl, FieldLabel } from '@/components/ui/field';
import { Input, NativeSelect, Textarea } from '@/components/ui/input';
import { submitDataRequest, updateProfile, type SettingsState } from '@/features/settings/actions';
import { localeLabels, locales } from '@/i18n/routing';

const INITIAL: SettingsState = { status: 'idle' };

export function ProfileForm({
  fullName,
  email,
  preferredLocale,
}: {
  fullName: string;
  email: string;
  preferredLocale: 'en' | 'bn';
}) {
  const tAuth = useTranslations('auth');
  const tCommon = useTranslations('common');
  const tErrors = useTranslations('settings.errors');
  const [state, action, pending] = useActionState(updateProfile, INITIAL);

  return (
    <form action={action} className="flex max-w-md flex-col gap-4">
      {state.status !== 'idle' && state.message ? (
        <Alert tone={state.status === 'success' ? 'success' : 'danger'} live="polite">
          {tErrors(state.message)}
        </Alert>
      ) : null}

      <Field>
        <FieldLabel required>{tAuth('fullName')}</FieldLabel>
        <FieldControl hasDescription={false}>
          <Input
            name="fullName"
            defaultValue={fullName}
            required
            maxLength={120}
            autoComplete="name"
          />
        </FieldControl>
      </Field>

      <Field>
        <FieldLabel>{tAuth('email')}</FieldLabel>
        <FieldControl hasDescription={false}>
          <Input value={email} readOnly disabled autoComplete="email" />
        </FieldControl>
      </Field>

      <Field>
        <FieldLabel>{tCommon('language')}</FieldLabel>
        <FieldControl hasDescription={false}>
          <NativeSelect name="preferredLocale" defaultValue={preferredLocale}>
            {locales.map((locale) => (
              <option key={locale} value={locale}>
                {localeLabels[locale].native}
              </option>
            ))}
          </NativeSelect>
        </FieldControl>
      </Field>

      <Button type="submit" disabled={pending} className="w-fit">
        {pending ? tCommon('saving') : tCommon('save')}
        <Save className="size-4" aria-hidden="true" />
      </Button>
    </form>
  );
}

export function DataRequestForm({ organizationId }: { organizationId: string }) {
  const t = useTranslations('workspace.settings');
  const tErrors = useTranslations('settings.errors');
  const [state, action, pending] = useActionState(submitDataRequest, INITIAL);

  return (
    <form action={action} className="flex max-w-md flex-col gap-4">
      <input type="hidden" name="organizationId" value={organizationId} />

      {state.status !== 'idle' && state.message ? (
        <Alert tone={state.status === 'success' ? 'success' : 'danger'} live="polite">
          {tErrors(state.message)}
        </Alert>
      ) : null}

      <Field>
        <FieldLabel required>{t('dataRequests')}</FieldLabel>
        <FieldControl hasDescription={false}>
          <NativeSelect name="requestType" defaultValue="export" required>
            <option value="export">{t('exportData')}</option>
            <option value="correction">{t('profile')}</option>
            <option value="deletion">{t('deleteData')}</option>
          </NativeSelect>
        </FieldControl>
      </Field>

      <Field>
        <FieldLabel>{t('dataRequests')}</FieldLabel>
        <FieldControl hasDescription={false}>
          <Textarea name="detail" rows={3} maxLength={2000} />
        </FieldControl>
      </Field>

      <Button type="submit" variant="secondary" disabled={pending} className="w-fit">
        {t('dataRequests')}
        <Send className="size-4" aria-hidden="true" />
      </Button>
    </form>
  );
}
