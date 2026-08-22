'use client';

import { useActionState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { updateMilestone, type PartnerState } from '@/features/partners/actions';
import type { Enums } from '@/types/database';

const INITIAL: PartnerState = { status: 'idle' };

export function MilestoneControls({
  milestoneId,
  status,
}: {
  milestoneId: string;
  status: Enums<'milestone_status'>;
}) {
  const t = useTranslations('workspace.compliance');
  const tCommon = useTranslations('common');
  const [state, action, pending] = useActionState(updateMilestone, INITIAL);

  if (status === 'complete') {
    return <Badge tone="success">{t('completed')}</Badge>;
  }

  return (
    <form action={action} className="flex items-center gap-2">
      <input type="hidden" name="milestoneId" value={milestoneId} />
      <Button
        type="submit"
        name="status"
        value="in_progress"
        variant="ghost"
        size="sm"
        disabled={pending}
      >
        {tCommon('continue')}
      </Button>
      <Button type="submit" name="status" value="complete" size="sm" disabled={pending}>
        {t('markComplete')}
      </Button>
      {state.status === 'error' ? (
        <span className="sr-only" role="alert">
          {tCommon('retry')}
        </span>
      ) : null}
    </form>
  );
}
