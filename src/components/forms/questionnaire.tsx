'use client';

import { useActionState, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { ArrowLeft, ArrowRight, HelpCircle, Info, Save } from 'lucide-react';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Checkbox, ChoiceCard, RadioGroup, RadioItem } from '@/components/ui/choice';
import { Field, FieldControl, FieldDescription, FieldLabel } from '@/components/ui/field';
import { Input, NativeSelect, Textarea } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { useAnnounce } from '@/components/ui/announcer';
import { COUNTRIES } from '@/features/intake/countries';
import {
  applicableQuestions,
  type PartialAnswers,
  type QuestionDefinition,
} from '@/features/intake/questions';
import { intakeAction, type IntakeState } from '@/features/intake/actions';
import { RecommendationPanel } from './recommendation-panel';

/** "Why we ask" disclosure. Collapsed by default so it never crowds the question. */
function WhyWeAsk({ text }: { text: string }) {
  const t = useTranslations('start');
  const [open, setOpen] = useState(false);

  return (
    <div className="mt-1">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="inline-flex items-center gap-1.5 rounded text-sm font-medium text-primary hover:text-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus)]"
      >
        <HelpCircle className="size-4" aria-hidden="true" />
        {t('whyWeAsk')}
      </button>
      {open ? (
        <p className="mt-2 rounded-[var(--radius-control)] border border-border bg-surface-sunken p-3 text-sm leading-relaxed text-muted">
          {text}
        </p>
      ) : null}
    </div>
  );
}

function QuestionInput({
  question,
  value,
  fieldError,
}: {
  question: QuestionDefinition;
  value: unknown;
  fieldError?: string;
}) {
  const t = useTranslations('start.questions');
  const tCommon = useTranslations('common');
  const tValidation = useTranslations('start.validation');
  const key = question.key;
  const error = fieldError ? tValidation(fieldError) : undefined;

  const help = (() => {
    try {
      return t(`${key}.help`);
    } catch {
      return undefined;
    }
  })();

  switch (question.kind) {
    case 'boolean':
      return (
        <Field error={error}>
          <fieldset>
            <legend className="text-lg font-semibold text-ink">{t(`${key}.label`)}</legend>
            {help ? <p className="mt-1.5 text-sm text-muted">{help}</p> : null}
            <div className="mt-4 flex flex-col gap-2">
              {[true, false].map((option) => (
                <ChoiceCard
                  key={String(option)}
                  htmlFor={`${key}-${option}`}
                  selected={value === option}
                  control={
                    <input
                      type="radio"
                      id={`${key}-${option}`}
                      name="value"
                      value={String(option)}
                      defaultChecked={value === option}
                      required
                      className="size-5 accent-[var(--color-primary)]"
                    />
                  }
                >
                  {option ? tCommon('yes') : tCommon('no')}
                </ChoiceCard>
              ))}
            </div>
          </fieldset>
        </Field>
      );

    case 'choice':
      return (
        <Field error={error}>
          <fieldset>
            <legend className="text-lg font-semibold text-ink">{t(`${key}.label`)}</legend>
            {help ? <p className="mt-1.5 text-sm text-muted">{help}</p> : null}
            <RadioGroup
              name="value"
              defaultValue={typeof value === 'string' ? value : undefined}
              required
              className="mt-4 flex flex-col gap-2"
            >
              {(question.options ?? []).map((option) => (
                <ChoiceCard
                  key={option}
                  htmlFor={`${key}-${option}`}
                  selected={value === option}
                  control={<RadioItem value={option} id={`${key}-${option}`} />}
                >
                  {t(`${key}.options.${option}`)}
                </ChoiceCard>
              ))}
            </RadioGroup>
          </fieldset>
        </Field>
      );

    case 'multi':
      return (
        <Field error={error}>
          <fieldset>
            <legend className="text-lg font-semibold text-ink">{t(`${key}.label`)}</legend>
            {help ? <p className="mt-1.5 text-sm text-muted">{help}</p> : null}
            <div className="mt-4 flex flex-col gap-2">
              {(question.options ?? []).map((option) => (
                <ChoiceCard
                  key={option}
                  htmlFor={`${key}-${option}`}
                  selected={Array.isArray(value) && value.includes(option)}
                  control={
                    <input
                      type="checkbox"
                      id={`${key}-${option}`}
                      name="value"
                      value={option}
                      defaultChecked={Array.isArray(value) && value.includes(option)}
                      className="size-5 accent-[var(--color-primary)]"
                    />
                  }
                >
                  {t(`${key}.options.${option}`)}
                </ChoiceCard>
              ))}
            </div>
          </fieldset>
        </Field>
      );

    case 'country':
      return (
        <Field error={error}>
          <FieldLabel required className="text-lg font-semibold">
            {t(`${key}.label`)}
          </FieldLabel>
          {help ? <FieldDescription>{help}</FieldDescription> : null}
          <FieldControl hasDescription={Boolean(help)}>
            <NativeSelect
              name="value"
              defaultValue={typeof value === 'string' ? value : 'BD'}
              autoComplete="country"
              required
            >
              {COUNTRIES.map((country) => (
                <option key={country.code} value={country.code}>
                  {country.name}
                </option>
              ))}
            </NativeSelect>
          </FieldControl>
        </Field>
      );

    case 'number':
      return (
        <Field error={error}>
          <FieldLabel required className="text-lg font-semibold">
            {t(`${key}.label`)}
          </FieldLabel>
          {help ? <FieldDescription>{help}</FieldDescription> : null}
          <FieldControl hasDescription={Boolean(help)}>
            <Input
              name="value"
              type="number"
              inputMode="numeric"
              min={key === 'foreign_ownership_percent' ? 0 : 1}
              max={key === 'foreign_ownership_percent' ? 100 : 200}
              step={1}
              defaultValue={typeof value === 'number' ? value : ''}
              required
              className="max-w-40"
            />
          </FieldControl>
        </Field>
      );

    case 'textarea':
      return (
        <Field error={error}>
          <FieldLabel required className="text-lg font-semibold">
            {t(`${key}.label`)}
          </FieldLabel>
          {help ? <FieldDescription>{help}</FieldDescription> : null}
          <FieldControl hasDescription={Boolean(help)}>
            <Textarea
              name="value"
              rows={4}
              minLength={15}
              maxLength={1000}
              defaultValue={typeof value === 'string' ? value : ''}
              required
            />
          </FieldControl>
        </Field>
      );

    default:
      return (
        <Field error={error}>
          <FieldLabel required className="text-lg font-semibold">
            {t(`${key}.label`)}
          </FieldLabel>
          {help ? <FieldDescription>{help}</FieldDescription> : null}
          <FieldControl hasDescription={Boolean(help)}>
            <Input
              name="value"
              maxLength={120}
              defaultValue={typeof value === 'string' ? value : ''}
              required
            />
          </FieldControl>
        </Field>
      );
  }
}

