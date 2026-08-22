'use client';

import { useActionState } from 'react';
import { useTranslations } from 'next-intl';
import { Building2 } from 'lucide-react';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Field, FieldControl, FieldDescription, FieldLabel } from '@/components/ui/field';
import { Input, NativeSelect } from '@/components/ui/input';
import { COUNTRIES } from '@/features/intake/countries';
import { createOrganization, type OrgState } from '@/features/organizations/actions';

const INITIAL: OrgState = { status: 'idle' };

export function OrganizationForm({ defaultName }: { defaultName?: string }) {
  const t = useTranslations('onboarding');
  const tCommon = useTranslations('common');
  const tErrors = useTranslations('organizations.errors');
  const [state, action, pending] = useActionState(createOrganization, INITIAL);

  const fieldError = (name: string) =>
    state.fieldErrors?.[name] ? tErrors(state.fieldErrors[name]!) : undefined;

  return (
    <form action={action} className="flex flex-col gap-5" noValidate>
      {state.status === 'error' && state.message ? (
        <Alert tone="danger" live="assertive">
          {tErrors(state.message)}
        </Alert>
      ) : null}

      <Field error={fieldError('name')}>
        <FieldLabel required>{t('orgNameLabel')}</FieldLabel>
        <FieldDescription>{t('orgNameHelp')}</FieldDescription>
        <FieldControl>
          <Input name="name" defaultValue={defaultName} required maxLength={200} autoFocus />
        </FieldControl>
      </Field>

      <Field error={fieldError('country')}>
        <FieldLabel required>{t('countryLabel')}</FieldLabel>
        <FieldControl hasDescription={false}>
          <NativeSelect name="country" defaultValue="BD" autoComplete="country" required>
            {COUNTRIES.map((country) => (
              <option key={country.code} value={country.code}>
                {country.name}
              </option>
            ))}
          </NativeSelect>
        </FieldControl>
      </Field>

      <Field error={fieldError('phone')}>
        <FieldLabel>{t('phoneLabel')}</FieldLabel>
        <FieldControl hasDescription={false}>
          <Input name="phone" type="tel" inputMode="tel" autoComplete="tel" maxLength={32} />
        </FieldControl>
      </Field>

      <Button type="submit" size="lg" disabled={pending} className="w-fit">
        {pending ? tCommon('saving') : t('createCta')}
        <Building2 className="size-4" aria-hidden="true" />
      </Button>
    </form>
  );
}
