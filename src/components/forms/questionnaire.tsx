'use client';

import { useActionState, useEffect, useId, useMemo, useRef, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { ArrowLeft, ArrowRight, HelpCircle, Info, Save } from 'lucide-react';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { ChoiceCard } from '@/components/ui/choice';
import { Field, FieldControl, FieldDescription, FieldLabel } from '@/components/ui/field';
import { Input, NativeSelect, Textarea } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { useAnnounce } from '@/components/ui/announcer';
import {
  BUSINESS_CATEGORY_GROUPS,
  type BusinessCategory,
} from '@/features/intake/business-categories';
import { COUNTRIES } from '@/features/intake/countries';
import {
  applicableQuestions,
  answersImpliedByMarketScope,
  firstUnansweredIndex,
  pruneInapplicable,
  validateAnswer,
  visibleStep,
  type MarketScope,
  type PartialAnswers,
  type QuestionDefinition,
} from '@/features/intake/questions';
import { intakeAction, persistAnswerBackground, type IntakeState } from '@/features/intake/actions';
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

/**
 * The business-category picker.
 *
 * A search box over a grouped list rather than a dropdown: 141 options in a
 * `<select>` is unusable on a phone, and a combobox popover would hide the
 * groups that make a long list scannable. Filtering matches the group name as
 * well as the category, so "garment" surfaces the whole textiles group.
 *
 * The radios carry their own name and never submit; the selection lives in
 * React state and is posted by a hidden input. That way filtering the list
 * cannot drop the chosen option out of the DOM and lose the answer with it,
 * and the browser is never asked to validate a control it cannot focus.
 */
function CategoryPicker({
  questionKey,
  value,
  labelledBy,
}: {
  questionKey: string;
  value: unknown;
  labelledBy: string;
}) {
  const t = useTranslations('start.categoryPicker');
  const locale = useLocale() === 'bn' ? 'bn' : 'en';
  const [selected, setSelected] = useState(typeof value === 'string' ? value : '');
  const [query, setQuery] = useState('');
  const statusId = useId();

  const needle = query.trim().toLowerCase();
  const groups = useMemo(() => {
    if (!needle)
      return BUSINESS_CATEGORY_GROUPS.map((g) => ({ group: g, categories: g.categories }));
    return BUSINESS_CATEGORY_GROUPS.map((group) => {
      const groupMatches =
        group.en.toLowerCase().includes(needle) || group.bn.toLowerCase().includes(needle);
      const categories = groupMatches
        ? group.categories
        : group.categories.filter(
            (c: BusinessCategory) =>
              c.en.toLowerCase().includes(needle) || c.bn.toLowerCase().includes(needle),
          );
      return { group, categories };
    }).filter((entry) => entry.categories.length > 0);
  }, [needle]);

  const matchCount = groups.reduce((total, entry) => total + entry.categories.length, 0);

  return (
    <div role="group" aria-labelledby={labelledBy} className="mt-4">
      <input type="hidden" name="value" value={selected} />
      <label className="text-ink block text-sm font-medium" htmlFor={`${questionKey}-search`}>
        {t('searchLabel')}
      </label>
      <Input
        id={`${questionKey}-search`}
        type="search"
        autoComplete="off"
        className="mt-1.5"
        placeholder={t('searchPlaceholder')}
        value={query}
        aria-describedby={statusId}
        onChange={(event) => setQuery(event.target.value)}
      />
      <p id={statusId} role="status" className="text-muted mt-2 text-sm">
        {matchCount === 0 ? t('noMatches') : t('matchCount', { count: matchCount })}
      </p>

      <div className="border-border bg-surface mt-2 max-h-[26rem] overflow-y-auto rounded-[var(--radius-control)] border">
        {groups.map(({ group, categories }) => (
          <fieldset key={group.slug} className="border-border border-b last:border-b-0">
            <legend className="sr-only">{group[locale]}</legend>
            <p
              aria-hidden="true"
              className="text-muted bg-surface-sunken px-4 py-2 text-xs font-semibold tracking-[0.08em] uppercase"
            >
              {group[locale]}
            </p>
            <div className="flex flex-col">
              {categories.map((category) => (
                <label
                  key={category.slug}
                  htmlFor={`${questionKey}-${category.slug}`}
                  className="hover:bg-surface-sunken has-checked:bg-primary-soft flex min-h-11 cursor-pointer items-center gap-3 px-4 py-2.5 text-sm"
                >
                  <input
                    type="radio"
                    id={`${questionKey}-${category.slug}`}
                    name={`${questionKey}-choice`}
                    value={category.slug}
                    checked={selected === category.slug}
                    onChange={() => setSelected(category.slug)}
                    className="size-4 shrink-0 accent-[var(--color-primary)]"
                  />
                  <span className="text-ink">{category[locale]}</span>
                </label>
              ))}
            </div>
          </fieldset>
        ))}
      </div>
    </div>
  );
}

function QuestionInput({
  question,
  value,
  fieldError,
  marketScope,
}: {
  question: QuestionDefinition;
  value: unknown;
  fieldError?: string;
  marketScope?: PartialAnswers['market_scope'];
}) {
  const t = useTranslations('start.questions');
  const tCommon = useTranslations('common');
  const tValidation = useTranslations('start.validation');
  const key = question.key;
  const error = fieldError ? tValidation(fieldError) : undefined;

  const help = question.hasHelp ? t(`${key}.help`) : undefined;
  let choiceOptions = question.options ?? [];
  if (question.key === 'target_country' && marketScope === 'outside') {
    choiceOptions = choiceOptions.filter((option) => option !== 'bangladesh');
  }
  if (question.key === 'objective' && marketScope === 'bangladesh') {
    choiceOptions = choiceOptions.filter((option) => option === 'new' || option === 'existing');
  }

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
            <div className="mt-4 flex flex-col gap-2">
              {choiceOptions.map((option) => (
                <ChoiceCard
                  key={option}
                  htmlFor={`${key}-${option}`}
                  selected={value === option}
                  control={
                    <input
                      type="radio"
                      id={`${key}-${option}`}
                      name="value"
                      value={option}
                      defaultChecked={value === option}
                      required
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

    case 'category': {
      // Deliberately not <FieldLabel>: there is no single control to label —
      // the answer is a group of radios — so a <label for> would point at an
      // id nothing owns. A labelled group carries the same meaning correctly.
      const labelId = `${key}-label`;
      return (
        <Field error={error}>
          <p id={labelId} className="text-ink text-lg font-semibold">
            {t(`${key}.label`)}
            <span className="text-danger ms-1" aria-hidden="true">
              *
            </span>
          </p>
          {help ? <p className="text-muted mt-1.5 text-sm">{help}</p> : null}
          <CategoryPicker questionKey={key} value={value} labelledBy={labelId} />
        </Field>
      );
    }

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

  const [serverState, formAction, saving] = useActionState(intakeAction, initial);
  const [answers, setAnswers] = useState<PartialAnswers>(() => {
    if (typeof window === 'undefined') return initial.answers;
    try {
      const raw = window.localStorage.getItem('bdoor_intake_draft');
      if (!raw) return initial.answers;
      const parsed = JSON.parse(raw) as { answers?: PartialAnswers };
      return { ...initial.answers, ...(parsed.answers ?? {}) };
    } catch {
      return initial.answers;
    }
  });
  const [index, setIndex] = useState(() =>
    firstUnansweredIndex({
      ...initial.answers,
      ...(typeof window !== 'undefined'
        ? (() => {
            try {
              const raw = window.localStorage.getItem('bdoor_intake_draft');
              if (!raw) return {};
              return (JSON.parse(raw) as { answers?: PartialAnswers }).answers ?? {};
            } catch {
              return {};
            }
          })()
        : {}),
    }),
  );
  const [fieldError, setFieldError] = useState<string | undefined>();
  const [syncState, setSyncState] = useState<'idle' | 'saving' | 'saved' | 'local'>('idle');
  const headingRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const questions = useMemo(() => applicableQuestions(answers), [answers]);
  const safeIndex = Math.min(index, questions.length);
  const question = questions[safeIndex];
  const atReview = !question;
  const step = visibleStep(answers, safeIndex);
  const stepName = atReview ? t('review') : t(`steps.${step.labelKey}`);
  const stageLabel = t('stepLabel', {
    current: Math.min(step.current, step.total),
    total: step.total,
    name: stepName,
  });

  useEffect(() => {
    headingRef.current?.focus();
    if (question) announce(stageLabel);
  }, [safeIndex, question, stageLabel, announce]);

  useEffect(() => {
    if (fieldError) announce(tErrors('form'), true);
  }, [fieldError, announce, tErrors]);

  function persistLocal(next: PartialAnswers) {
    try {
      window.localStorage.setItem(
        'bdoor_intake_draft',
        JSON.stringify({ answers: next, savedAt: Date.now() }),
      );
    } catch {
      // Private mode / quota — non-fatal; in-memory state still advances.
    }
  }

  function onContinue(formData: FormData) {
    if (!question) return;
    // Native FormData can miss a radio in some label/nesting cases; fall back
    // to the checked control so Continue never stalls on an empty value.
    if (formData.get('value') === null && formRef.current) {
      const checked = formRef.current.querySelector<HTMLInputElement>(
        'input[name="value"]:checked',
      );
      if (checked) formData.set('value', checked.value);
    }
    const raw = formData.getAll('value');
    const kind = question.kind;
    let value: unknown;
    switch (kind) {
      case 'boolean':
        value = raw[0] === 'true';
        break;
      case 'consent':
        value = raw.includes('true');
        break;
      case 'number':
        value = raw[0] === '' || raw[0] === undefined ? Number.NaN : Number(raw[0]);
        break;
      case 'multi':
        value = raw.map(String);
        break;
      default:
        value = raw[0] === undefined ? '' : String(raw[0]);
    }

    const validation = validateAnswer(question.key, value);
    if (!validation.success) {
      setFieldError(validation.error);
      return;
    }

    let next: PartialAnswers = { ...answers, [question.key]: validation.data };
    if (question.key === 'market_scope') {
      next = { ...next, ...answersImpliedByMarketScope(validation.data as MarketScope) };
    }
    next = pruneInapplicable(next);
    setAnswers(next);
    setFieldError(undefined);
    setIndex(firstUnansweredIndex(next));
    persistLocal(next);

    // Do not await a Server Action on Continue/Back: Next.js refreshes the
    // surrounding RSC tree when the action settles, which remounts this
    // client component and wipes the just-advanced step. Persist locally
    // immediately; background-sync only after contact/email is known.
    if (next.email) {
      setSyncState('saving');
      void persistAnswerBackground(question.key, validation.data).then((result) => {
        setSyncState(result.ok ? 'saved' : 'local');
      });
    } else {
      setSyncState('local');
    }
  }

  function submitCurrent() {
    if (!formRef.current) return;
    onContinue(new FormData(formRef.current));
  }

  if (serverState.submitted) {
    return (
      <SubmittedPanel
        submitted={serverState.submitted}
        answers={serverState.answers}
        recommendation={serverState.recommendation}
      />
    );
  }

  const countryLabel = answers.target_country
    ? tQuestions(`target_country.options.${answers.target_country}`)
    : null;
  const packageSlug = initial.packageSlug;

  return (
    <div className="flex flex-col gap-6">
      {serverState.unavailable ? (
        <Alert tone="neutral" icon={<Info className="size-5" />}>
          {t('anonymousNotice')}
        </Alert>
      ) : null}

      {(countryLabel || packageSlug) && (
        <div className="border-border bg-surface-sunken text-ink flex flex-wrap items-center gap-3 rounded-[var(--radius-control)] border px-4 py-3 text-sm">
          {countryLabel ? <span>{t('contextCountry', { country: countryLabel })}</span> : null}
          {packageSlug ? <span>{t('contextPackage', { package: packageSlug })}</span> : null}
        </div>
      )}

      <div>
        <p className="text-muted text-sm font-medium">{stageLabel}</p>
        <Progress
          className="mt-2"
          value={atReview ? step.total : step.current - 1}
          max={step.total}
          label={stageLabel}
        />
      </div>

      <div ref={headingRef} tabIndex={-1} className="outline-none">
        {atReview ? (
          <ReviewStep
            answers={answers}
            questions={questions}
            formAction={formAction}
            pending={saving}
            onEdit={(i) => setIndex(i)}
          />
        ) : (
          <form
            key={question.key}
            ref={formRef}
            className="flex flex-col gap-6"
            noValidate
            data-question-key={question.key}
            onSubmit={(event) => {
              event.preventDefault();
              submitCurrent();
            }}
          >
            <input type="hidden" name="questionKey" value={question.key} readOnly />
            <QuestionInput
              question={question}
              value={answers[question.key]}
              fieldError={fieldError}
              marketScope={answers.market_scope}
            />

            {question.showWhy ? <WhyWeAsk text={tQuestions(`${question.key}.why`)} /> : null}

            {question.key === 'remit_capital' ? (
              <Alert tone="info">{tQuestions('remit_capital.note')}</Alert>
            ) : null}

            <div className="border-border flex flex-wrap items-center gap-3 border-t pt-5">
              <Button type="submit" size="lg">
                {tCommon('continue')}
                <ArrowRight className="size-4" aria-hidden="true" />
              </Button>
              {safeIndex > 0 ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="lg"
                  onClick={() => {
                    setFieldError(undefined);
                    setIndex(Math.max(0, safeIndex - 1));
                  }}
                >
                  <ArrowLeft className="size-4" aria-hidden="true" />
                  {tCommon('back')}
                </Button>
              ) : null}
              <span className="text-muted ms-auto inline-flex items-center gap-1.5 text-sm">
                <Save className="size-4" aria-hidden="true" />
                {answers.email
                  ? syncState === 'saving'
                    ? tCommon('saving')
                    : syncState === 'local'
                      ? t('savedLocally')
                      : t('saveAndExit')
                  : t('saveOnDevice')}
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
  onEdit,
}: {
  answers: PartialAnswers;
  questions: QuestionDefinition[];
  formAction: (formData: FormData) => void;
  pending: boolean;
  onEdit: (index: number) => void;
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
              <Button
                type="button"
                variant="link"
                size="inline"
                className="text-xs"
                onClick={() => onEdit(i)}
              >
                {tCommon('edit')}
                <span className="sr-only"> — {tQuestions(`${question.key}.label`)}</span>
              </Button>
            </dd>
          </div>
        ))}
      </dl>

      <form
        action={(formData) => {
          formData.set('intent', 'submit');
          formData.set('answers', JSON.stringify(answers));
          formAction(formData);
        }}
      >
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
