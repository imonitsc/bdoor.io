'use client';

import { useActionState } from 'react';
import { useTranslations } from 'next-intl';
import { Gavel, Lock } from 'lucide-react';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Field, FieldControl, FieldDescription, FieldLabel } from '@/components/ui/field';
import { NativeSelect, Textarea } from '@/components/ui/input';
import { addRestrictedNote, recordComplianceDecision, type KycState } from '@/features/kyc/actions';

const INITIAL: KycState = { status: 'idle' };

export function ComplianceDecisionForm({
  kycCaseId,
  caseId,
}: {
  kycCaseId: string;
  caseId: string;
}) {
  const t = useTranslations('admin.kyc');
  const tErrors = useTranslations('admin.errors');
  const [state, action, pending] = useActionState(recordComplianceDecision, INITIAL);

  return (
    <form action={action} className="border-border flex flex-col gap-4 border-t pt-5">
      <input type="hidden" name="kycCaseId" value={kycCaseId} />
      <input type="hidden" name="caseId" value={caseId} />

      {state.status !== 'idle' && state.message ? (
        <Alert tone={state.status === 'success' ? 'success' : 'danger'} live="polite">
          {tErrors(state.message)}
        </Alert>
      ) : null}

      <Field>
        <FieldLabel required>{t('decision')}</FieldLabel>
        <FieldControl hasDescription={false}>
          <NativeSelect name="decision" defaultValue="approved" required>
            <option value="approved">{t('approve')}</option>
            <option value="rejected">{t('reject')}</option>
            <option value="escalated">{t('escalate')}</option>
            <option value="more_information_required">{t('requestMore')}</option>
          </NativeSelect>
        </FieldControl>
      </Field>

      <Field>
        <FieldLabel required>{t('decisionReason')}</FieldLabel>
        <FieldDescription>{t('restrictedNotice')}</FieldDescription>
        <FieldControl>
          <Textarea name="reason" rows={3} required minLength={10} maxLength={2000} />
        </FieldControl>
      </Field>

      <Field>
        <FieldLabel>{t('requestMore')}</FieldLabel>
        <FieldControl hasDescription={false}>
          <Textarea name="customerNote" rows={2} maxLength={1000} />
        </FieldControl>
      </Field>

      <Button type="submit" disabled={pending} className="w-fit">
        <Gavel className="size-4" aria-hidden="true" />
        {t('decision')}
      </Button>
    </form>
  );
}

export function RestrictedNoteForm({ caseId }: { caseId: string }) {
  const t = useTranslations('admin.kyc');
  const tErrors = useTranslations('admin.errors');
  const [state, action, pending] = useActionState(addRestrictedNote, INITIAL);

  return (
    <form action={action} className="flex flex-col gap-4">
      <input type="hidden" name="caseId" value={caseId} />

      {state.status !== 'idle' && state.message ? (
        <Alert tone={state.status === 'success' ? 'success' : 'danger'} live="polite">
          {tErrors(state.message)}
        </Alert>
      ) : null}

      <Field>
        <FieldLabel required>{t('restrictedNotice')}</FieldLabel>
        <FieldControl hasDescription={false}>
          <NativeSelect name="classification" defaultValue="restricted" required>
            <option value="restricted">restricted</option>
            <option value="suspicious_activity">suspicious activity</option>
            <option value="reporting_decision">reporting decision</option>
            <option value="legal_privileged">legally privileged</option>
          </NativeSelect>
        </FieldControl>
      </Field>

      <Field>
        <FieldLabel required>{t('decisionReason')}</FieldLabel>
        <FieldControl hasDescription={false}>
          <Textarea name="body" rows={3} required minLength={5} maxLength={4000} />
        </FieldControl>
      </Field>

      <Button type="submit" variant="secondary" disabled={pending} className="w-fit">
        <Lock className="size-4" aria-hidden="true" />
        {t('title')}
      </Button>
    </form>
  );
}
