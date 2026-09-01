'use client';

import { useActionState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Building2 } from 'lucide-react';

import { trackCompany, type TrackCompanyState } from '@/features/compliance/actions';
import { COMPANY_STRUCTURES } from '@/features/compliance/track-schema';
import { STRUCTURE_LABELS, localized } from '@/features/intake/recommendation-copy';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Field, FieldControl, FieldDescription, FieldLabel } from '@/components/ui/field';
import { Input, NativeSelect } from '@/components/ui/input';

/**
 * The existing-entity Comply entry (ROADMAP P2): the company the customer
 * already runs, typed once — name, structure, incorporation date — and the
 * obligations calendar generates from published rules. Shown on
 * /app/compliance when the organisation has no company yet.
 */
export function TrackCompanyForm({ trackRuleId }: { trackRuleId?: string | null }) {
  const t = useTranslations('workspace.comply.track');
  const locale = useLocale();
  const initial: TrackCompanyState = { status: 'idle' };
  const [state, formAction, pending] = useActionState(trackCompany, initial);

  const errorText = (key: string | undefined) => {
    if (!key) return undefined;
    // Allow-listed error keys from the shared schema; anything else is the
    // generic line rather than a raw key in the page.
    const known = [
      'nameTooShort',
      'nameTooLong',
      'structureInvalid',
      'dateInvalid',
      'dateInFuture',
      'generic',
    ];
    return t(`errors.${known.includes(key) ? key : 'generic'}`);
  };

  return (
    <Card data-testid="track-company-form">
      <CardHeader>
        <CardTitle as="h2" className="flex items-center gap-2">
          <Building2 className="text-muted size-4" aria-hidden="true" />
          {t('title')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted mb-4 text-sm">{t('intro')}</p>
        <form action={formAction} className="flex max-w-xl flex-col gap-4">
          {trackRuleId ? <input type="hidden" name="trackRuleId" value={trackRuleId} /> : null}

          <Field error={state.status === 'error' ? errorText(state.message) : undefined}>
            <FieldLabel required>{t('legalName')}</FieldLabel>
            <FieldControl hasDescription={false}>
              <Input name="legalName" required minLength={2} maxLength={200} />
            </FieldControl>
          </Field>

          <Field>
            <FieldLabel required>{t('structure')}</FieldLabel>
            <FieldControl hasDescription={false}>
              <NativeSelect name="structure" required defaultValue="private_limited">
                {COMPANY_STRUCTURES.map((structure) => (
                  <option key={structure} value={structure}>
                    {localized(STRUCTURE_LABELS, structure, locale) ?? structure}
                  </option>
                ))}
              </NativeSelect>
            </FieldControl>
          </Field>

          <Field>
            <FieldLabel>{t('incorporationDate')}</FieldLabel>
            <FieldControl>
              <Input name="incorporationDate" type="date" />
            </FieldControl>
            <FieldDescription>{t('incorporationDateHint')}</FieldDescription>
          </Field>

          <div>
            <Button type="submit" disabled={pending}>
              {pending ? t('submitting') : t('submit')}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
