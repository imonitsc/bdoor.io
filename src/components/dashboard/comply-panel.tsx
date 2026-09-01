'use client';

import { useActionState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { CheckCircle2 } from 'lucide-react';
import { Alert } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { startComplySubscription, type ComplyState } from '@/features/comply/actions';
import type { ComplySubscriptionState } from '@/features/comply/queries';
import type { ComplyPlan } from '@/features/comply/plans';
import { formatMinor, type Currency } from '@/features/quotes/money';

const INITIAL: ComplyState = { status: 'idle' };

/**
 * The organisation's Comply position on /app/compliance (ROADMAP P0).
 *
 * Three states, all truthful: an active subscription names its plan and
 * period; a pending one says the payment has not been confirmed yet; none
 * offers the published plans with a real subscribe action. The plan amounts
 * come from `subscription_plans` — the same approved figures /pricing shows —
 * and the subscription is only ever the bdoor professional fee.
 */
export function ComplyPanel({
  state,
  plans,
  canSubscribe,
  paymentsOpen,
}: {
  state: ComplySubscriptionState;
  plans: ComplyPlan[];
  /** The caller is a customer owner — only owners commit recurring billing. */
  canSubscribe: boolean;
  /** Launch gates: while payment collection is not approved, no charge CTA. */
  paymentsOpen: boolean;
}) {
  const t = useTranslations('workspace.comply');
  const locale = useLocale();
  const [formState, formAction, submitting] = useActionState(startComplySubscription, INITIAL);

  if (state.kind !== 'none') {
    const planName = locale === 'bn' ? state.planName.bn : state.planName.en;
    return (
      <Card>
        <CardHeader>
          <CardTitle as="h2">{t('title')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-3">
            <CheckCircle2
              className={state.kind === 'active' ? 'text-accent size-5' : 'text-muted size-5'}
              aria-hidden="true"
            />
            <p className="text-ink text-sm font-medium">
              {t(`status.${state.kind}`, { plan: planName })}
            </p>
            <Badge tone={state.kind === 'active' ? 'success' : 'neutral'}>
              {formatMinor(state.amountMinor, state.currency as Currency, locale)}
              {t(`per.${state.billingPeriod}`)}
            </Badge>
          </div>
          {state.kind === 'pending' ? (
            <p className="text-muted mt-3 text-sm leading-relaxed">{t('pendingNote')}</p>
          ) : null}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle as="h2">{t('title')}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted text-sm leading-relaxed">{t('pitch')}</p>

        {formState.status === 'error' ? (
          <Alert tone="danger" live="assertive" className="mt-4">
            {t(`errors.${formState.message ?? 'generic'}`)}
          </Alert>
        ) : null}

        <ul className="mt-5 grid gap-4 md:grid-cols-2">
          {plans.map((plan) => (
            <li key={plan.id} className="border-border flex flex-col rounded-lg border p-4">
              <h3 className="text-ink text-sm font-semibold">
                {locale === 'bn' ? plan.name.bn : plan.name.en}
              </h3>
              <p className="text-primary mt-1 text-base font-semibold">
                {formatMinor(plan.amountMinor, plan.currency as Currency, locale)}
                {t(`per.${plan.billingPeriod}`)}
              </p>
              <div className="flex-1" />
              {paymentsOpen && canSubscribe ? (
                <form action={formAction} className="mt-4">
                  <input type="hidden" name="planId" value={plan.id} />
                  <Button type="submit" className="w-full" disabled={submitting}>
                    {submitting ? t('subscribing') : t('subscribe')}
                  </Button>
                </form>
              ) : null}
            </li>
          ))}
        </ul>

        {!paymentsOpen ? (
          <p className="text-muted mt-4 text-sm leading-relaxed">{t('paymentsClosed')}</p>
        ) : !canSubscribe ? (
          <p className="text-muted mt-4 text-sm leading-relaxed">{t('ownerOnlyNote')}</p>
        ) : null}

        {/* The fee-layer line survives every surface: the subscription is the
            bdoor professional fee; filings itemise pass-through amounts. */}
        <p className="text-muted mt-4 text-xs leading-relaxed">{t('feeLayerNote')}</p>
      </CardContent>
    </Card>
  );
}
