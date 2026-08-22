'use client';

import { useActionState } from 'react';
import { useTranslations } from 'next-intl';
import { CheckCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { markAllNotificationsRead } from '@/features/notifications/actions';

export function MarkAllReadButton() {
  const t = useTranslations('workspace.notifications');
  const [, action, pending] = useActionState(markAllNotificationsRead, { status: 'idle' as const });

  return (
    <form action={action}>
      <Button type="submit" variant="secondary" disabled={pending}>
        <CheckCheck className="size-4" aria-hidden="true" />
        {t('markAllRead')}
      </Button>
    </form>
  );
}
