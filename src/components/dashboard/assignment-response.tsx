'use client';

import { useActionState, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Check, Flag, X } from 'lucide-react';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Field, FieldControl, FieldLabel } from '@/components/ui/field';
import { Textarea } from '@/components/ui/input';
import { respondToAssignment, type PartnerState } from '@/features/partners/actions';

const INITIAL: PartnerState = { status: 'idle' };

/**
 * Assignment offer response (portals spec §10/§12.2): the partner records an
 * explicit conflict-check outcome. A clean result unlocks acceptance; a
 * conflict declines without demanding an explanation that could itself leak
 * protected information; potential-conflict and insufficient-information
 * keep the offer open for bdoor review. A plain business decline still
 * requires a structured reason.
 */
export function AssignmentResponse({ assignmentId }: { assignmentId: string }) {
  const t = useTranslations('partnerWorkspace.assignment');
  const tErrors = useTranslations('partners.errors');
  const [state, action, pending] = useActionState(respondToAssignment, INITIAL);
  const [declining, setDeclining] = useState(false);
  const [outcome, setOutcome] = useState<string>('none_identified');

  if (state.status === 'success') {
    return (
      <Alert tone="success" live="polite">
        {tErrors(state.message ?? 'accepted')}
      </Alert>
    );
  }

  const OUTCOMES = [
    'none_identified',
    'potential_conflict',
    'conflict_declined',
    'insufficient_information',
  ] as const;

  return (
    <form action={action} className="flex flex-col gap-4">
      <input type="hidden" name="assignmentId" value={assignmentId} />

      {state.status === 'error' && state.message ? (
        <Alert tone="danger" live="assertive">
          {tErrors(state.message)}
        </Alert>
      ) : null}

      <p className="text-muted text-sm leading-relaxed">{t('scopeNote')}</p>

      {declining ? (
        <>
          <Field>
            <FieldLabel required>{t('declineReason')}</FieldLabel>
            <FieldControl hasDescription={false}>
              <Textarea name="reason" rows={3} required minLength={5} maxLength={1000} autoFocus />
            </FieldControl>
          </Field>
          <div className="flex flex-wrap gap-3">
            <Button
              type="submit"
              name="decision"
              value="decline"
              variant="danger"
              disabled={pending}
            >
              <X className="size-4" aria-hidden="true" />
              {t('decline')}
            </Button>
            <Button type="button" variant="ghost" onClick={() => setDeclining(false)}>
              {t('backToConflict')}
            </Button>
          </div>
        </>
      ) : (
        <>
          <fieldset>
            <legend className="text-ink text-sm font-medium">{t('conflictLegend')}</legend>
            <div className="mt-2 flex flex-col gap-2">
              {OUTCOMES.map((value) => (
                <label key={value} className="flex items-start gap-3 text-sm leading-relaxed">
                  <input
                    type="radio"
                    name="conflictResult"
                    value={value}
                    checked={outcome === value}
                    onChange={() => setOutcome(value)}
                    className="accent-primary mt-1 size-4"
                  />
                  <span className="text-ink">{t(`conflictOutcomes.${value}`)}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <div className="flex flex-wrap gap-3">
            {outcome === 'none_identified' ? (
              <Button type="submit" name="decision" value="accept" disabled={pending}>
                <Check className="size-4" aria-hidden="true" />
                {t('accept')}
              </Button>
            ) : outcome === 'conflict_declined' ? (
              <Button
                type="submit"
                name="decision"
                value="conflict"
                variant="danger"
                disabled={pending}
              >
                <X className="size-4" aria-hidden="true" />
                {t('declineConflict')}
              </Button>
            ) : (
              <Button type="submit" name="decision" value="flag" disabled={pending}>
                <Flag className="size-4" aria-hidden="true" />
                {t('recordForReview')}
              </Button>
            )}
            <Button type="button" variant="secondary" onClick={() => setDeclining(true)}>
              {t('declineOther')}
            </Button>
          </div>

          {outcome === 'potential_conflict' || outcome === 'insufficient_information' ? (
            <p className="text-muted text-sm leading-relaxed">{t('flagNote')}</p>
          ) : null}
        </>
      )}
    </form>
  );
}
