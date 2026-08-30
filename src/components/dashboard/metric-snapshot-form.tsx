'use client';

import { useActionState } from 'react';
import { useTranslations } from 'next-intl';
import { Camera } from 'lucide-react';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Field, FieldControl, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { recordMetricSnapshot, type SnapshotState } from '@/features/metrics/actions';

const INITIAL: SnapshotState = { status: 'idle' };

/** Records an append-only monthly snapshot; defaults to the previous month. */
export function MetricSnapshotForm({ defaultMonth }: { defaultMonth: string }) {
  const t = useTranslations('admin.metrics');
  const tErrors = useTranslations('admin.errors');
  const [state, action, pending] = useActionState(recordMetricSnapshot, INITIAL);

  return (
    <form action={action} className="flex flex-wrap items-end gap-2">
      {state.status === 'success' ? (
        <Alert tone="success" live="polite" className="w-full">
          {t('snapshotRecorded')}
        </Alert>
      ) : null}
      {state.status === 'error' ? (
        <Alert tone="danger" live="polite" className="w-full">
          {state.message === 'invalidMonth' ? t('invalidMonth') : tErrors('generic')}
        </Alert>
      ) : null}
      <Field>
        <FieldLabel required className="text-xs">
          {t('snapshotMonth')}
        </FieldLabel>
        <FieldControl hasDescription={false}>
          <Input type="month" name="month" required defaultValue={defaultMonth} className="w-44" />
        </FieldControl>
      </Field>
      <Field>
        <FieldLabel className="text-xs">{t('snapshotNote')}</FieldLabel>
        <FieldControl hasDescription={false}>
          <Input name="note" maxLength={500} className="w-64" />
        </FieldControl>
      </Field>
      <Button type="submit" size="sm" disabled={pending} className="h-11">
        <Camera className="size-4" aria-hidden="true" />
        {t('recordSnapshot')}
      </Button>
    </form>
  );
}
