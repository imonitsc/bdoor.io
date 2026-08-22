import { useFormatter, useTranslations } from 'next-intl';
import { CalendarClock, CheckCircle2, CircleDot, FileText, MessageSquare, Receipt } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { milestoneProgress } from '@/features/cases/progress';

/**
 * A read-only rendering of the real customer dashboard widgets, with clearly
 * fictional sample data. It reuses the same progress calculation the product
 * uses, so the preview cannot drift from the thing it previews.
 */
const SAMPLE_MILESTONES = [
  { code: 'kyc', status: 'complete' as const, weight: 2 },
  { code: 'eligibility', status: 'complete' as const, weight: 2 },
  { code: 'name', status: 'in_progress' as const, weight: 2 },
  { code: 'sign', status: 'pending' as const, weight: 2 },
  { code: 'file', status: 'pending' as const, weight: 3 },
  { code: 'certificate', status: 'pending' as const, weight: 3 },
];

export function WorkspacePreview() {
  const t = useTranslations();
  const format = useFormatter();
  const progress = milestoneProgress(SAMPLE_MILESTONES);
  const dueDate = new Date(Date.now() + 12 * 86_400_000);

  return (
    <div
      className="overflow-hidden rounded-[var(--radius-panel)] border border-border bg-surface shadow-lg"
      role="img"
      aria-label={t('home.preview.body')}
    >
      <div className="flex items-center gap-2 border-b border-border bg-surface-sunken px-4 py-3">
        <span className="size-2.5 rounded-full bg-[color:var(--bd-border-strong)]" />
        <span className="size-2.5 rounded-full bg-[color:var(--bd-border-strong)]" />
        <span className="size-2.5 rounded-full bg-[color:var(--bd-border-strong)]" />
        <span className="ms-2 text-xs font-medium text-muted">BD-2026-000102</span>
        <Badge tone="info" className="ms-auto" icon={<CircleDot className="size-3" />}>
          {t('caseStatus.documents_required')}
        </Badge>
      </div>

      <div className="grid gap-px bg-border sm:grid-cols-2">
        <div className="bg-surface p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">
            {t('workspace.case.timeline')}
          </p>
          <p className="mt-2 text-sm font-medium text-ink">
            {t('workspace.dashboard.milestonesComplete', {
              done: progress.completed,
              total: progress.total,
            })}
          </p>
          <Progress
            value={progress.percent}
            label={t('workspace.case.timeline')}
            className="mt-3"
          />
          <ul className="mt-4 flex flex-col gap-2">
            {[
              { key: 'kyc', label: t('home.preview.sample.kyc'), done: true },
              { key: 'review', label: t('home.preview.sample.review'), done: true },
              { key: 'name', label: t('home.preview.sample.name'), done: false },
            ].map((item) => (
              <li key={item.key} className="flex items-center gap-2 text-sm">
                {item.done ? (
                  <CheckCircle2 className="size-4 shrink-0 text-success" aria-hidden="true" />
                ) : (
                  <CircleDot className="size-4 shrink-0 text-muted" aria-hidden="true" />
                )}
                <span className={item.done ? 'text-muted line-through' : 'text-ink'}>{item.label}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-surface p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">
            {t('workspace.dashboard.actionsNeeded')}
          </p>
          <ul className="mt-3 flex flex-col gap-3">
            <li className="flex items-start gap-2.5">
              <FileText className="mt-0.5 size-4 shrink-0 text-warning" aria-hidden="true" />
              <span className="text-sm text-ink">{t('home.preview.sample.address')}</span>
            </li>
            <li className="flex items-start gap-2.5">
              <FileText className="mt-0.5 size-4 shrink-0 text-warning" aria-hidden="true" />
              <span className="text-sm text-ink">{t('home.preview.sample.photo')}</span>
            </li>
            <li className="flex items-start gap-2.5">
              <MessageSquare className="mt-0.5 size-4 shrink-0 text-info" aria-hidden="true" />
              <span className="text-sm text-ink">{t('home.preview.sample.message')}</span>
            </li>
          </ul>
        </div>

        <div className="bg-surface p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">
            {t('workspace.billing.receipts')}
          </p>
          <ul className="mt-3 flex flex-col gap-2.5">
            <li className="flex items-center justify-between gap-3 text-sm">
              <span className="flex items-center gap-2 text-ink">
                <Receipt className="size-4 text-muted" aria-hidden="true" />
                {t('services.feeCategories.platform_service_fee')}
              </span>
              <Badge tone="success">{t('home.preview.sample.paid')}</Badge>
            </li>
            <li className="flex items-center justify-between gap-3 text-sm">
              <span className="flex items-center gap-2 text-ink">
                <Receipt className="size-4 text-muted" aria-hidden="true" />
                {t('services.feeCategories.government_fee_estimate')}
              </span>
              <Badge tone="warning">{t('workspace.case.receiptPending')}</Badge>
            </li>
          </ul>
        </div>

        <div className="bg-surface p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">
            {t('workspace.dashboard.upcomingCompliance')}
          </p>
          <div className="mt-3 flex items-start gap-2.5">
            <CalendarClock className="mt-0.5 size-4 shrink-0 text-muted" aria-hidden="true" />
            <div>
              <p className="text-sm font-medium text-ink">{t('home.preview.sample.renewal')}</p>
              <p className="text-sm text-muted">{format.dateTime(dueDate, 'long')}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
