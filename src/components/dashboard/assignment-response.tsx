'use client';

import { useActionState, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Check, X } from 'lucide-react';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/choice';
import { Field, FieldControl, FieldLabel } from '@/components/ui/field';
import { Textarea } from '@/components/ui/input';
import { respondToAssignment, type PartnerState } from '@/features/partners/actions';

const INITIAL: PartnerState = { status: 'idle' };

export function AssignmentResponse({ assignmentId }: { assignmentId: string }) {
  const t = useTranslations('partnerWorkspace.assignment');
  const tErrors = useTranslations('partners.errors');
  const [state, action, pending] = useActionState(respondToAssignment, INITIAL);
  const [declining, setDeclining] = useState(false);

  if (state.status === 'success') {
    return (
      <Alert tone="success" live="polite">
        {tErrors(state.message ?? 'accepted')}
      </Alert>
    );
  }

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
              {t('accept')}
            </Button>
          </div>
        </>
      ) : (
        <>
          <label className="text-ink flex items-start gap-3 text-sm leading-relaxed">
            <Checkbox name="conflictCheck" required />
            <span>{t('conflictConfirm')}</span>
          </label>
          <div className="flex flex-wrap gap-3">
            <Button type="submit" name="decision" value="accept" disabled={pending}>
              <Check className="size-4" aria-hidden="true" />
              {t('accept')}
            </Button>
            <Button type="button" variant="secondary" onClick={() => setDeclining(true)}>
              {t('decline')}
            </Button>
          </div>
        </>
      )}
    </form>
  );
}
