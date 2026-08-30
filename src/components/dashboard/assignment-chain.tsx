'use client';

import { useActionState } from 'react';
import { useTranslations } from 'next-intl';
import { Alert } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { recordAssignmentDisclosure, type CaseActionState } from '@/features/admin/case-actions';

const INITIAL: CaseActionState = { status: 'idle' };

/**
 * The §10 sharing chain for one assignment, in order: partner conflict check
 * → customer disclosure → customer consent. Documents unlock only when all
 * three stand (enforced in RLS, shown here so staff can see what is missing).
 */
export function AssignmentChain({
  caseId,
  assignmentId,
  status,
  conflictResult,
  disclosedAt,
  authorized,
  canRecordDisclosure,
}: {
  caseId: string;
  assignmentId: string;
  status: string;
  conflictResult: string | null;
  disclosedAt: string | null;
  authorized: boolean;
  canRecordDisclosure: boolean;
}) {
  const t = useTranslations('admin.assignmentChain');
  const [state, action, pending] = useActionState(recordAssignmentDisclosure, INITIAL);

  const conflictClean = conflictResult === 'none_identified';

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        <Badge tone={conflictClean ? 'success' : conflictResult ? 'warning' : 'neutral'}>
          {t('conflict')}: {conflictResult ? t(`conflictValues.${conflictResult}`) : t('pending')}
        </Badge>
        <Badge tone={disclosedAt ? 'success' : 'neutral'}>
          {t('disclosure')}: {disclosedAt ? t('recorded') : t('pending')}
        </Badge>
        <Badge tone={authorized ? 'success' : 'neutral'}>
          {t('consent')}: {authorized ? t('recorded') : t('pending')}
        </Badge>
      </div>

      {state.status === 'error' ? <Alert tone="danger">{t('error')}</Alert> : null}

      {canRecordDisclosure && status === 'accepted' && conflictClean && !disclosedAt ? (
        <form action={action}>
          <input type="hidden" name="caseId" value={caseId} />
          <input type="hidden" name="assignmentId" value={assignmentId} />
          <Button type="submit" size="sm" variant="secondary" disabled={pending}>
            {t('recordDisclosure')}
          </Button>
          <p className="text-muted mt-2 text-xs leading-relaxed">{t('disclosureNote')}</p>
        </form>
      ) : null}
    </div>
  );
}
