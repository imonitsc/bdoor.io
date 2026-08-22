import type { Metadata } from 'next';
import { getFormatter, getTranslations, setRequestLocale } from 'next-intl/server';
import { CalendarCheck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { PageHeading } from '@/components/dashboard/page-heading';
import { requireCustomerOrganization } from '@/lib/auth/require-organization';
import { createClient } from '@/lib/supabase/server';
import { daysUntil } from '@/features/cases/deadlines';

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function CompliancePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  await requireCustomerOrganization();

  const [t, tCommon, format] = await Promise.all([
    getTranslations('workspace.compliance'),
    getTranslations('common'),
    getFormatter(),
  ]);

  const supabase = await createClient();
  const { data } = await supabase
    .from('compliance_obligations')
    .select(
      'id, label_en, label_bn, authority_name, due_on, status, responsible_kind, required_documents, source',
    )
    .order('due_on');

  const obligations = data ?? [];
  const now = new Date();
  const label = (en: string, bn: string) => (locale === 'bn' ? bn : en);

  const groups = [
    { key: 'overdue', items: obligations.filter((o) => o.status === 'overdue') },
    {
      key: 'upcoming',
      items: obligations.filter(
        (o) => o.status === 'due' || o.status === 'upcoming' || o.status === 'in_progress',
      ),
    },
    { key: 'completed', items: obligations.filter((o) => o.status === 'completed') },
  ] as const;

  return (
    <div className="flex flex-col gap-6">
      <PageHeading title={t('title')} />

      {obligations.length === 0 ? (
        <EmptyState icon={<CalendarCheck className="size-5" />} title={t('noObligations')} />
      ) : (
        groups
          .filter((group) => group.items.length > 0)
          .map((group) => (
            <Card key={group.key}>
              <CardHeader>
                <CardTitle as="h2">{t(group.key)}</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="divide-border divide-y">
                  {group.items.map((obligation) => {
                    const days = daysUntil(new Date(obligation.due_on), now);
                    return (
                      <li
                        key={obligation.id}
                        className="flex flex-wrap items-start justify-between gap-3 py-4"
                      >
                        <div className="min-w-0">
                          <p className="text-ink text-sm font-medium">
                            {label(obligation.label_en, obligation.label_bn)}
                          </p>
                          {obligation.authority_name ? (
                            <p className="text-muted mt-0.5 text-xs">{obligation.authority_name}</p>
                          ) : null}
                          <p className="mt-2 flex flex-wrap gap-1.5">
                            <Badge tone="neutral">
                              {t('responsible')}:{' '}
                              {obligation.responsible_kind === 'customer'
                                ? tCommon('yes')
                                : obligation.responsible_kind}
                            </Badge>
                            {obligation.required_documents.length > 0 ? (
                              <Badge tone="neutral">
                                {obligation.required_documents.length}{' '}
                                {tCommon('required').toLowerCase()}
                              </Badge>
                            ) : null}
                          </p>
                        </div>
                        <div className="text-end">
                          <p className="text-ink text-sm font-medium">
                            {format.dateTime(new Date(obligation.due_on), 'long')}
                          </p>
                          <p
                            className={
                              days < 0
                                ? 'text-danger mt-0.5 text-xs font-medium'
                                : days <= 14
                                  ? 'text-warning mt-0.5 text-xs font-medium'
                                  : 'text-muted mt-0.5 text-xs'
                            }
                          >
                            {days < 0
                              ? t('overdueBy', { days: Math.abs(days) })
                              : t('dueIn', { days })}
                          </p>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </CardContent>
            </Card>
          ))
      )}
    </div>
  );
}
