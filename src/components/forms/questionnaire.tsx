'use client';

import { useActionState, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { ArrowLeft, ArrowRight, HelpCircle, Info, Save } from 'lucide-react';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { ChoiceCard, RadioGroup, RadioItem } from '@/components/ui/choice';
import { Field, FieldControl, FieldDescription, FieldLabel } from '@/components/ui/field';
import { Input, NativeSelect, Textarea } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { useAnnounce } from '@/components/ui/announcer';
import { COUNTRIES } from '@/features/intake/countries';
import {
  applicableQuestions,
  stageProgress,
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
        className="text-primary hover:text-primary-hover inline-flex items-center gap-1.5 rounded text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus)]"
      >
        <HelpCircle className="size-4" aria-hidden="true" />
        {t('whyWeAsk')}
      </button>
      {open ? (
        <p className="border-border bg-surface-sunken text-muted mt-2 rounded-[var(--radius-control)] border p-3 text-sm leading-relaxed">
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

  const help = question.hasHelp ? t(`${key}.help`) : undefined;

  switch (question.kind) {
    case 'boolean':
      return (
        <Field error={error}>
          <fieldset>
            <legend className="text-ink text-lg font-semibold">{t(`${key}.label`)}</legend>
            {help ? <p className="text-muted mt-1.5 text-sm">{help}</p> : null}
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
            <legend className="text-ink text-lg font-semibold">{t(`${key}.label`)}</legend>
            {help ? <p className="text-muted mt-1.5 text-sm">{help}</p> : null}
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
            <legend className="text-ink text-lg font-semibold">{t(`${key}.label`)}</legend>
            {help ? <p className="text-muted mt-1.5 text-sm">{help}</p> : null}
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

    case 'consent':
      return (
        <Field error={error}>
          <fieldset>
            <legend className="text-ink text-lg font-semibold">{t(`${key}.label`)}</legend>
            {help ? <p className="text-muted mt-1.5 text-sm">{help}</p> : null}
            <div className="mt-4">
              <ChoiceCard
                htmlFor={`${key}-true`}
                selected={value === true}
                control={
                  <input
                    type="checkbox"
                    id={`${key}-true`}
                    name="value"
                    value="true"
                    defaultChecked={value === true}
                    className="size-5 accent-[var(--color-primary)]"
                  />
                }
              >
                {t(`${key}.statement`)}
              </ChoiceCard>
            </div>
          </fieldset>
        </Field>
      );

    case 'email':
    case 'phone':
      return (
        <Field error={error}>
          <FieldLabel required={!question.optional} className="text-lg font-semibold">
            {t(`${key}.label`)}
          </FieldLabel>
          {help ? <FieldDescription>{help}</FieldDescription> : null}
          <FieldControl hasDescription={Boolean(help)}>
            <Input
              name="value"
              type={question.kind === 'email' ? 'email' : 'tel'}
              autoComplete={question.kind === 'email' ? 'email' : 'tel'}
              maxLength={question.kind === 'email' ? 254 : 32}
              defaultValue={typeof value === 'string' ? value : ''}
              required={!question.optional}
            />
          </FieldControl>
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
              minLength={question.optional ? undefined : 15}
              maxLength={1000}
              defaultValue={typeof value === 'string' ? value : ''}
              required={!question.optional}
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
              autoComplete={key === 'full_name' ? 'name' : undefined}
              defaultValue={typeof value === 'string' ? value : ''}
              required={!question.optional}
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
  const progress = stageProgress(state.answers, index);
  const stageName = atReview ? t('review') : t(`sections.${progress.stage}`);
  const stageLabel = t('stageLabel', {
    current: Math.min(progress.current, progress.total),
    total: progress.total,
    name: stageName,
  });

  // Move focus to the new question so keyboard and screen-reader users are not
  // left at the bottom of the previous step.
  useEffect(() => {
    headingRef.current?.focus();
    if (question) announce(stageLabel);
  }, [index, question, stageLabel, announce]);

  useEffect(() => {
    if (state.fieldError) announce(tErrors('form'), true);
  }, [state.fieldError, announce, tErrors]);

  if (state.submitted) {
    return (
      <SubmittedPanel
        submitted={state.submitted}
        answers={state.answers}
        recommendation={state.recommendation}
      />
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {state.unavailable ? (
        <Alert tone="neutral" icon={<Info className="size-5" />}>
          {t('anonymousNotice')}
        </Alert>
      ) : null}

      {/*
        Stage-based progress, deliberately not "question X of Y": conditional
        questions change the count as answers arrive, which made the label
        jump (Step 1 of 16 → Step 3 of 15) and look broken. The stage of a
        question never changes, so this only moves at real boundaries; the
        bar fills a whole stage at a time and reaches full at review.
      */}
      <div>
        <p className="text-muted text-sm font-medium">{stageLabel}</p>
        <Progress
          className="mt-2"
          value={atReview ? progress.total : progress.current - 1}
          max={progress.total}
          label={stageLabel}
        />
      </div>

      <div ref={headingRef} tabIndex={-1} className="outline-none">
        {atReview ? (
          <ReviewStep
            answers={state.answers}
            questions={questions}
            formAction={formAction}
            pending={saving}
          />
        ) : (
          <form action={formAction} className="flex flex-col gap-6" noValidate>
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

            <div className="border-border flex flex-wrap items-center gap-3 border-t pt-5">
              <Button type="submit" name="intent" value="answer" size="lg" disabled={saving}>
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
              <span className="text-muted ms-auto inline-flex items-center gap-1.5 text-sm">
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
        <h2 className="text-ink text-2xl font-semibold">{t('reviewTitle')}</h2>
        <p className="text-muted mt-2 text-sm leading-relaxed">{t('reviewBody')}</p>
      </div>

      <dl className="divide-border border-border divide-y border-y">
        {questions.map((question, i) => (
          <div key={question.key} className="flex flex-wrap items-baseline gap-x-4 gap-y-1 py-3.5">
            <dt className="text-muted min-w-56 flex-1 text-sm">
              {tQuestions(`${question.key}.label`)}
            </dt>
            <dd className="text-ink flex items-center gap-3 text-sm font-medium">
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
        <input type="hidden" name="intent" value="submit" />
        <Button type="submit" size="lg" disabled={pending}>
          {pending ? tCommon('loading') : t('submitCta')}
          <ArrowRight className="size-4" aria-hidden="true" />
        </Button>
      </form>
      <p className="text-muted text-xs leading-relaxed">{t('submitNote')}</p>
    </div>
  );
}

/**
 * The confirmation screen (§11.1): the reference the acknowledgement email
 * repeats, what happens next, and — for Bangladesh — the preliminary
 * recommendation beneath it, clearly subordinate to the confirmation.
 */
function SubmittedPanel({
  submitted,
  answers,
  recommendation,
}: {
  submitted: NonNullable<IntakeState['submitted']>;
  answers: PartialAnswers;
  recommendation: IntakeState['recommendation'];
}) {
  const t = useTranslations('start.submitted');
  const tQuestions = useTranslations('start.questions');

  const country = answers.target_country
    ? tQuestions(`target_country.options.${answers.target_country}`)
    : '';
  const objective = answers.objective ? tQuestions(`objective.options.${answers.objective}`) : '';

  return (
    <div className="flex flex-col gap-6">
      <div role="status">
        <h2 className="text-ink text-2xl font-semibold">{t('title')}</h2>
        <p className="text-muted mt-2 text-sm leading-relaxed">
          {t('body', { country, objective })}
        </p>
      </div>

      <div className="border-border bg-surface-sunken rounded-[var(--radius-card)] border p-5">
        <p className="text-muted text-xs font-medium tracking-wide uppercase">
          {t('referenceLabel')}
        </p>
        <p className="text-ink mt-1 font-mono text-2xl font-semibold">{submitted.reference}</p>
      </div>

      <ul className="flex flex-col gap-2">
        {(['ack', 'review', 'quote'] as const).map((step) => (
          <li key={step} className="text-ink flex items-start gap-2.5 text-sm leading-relaxed">
            <span className="bg-accent mt-2 size-1.5 shrink-0 rounded-full" aria-hidden="true" />
            {t(`steps.${step}`)}
          </li>
        ))}
      </ul>

      <p className="text-muted text-xs leading-relaxed">{t('noPayment')}</p>

      {recommendation ? (
        <div className="border-border border-t pt-6">
          <RecommendationPanel recommendation={recommendation} />
        </div>
      ) : null}
    </div>
  );
}
