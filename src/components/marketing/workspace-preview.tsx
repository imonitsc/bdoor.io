import { useFormatter, useTranslations } from 'next-intl';
import {
  CalendarClock,
  CheckCircle2,
  CircleDot,
  FileText,
  MessageSquare,
  Receipt,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { milestoneProgress } from '@/features/cases/progress';

/**
 * A read-only rendering of the real customer dashboard widgets, with clearly
 * fictional sample data. It reuses the same progress calculation the product
 * uses, so the preview cannot drift from the thing it previews.
 */
/** Fixed so the preview renders identically on the server and in the browser. */
const SAMPLE_DUE_DATE = new Date('2026-11-30T00:00:00Z');

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

  return (
    <div
      className="border-border bg-surface overflow-hidden rounded-[var(--radius-panel)] border shadow-lg"
      role="img"
      aria-label={t('home.preview.body')}
    >
      <div className="border-border bg-surface-sunken flex items-center gap-2 border-b px-4 py-3">
        <span className="size-2.5 rounded-full bg-[color:var(--bd-border-strong)]" />
        <span className="size-2.5 rounded-full bg-[color:var(--bd-border-strong)]" />
        <span className="size-2.5 rounded-full bg-[color:var(--bd-border-strong)]" />
        <span className="text-muted ms-2 text-xs font-medium">BD-2026-000102</span>
        <Badge tone="info" className="ms-auto" icon={<CircleDot className="size-3" />}>
          {t('caseStatus.documents_required')}
        </Badge>
      </div>

      <div className="bg-border grid gap-px sm:grid-cols-2">
        <div className="bg-surface p-5">
          <p className="text-muted text-xs font-semibold tracking-wide uppercase">
            {t('workspace.case.timeline')}
          </p>
          <p className="text-ink mt-2 text-sm font-medium">
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
                  <CheckCircle2 className="text-success size-4 shrink-0" aria-hidden="true" />
                ) : (
                  <CircleDot className="text-muted size-4 shrink-0" aria-hidden="true" />
                )}
                <span className={item.done ? 'text-muted line-through' : 'text-ink'}>
                  {item.label}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-surface p-5">
          <p className="text-muted text-xs font-semibold tracking-wide uppercase">
            {t('workspace.dashboard.actionsNeeded')}
          </p>
          <ul className="mt-3 flex flex-col gap-3">
            <li className="flex items-start gap-2.5">
              <FileText className="text-warning mt-0.5 size-4 shrink-0" aria-hidden="true" />
              <span className="text-ink text-sm">{t('home.preview.sample.address')}</span>
            </li>
            <li className="flex items-start gap-2.5">
              <FileText className="text-warning mt-0.5 size-4 shrink-0" aria-hidden="true" />
              <span className="text-ink text-sm">{t('home.preview.sample.photo')}</span>
            </li>
            <li className="flex items-start gap-2.5">
              <MessageSquare className="text-info mt-0.5 size-4 shrink-0" aria-hidden="true" />
              <span className="text-ink text-sm">{t('home.preview.sample.message')}</span>
            </li>
          </ul>
        </div>

        <div className="bg-surface p-5">
          <p className="text-muted text-xs font-semibold tracking-wide uppercase">
            {t('workspace.billing.receipts')}
          </p>
          <ul className="mt-3 flex flex-col gap-2.5">
            <li className="flex items-center justify-between gap-3 text-sm">
              <span className="text-ink flex items-center gap-2">
                <Receipt className="text-muted size-4" aria-hidden="true" />
                {t('services.feeCategories.platform_service_fee')}
              </span>
              <Badge tone="success">{t('home.preview.sample.paid')}</Badge>
            </li>
            <li className="flex items-center justify-between gap-3 text-sm">
              <span className="text-ink flex items-center gap-2">
                <Receipt className="text-muted size-4" aria-hidden="true" />
                {t('services.feeCategories.government_fee_estimate')}
              </span>
              <Badge tone="warning">{t('workspace.case.receiptPending')}</Badge>
            </li>
          </ul>
        </div>

        <div className="bg-surface p-5">
          <p className="text-muted text-xs font-semibold tracking-wide uppercase">
            {t('workspace.dashboard.upcomingCompliance')}
          </p>
          <div className="mt-3 flex items-start gap-2.5">
            <CalendarClock className="text-muted mt-0.5 size-4 shrink-0" aria-hidden="true" />
            <div>
              <p className="text-ink text-sm font-medium">{t('home.preview.sample.renewal')}</p>
              <p className="text-muted text-sm">{format.dateTime(SAMPLE_DUE_DATE, 'long')}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
