'use client';

import { useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { ArrowLeft, ArrowRight, CheckCircle2, Info } from 'lucide-react';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import {
  APPLICATION_JURISDICTIONS,
  APPLICATION_STEPS,
  FIRM_CATEGORIES,
  STEP_SCHEMAS,
  type ApplicationDraftValues,
  type ApplicationStepKey,
} from '@/features/partners/application';
import {
  saveProviderApplicationStep,
  submitProviderApplication,
  type ProviderApplyState,
} from '@/features/partners/application-actions';

/**
 * The multi-step provider application (portals spec §7). Six steps, one Zod
 * schema per step shared with the Server Action, save-and-resume through the
 * httpOnly draft cookie. Deliberately a plain, dense business form — this is
 * an operational journey, not a marketing page.
 */

type FieldKind = 'text' | 'email' | 'date' | 'textarea' | 'category' | 'checkbox';

type FieldDef = { key: string; kind: FieldKind; required?: boolean };

const STEP_FIELDS: Record<Exclude<ApplicationStepKey, 'services' | 'declarations'>, FieldDef[]> = {
  firm: [
    { key: 'legal_name', kind: 'text', required: true },
    { key: 'trading_name', kind: 'text' },
    { key: 'registration_no', kind: 'text' },
    { key: 'established_on', kind: 'date' },
    { key: 'firm_category', kind: 'category', required: true },
    { key: 'registered_address', kind: 'textarea', required: true },
    { key: 'operating_address', kind: 'textarea' },
    { key: 'website', kind: 'text' },
    { key: 'official_email_domain', kind: 'text' },
    { key: 'contact_name', kind: 'text', required: true },
    { key: 'contact_email', kind: 'email', required: true },
    { key: 'contact_phone', kind: 'text' },
    { key: 'signatory_name', kind: 'text', required: true },
  ],
  ownership: [
    { key: 'owners_text', kind: 'textarea', required: true },
    { key: 'related_entities_note', kind: 'textarea' },
    { key: 'sanctions_declaration', kind: 'checkbox', required: true },
    { key: 'integrity_declaration', kind: 'checkbox', required: true },
  ],
  standing: [
    { key: 'regulator_name', kind: 'text', required: true },
    { key: 'licence_no', kind: 'text', required: true },
    { key: 'licence_expires_on', kind: 'date' },
    { key: 'disciplinary_declaration', kind: 'checkbox', required: true },
    { key: 'indemnity_insurer', kind: 'text' },
    { key: 'indemnity_expires_on', kind: 'date' },
  ],
  controls: [
    { key: 'conflict_process_note', kind: 'textarea', required: true },
    { key: 'complaint_process_note', kind: 'textarea', required: true },
    { key: 'security_note', kind: 'textarea' },
    { key: 'retention_note', kind: 'textarea' },
    { key: 'subcontractors_note', kind: 'textarea' },
    { key: 'continuity_note', kind: 'textarea' },
  ],
};

type StepValuesMap = Record<string, unknown>;

export function ProviderApplicationForm({ initial }: { initial: ProviderApplyState }) {
  const t = useTranslations('partnersApply');
  const tCommon = useTranslations('common');
  const [stepIndex, setStepIndex] = useState(0);
  const [values, setValues] = useState<ApplicationDraftValues>(initial.values ?? {});
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const step = APPLICATION_STEPS[stepIndex]!;
  const total = APPLICATION_STEPS.length;

  const alreadySubmitted =
    initial.status !== undefined &&
    initial.status !== 'draft' &&
    initial.status !== 'needs_information';

  if (submitted || alreadySubmitted) {
    const reference = submitted ?? initial.reference ?? '';
    return (
      <div className="flex flex-col gap-5" data-testid="provider-apply-received">
        <Alert tone="success" icon={<CheckCircle2 className="size-5" />} title={t('success.title')}>
          {t('success.body')}
        </Alert>
        {reference ? (
          <p className="text-ink text-lg font-semibold" data-testid="provider-apply-reference">
            {reference}
          </p>
        ) : null}
        <p className="text-muted text-sm leading-relaxed">{t('success.next')}</p>
      </div>
    );
  }

  const stepValues: StepValuesMap = { ...(values[step] as StepValuesMap | undefined) };

  function setField(key: string, value: unknown) {
    setValues((prev) => ({ ...prev, [step]: { ...(prev[step] as object), [key]: value } }));
    setFieldErrors((prev) => (prev[key] ? { ...prev, [key]: '' } : prev));
  }

  function validateLocally(): boolean {
    const parsed = STEP_SCHEMAS[step].safeParse(values[step] ?? {});
    if (parsed.success) return true;
    const errors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? '');
      if (key && !errors[key]) errors[key] = issue.message;
    }
    setFieldErrors(errors);
    return false;
  }

  function onContinue() {
    setFormError(null);
    if (!validateLocally()) return;

    startTransition(async () => {
      if (step === 'declarations') {
        const result = await submitProviderApplication();
        if (result.ok) {
          setSubmitted(result.reference);
        } else {
          setFormError(result.error);
        }
        return;
      }

      const result = await saveProviderApplicationStep(step, values[step] ?? {});
      if (result.ok) {
        setStepIndex((i) => Math.min(i + 1, total - 1));
        window.scrollTo({ top: 0 });
      } else if (result.error === 'validation' && result.fields) {
        setFieldErrors(result.fields);
      } else {
        setFormError(result.error);
      }
    });
  }

  function errorFor(key: string): string | null {
    const code = fieldErrors[key];
    return code ? t(`errors.${code}`) : null;
  }

  function renderField(def: FieldDef) {
    const id = `pa-${def.key}`;
    const error = errorFor(def.key);
    const label = (
      <label htmlFor={id} className="text-ink block text-sm font-medium">
        {t(`fields.${def.key}`)}
        {def.required ? null : (
          <span className="text-muted ms-1 font-normal">({tCommon('optional')})</span>
        )}
      </label>
    );

    if (def.kind === 'checkbox') {
      return (
        <div key={def.key}>
          <label className="flex items-start gap-3">
            <input
              id={id}
              type="checkbox"
              checked={stepValues[def.key] === true}
              onChange={(e) => setField(def.key, e.target.checked ? true : undefined)}
              className="accent-primary mt-1 size-4"
            />
            <span className="text-ink text-sm leading-relaxed">{t(`fields.${def.key}`)}</span>
          </label>
          {error ? <p className="text-danger mt-1 text-sm">{error}</p> : null}
        </div>
      );
    }

    if (def.kind === 'textarea') {
      return (
        <div key={def.key}>
          {label}
          <textarea
            id={id}
            rows={3}
            value={(stepValues[def.key] as string) ?? ''}
            onChange={(e) => setField(def.key, e.target.value || undefined)}
            className="border-border-strong bg-surface text-ink focus-visible:outline-primary mt-1.5 w-full rounded-[var(--radius-control)] border px-3 py-2 text-sm leading-relaxed focus-visible:outline-2"
          />
          {error ? <p className="text-danger mt-1 text-sm">{error}</p> : null}
        </div>
      );
    }

    if (def.kind === 'category') {
      return (
        <div key={def.key}>
          {label}
          <select
            id={id}
            value={(stepValues[def.key] as string) ?? ''}
            onChange={(e) => setField(def.key, e.target.value || undefined)}
            className="border-border-strong bg-surface text-ink mt-1.5 h-10 w-full rounded-[var(--radius-control)] border px-3 text-sm"
          >
            <option value="">{t('choosePlaceholder')}</option>
            {FIRM_CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {t(`categories.${category}`)}
              </option>
            ))}
          </select>
          {error ? <p className="text-danger mt-1 text-sm">{error}</p> : null}
        </div>
      );
    }

    return (
      <div key={def.key}>
        {label}
        <Input
          id={id}
          type={def.kind === 'email' ? 'email' : def.kind === 'date' ? 'date' : 'text'}
          value={(stepValues[def.key] as string) ?? ''}
          onChange={(e) => setField(def.key, e.target.value || undefined)}
          className="mt-1.5"
        />
        {error ? <p className="text-danger mt-1 text-sm">{error}</p> : null}
      </div>
    );
  }

  function renderMulti(key: 'requested_categories' | 'jurisdictions') {
    const options = key === 'requested_categories' ? FIRM_CATEGORIES : APPLICATION_JURISDICTIONS;
    const namespace = key === 'requested_categories' ? 'categories' : 'jurisdictions';
    const selected = new Set((stepValues[key] as string[] | undefined) ?? []);
    const error = errorFor(key);
    return (
      <fieldset key={key}>
        <legend className="text-ink text-sm font-medium">{t(`fields.${key}`)}</legend>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          {options.map((option) => (
            <label key={option} className="flex items-start gap-2.5">
              <input
                type="checkbox"
                checked={selected.has(option)}
                onChange={(e) => {
                  const next = new Set(selected);
                  if (e.target.checked) next.add(option);
                  else next.delete(option);
                  setField(key, next.size > 0 ? [...next] : undefined);
                }}
                className="accent-primary mt-0.5 size-4"
              />
              <span className="text-ink text-sm">{t(`${namespace}.${option}`)}</span>
            </label>
          ))}
        </div>
        {error ? <p className="text-danger mt-1 text-sm">{error}</p> : null}
      </fieldset>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {initial.status === 'needs_information' && initial.informationRequest ? (
        <Alert tone="warning" title={t('needsInformation.title')}>
          {initial.informationRequest}
        </Alert>
      ) : null}
      {!initial.storeAvailable ? (
        <Alert tone="neutral" icon={<Info className="size-5" />}>
          {t('notStoredNotice')}
        </Alert>
      ) : null}

      <div>
        <p className="text-muted text-sm font-medium">
          {t('stepLabel', {
            current: stepIndex + 1,
            total,
            name: t(`steps.${step}.title`),
          })}
        </p>
        <Progress className="mt-2" value={stepIndex} max={total} label={t(`steps.${step}.title`)} />
      </div>

      <form
        className="flex flex-col gap-5"
        noValidate
        data-step={step}
        onSubmit={(event) => {
          event.preventDefault();
          onContinue();
        }}
      >
        <p className="text-muted text-sm leading-relaxed">{t(`steps.${step}.intro`)}</p>

        {step === 'services' ? (
          <>
            {renderMulti('requested_categories')}
            {renderMulti('jurisdictions')}
            {(
              [
                { key: 'services_note', kind: 'textarea', required: true },
                { key: 'languages_text', kind: 'text' },
                { key: 'turnaround_note', kind: 'textarea' },
                { key: 'capacity_note', kind: 'textarea' },
                { key: 'fee_note', kind: 'textarea' },
              ] as FieldDef[]
            ).map(renderField)}
          </>
        ) : step === 'declarations' ? (
          <>
            {(
              [
                { key: 'accuracy_confirmed', kind: 'checkbox', required: true },
                { key: 'authority_confirmed', kind: 'checkbox', required: true },
                { key: 'terms_accepted', kind: 'checkbox', required: true },
              ] as FieldDef[]
            ).map(renderField)}
            <p className="text-muted text-xs leading-relaxed">{t('declarationsNote')}</p>
          </>
        ) : (
          STEP_FIELDS[step].map(renderField)
        )}

        {formError ? (
          <Alert tone="danger" title={t(`errors.${formError}`)}>
            {formError === 'closed' ? t('closed.body') : null}
          </Alert>
        ) : null}

        <div className="border-border flex flex-wrap items-center gap-3 border-t pt-5">
          <Button type="submit" size="lg" disabled={pending}>
            {step === 'declarations' ? t('submitCta') : tCommon('continue')}
            <ArrowRight className="size-4" aria-hidden="true" />
          </Button>
          {stepIndex > 0 ? (
            <Button
              type="button"
              variant="ghost"
              size="lg"
              disabled={pending}
              onClick={() => {
                setFieldErrors({});
                setFormError(null);
                setStepIndex((i) => Math.max(0, i - 1));
              }}
            >
              <ArrowLeft className="size-4" aria-hidden="true" />
              {tCommon('back')}
            </Button>
          ) : null}
          <span className="text-muted ms-auto text-sm">
            {pending ? tCommon('saving') : initial.storeAvailable ? t('savedNote') : null}
          </span>
        </div>
      </form>
    </div>
  );
}