export function Questionnaire({ initial }: { initial: IntakeState }) {
  const t = useTranslations('start');
  const tCommon = useTranslations('common');
  const tQuestions = useTranslations('start.questions');
  const tErrors = useTranslations('contact.errors');
  const announce = useAnnounce();

  const [state, formAction, saving] = useActionState(intakeAction, initial);
  const headingRef = useRef<HTMLDivElement>(null);

  const questions = useMemo(() => applicableQuestions(state.answers), [state.answers]);
  const index = Math.min(state.index, questions.length);
  const question = questions[index];
  const atReview = !question;

  // Move focus to the new question so keyboard and screen-reader users are not
  // left at the bottom of the previous step.
  useEffect(() => {
    headingRef.current?.focus();
    if (question) {
      announce(t('progressLabel', { current: index + 1, total: questions.length }));
    }
  }, [index, question, questions.length, announce, t]);

  useEffect(() => {
    if (state.fieldError) announce(tErrors('form'), true);
  }, [state.fieldError, announce, tErrors]);

  if (state.recommendation) {
    return <RecommendationPanel recommendation={state.recommendation} />;
  }

  return (
    <div className="flex flex-col gap-6">
      {state.unavailable ? (
        <Alert tone="neutral" icon={<Info className="size-5" />}>
          {t('anonymousNotice')}
        </Alert>
      ) : null}

      <div>
        <div className="flex items-baseline justify-between gap-4">
          <p className="text-sm font-medium text-muted">
            {t('progressLabel', {
              current: Math.min(index + 1, questions.length),
              total: questions.length,
            })}
          </p>
          {question ? (
            <p className="text-xs uppercase tracking-wide text-muted">
              {t(`sections.${question.section}`)}
            </p>
          ) : null}
        </div>
        <Progress
          className="mt-2"
          value={atReview ? questions.length : index}
          max={questions.length}
          label={t('progressLabel', { current: index + 1, total: questions.length })}
        />
      </div>

      <div ref={headingRef} tabIndex={-1} className="outline-none">
        {atReview ? (
          <ReviewStep answers={state.answers} questions={questions} formAction={formAction} pending={saving} />
        ) : (
          <form action={formAction} className="flex flex-col gap-6" noValidate>
            <input type="hidden" name="intent" value="answer" />
            <input type="hidden" name="questionKey" value={question.key} />
            <input type="hidden" name="kind" value={question.kind} />

            <QuestionInput
              question={question}
              value={state.answers[question.key]}
              fieldError={state.fieldError}
            />

            {question.showWhy ? <WhyWeAsk text={tQuestions(`${question.key}.why`)} /> : null}

            {question.key === 'remit_capital' ? (
              <Alert tone="info">{tQuestions('remit_capital.note')}</Alert>
            ) : null}

            {state.error ? (
              <Alert tone="danger" live="assertive">
                {tErrors('generic')}
              </Alert>
            ) : null}

            <div className="flex flex-wrap items-center gap-3 border-t border-border pt-5">
              <Button type="submit" size="lg" disabled={saving}>
                {saving ? tCommon('saving') : tCommon('continue')}
                <ArrowRight className="size-4" aria-hidden="true" />
              </Button>
              {index > 0 ? (
                <Button
                  type="submit"
                  variant="ghost"
                  size="lg"
                  name="intent"
                  value="back"
                  formNoValidate
                  onClick={(event) => {
                    // Stepping back must not run the current step's validation,
                    // and must carry the target index rather than the answer.
                    const form = event.currentTarget.form;
                    if (!form) return;
                    const target = form.elements.namedItem('index');
                    if (target instanceof HTMLInputElement) target.value = String(index - 1);
                  }}
                >
                  <ArrowLeft className="size-4" aria-hidden="true" />
                  {tCommon('back')}
                </Button>
              ) : null}
              <input type="hidden" name="index" value={index - 1} />
              <span className="ms-auto inline-flex items-center gap-1.5 text-sm text-muted">
                <Save className="size-4" aria-hidden="true" />
                {t('saveAndExit')}
              </span>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

function ReviewStep({
  answers,
  questions,
  formAction,
  pending,
}: {
  answers: PartialAnswers;
  questions: QuestionDefinition[];
  formAction: (formData: FormData) => void;
  pending: boolean;
}) {
  const t = useTranslations('start');
  const tQuestions = useTranslations('start.questions');
  const tCommon = useTranslations('common');

  function display(question: QuestionDefinition): string {
    const value = answers[question.key];
    if (value === undefined || value === null || value === '') return tCommon('notSet');
    if (typeof value === 'boolean') return value ? tCommon('yes') : tCommon('no');
    if (Array.isArray(value)) {
      return value.length === 0
        ? tCommon('none')
        : value.map((v) => tQuestions(`${question.key}.options.${v}`)).join(', ');
    }
    if (question.kind === 'choice') return tQuestions(`${question.key}.options.${String(value)}`);
    return String(value);
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-2xl font-semibold text-ink">{t('reviewTitle')}</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted">{t('reviewBody')}</p>
      </div>

      <dl className="divide-y divide-border border-y border-border">
        {questions.map((question, i) => (
          <div key={question.key} className="flex flex-wrap items-baseline gap-x-4 gap-y-1 py-3.5">
            <dt className="min-w-56 flex-1 text-sm text-muted">
              {tQuestions(`${question.key}.label`)}
            </dt>
            <dd className="flex items-center gap-3 text-sm font-medium text-ink">
              <span>{display(question)}</span>
              <form action={formAction}>
                <input type="hidden" name="intent" value="back" />
                <input type="hidden" name="index" value={i} />
                <Button type="submit" variant="link" size="inline" className="text-xs">
                  {tCommon('edit')}
                  <span className="sr-only"> — {tQuestions(`${question.key}.label`)}</span>
                </Button>
              </form>
            </dd>
          </div>
        ))}
      </dl>

      <form action={formAction}>
        <input type="hidden" name="intent" value="generate" />
        <Button type="submit" size="lg" disabled={pending}>
          {pending ? tCommon('loading') : t('generateCta')}
          <ArrowRight className="size-4" aria-hidden="true" />
        </Button>
      </form>
    </div>
  );
}
