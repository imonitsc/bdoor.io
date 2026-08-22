'use client';

import { useTranslations } from 'next-intl';
import {
  CircleCheck,
  CircleDot,
  CircleX,
  Clock,
  FileWarning,
  Landmark,
  Pause,
  UserCheck,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { STATUS_TONE, type CaseStatus } from '@/features/cases/state-machine';
import type { Enums } from '@/types/database';

const STATUS_ICON: Record<CaseStatus, typeof CircleDot> = {
  draft: CircleDot,
  awaiting_kyc: UserCheck,
  kyc_review: UserCheck,
  quote_ready: FileWarning,
  awaiting_acceptance: Clock,
  awaiting_payment: Clock,
  documents_required: FileWarning,
  partner_review: UserCheck,
  ready_to_submit: CircleDot,
  submitted: Landmark,
  authority_query: Landmark,
  customer_action_required: FileWarning,
  approved: CircleCheck,
  rejected: CircleX,
  closed: CircleCheck,
  cancelled: Pause,
};

/**
 * Case status. Always renders an icon and a word — status is never conveyed by
 * colour alone.
 */
export function CaseStatusBadge({ status }: { status: CaseStatus }) {
  const t = useTranslations('caseStatus');
  const Icon = STATUS_ICON[status];
  return (
    <Badge tone={STATUS_TONE[status]} icon={<Icon className="size-3" />}>
      {t(status)}
    </Badge>
  );
}

const DOCUMENT_TONE: Record<
  Enums<'document_status'>,
  'neutral' | 'info' | 'warning' | 'success' | 'danger'
> = {
  requested: 'warning',
  uploaded: 'info',
  under_review: 'info',
  accepted: 'success',
  replacement_requested: 'warning',
  expired: 'danger',
  archived: 'neutral',
};

export function DocumentStatusBadge({ status }: { status: Enums<'document_status'> }) {
  const t = useTranslations('documentStatus');
  return <Badge tone={DOCUMENT_TONE[status]}>{t(status)}</Badge>;
}
