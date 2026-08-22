import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { CheckCircle2 } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { Card } from '@/components/ui/card';
import { PageHeading } from '@/components/dashboard/page-heading';
import { requireStaff } from '@/lib/auth/session';
import { getQueueCounts } from '@/features/admin/queries';
import { ADMIN_ROUTES } from '@/lib/navigation';
import { cn } from '@/lib/utils/cn';

export const metadata: Metadata = { robots: { index: false, follow: false } };

const QUEUES = [
  { key: 'newLeads', href: ADMIN_ROUTES.leads },
  { key: 'kycDecisions', href: ADMIN_ROUTES.kyc },
  { key: 'quotesToPrepare', href: ADMIN_ROUTES.finance },
  { key: 'customerOverdue', href: ADMIN_ROUTES.cases },
  { key: 'partnerOverdue', href: ADMIN_ROUTES.partners },
  { key: 'authorityQueries', href: ADMIN_ROUTES.cases },
  { key: 'paymentsToReconcile', href: ADMIN_ROUTES.finance },
  { key: 'complianceDue', href: ADMIN_ROUTES.compliance },
  { key: 'failedJobs', href: ADMIN_ROUTES.settings },
] as const;

export default async function AdminDashboard({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  const [session, t, counts] = await Promise.all([
    requireStaff(),
    getTranslations('admin.queues'),
    getQueueCounts(),
  ]);

  const total = Object.values(counts).reduce((sum, value) => sum + value, 0);

  return (
    <div className="flex flex-col gap-6">
      <PageHeading title={t('title')} description={session.platformRoles.join(' · ')} />

      {total === 0 ? (
        <Card className="flex items-center gap-3 p-5">
          <CheckCircle2 className="text-success size-5" aria-hidden="true" />
          <p className="text-ink text-sm">{t('empty')}</p>
        </Card>
      ) : null}

      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {QUEUES.map((queue) => {
          const count = counts[queue.key];
          return (
            <li key={queue.key}>
              <Card as="article" className="group relative p-5 transition-shadow hover:shadow-md">
                <p className="text-ink text-sm font-medium">
                  <Link
                    href={queue.href}
                    className="rounded before:absolute before:inset-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus)]"
                  >
                    {t(queue.key)}
                  </Link>
                </p>
                <p
                  className={cn(
                    'mt-2 text-3xl font-semibold',
                    count === 0 ? 'text-muted' : 'text-ink',
                  )}
                >
                  {count}
                </p>
              </Card>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
