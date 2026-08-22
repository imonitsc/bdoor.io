'use client';

import { useActionState } from 'react';
import { useTranslations } from 'next-intl';
import { CheckCheck } from 'lucide-react';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Field, FieldControl, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { reconcilePayment, type FinanceState } from '@/features/admin/finance-actions';

const INITIAL: FinanceState = { status: 'idle' };

export function ReconcileForm({ paymentId }: { paymentId: string }) {
  const t = useTranslations('admin.finance');
  const tErrors = useTranslations('admin.errors');
  const [state, action, pending] = useActionState(reconcilePayment, INITIAL);

  if (state.status === 'success') {
    return (
      <Alert tone="success" live="polite">
        {tErrors('saved')}
      </Alert>
    );
  }

  return (
    <form action={action} className="flex flex-wrap items-end gap-2">
      <input type="hidden" name="paymentId" value={paymentId} />
      <Field error={state.status === 'error' && state.message ? tErrors(state.message) : undefined}>
        <FieldLabel required className="text-xs">
          {t('reconcileNote')}
        </FieldLabel>
        <FieldControl hasDescription={false}>
          <Input name="note" required minLength={5} maxLength={1000} className="w-64" />
        </FieldControl>
      </Field>
      <Button type="submit" size="sm" disabled={pending} className="h-11">
        <CheckCheck className="size-4" aria-hidden="true" />
        {t('reconcile')}
      </Button>
    </form>
  );
}
