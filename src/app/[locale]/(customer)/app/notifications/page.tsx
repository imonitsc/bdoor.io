import type { Metadata } from 'next';
import { getFormatter, getTranslations, setRequestLocale } from 'next-intl/server';
import { Bell } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { PageHeading } from '@/components/dashboard/page-heading';
import { MarkAllReadButton } from '@/components/dashboard/mark-all-read';
import { requireCustomerOrganization } from '@/lib/auth/require-organization';
import { createClient } from '@/lib/supabase/server';

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function NotificationsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  await requireCustomerOrganization();

  const [t, format] = await Promise.all([
    getTranslations('workspace.notifications'),
    getFormatter(),
  ]);

  const supabase = await createClient();
  const { data } = await supabase
    .from('notifications')
    .select('id, kind, title_en, title_bn, body_en, body_bn, href, read_at, created_at')
    .order('created_at', { ascending: false })
    .limit(50);

  const notifications = data ?? [];
  const label = (en: string, bn: string | null) => (locale === 'bn' ? (bn ?? en) : en);
  const hasUnread = notifications.some((n) => !n.read_at);

  return (
    <div className="flex flex-col gap-6">
      <PageHeading title={t('title')} actions={hasUnread ? <MarkAllReadButton /> : undefined} />

      {notifications.length === 0 ? (
        <EmptyState icon={<Bell className="size-5" />} title={t('empty')} />
      ) : (
        <ul className="divide-border border-border divide-y border-y">
          {notifications.map((notification) => (
            <li
              key={notification.id}
              className="flex flex-wrap items-start justify-between gap-3 py-4"
            >
              <div className="min-w-0">
                <p className="text-ink flex items-center gap-2 text-sm font-medium">
                  {label(notification.title_en, notification.title_bn)}
                  {!notification.read_at ? <Badge tone="info">{t('title')}</Badge> : null}
                </p>
                {notification.body_en ? (
                  <p className="text-muted mt-1 text-sm leading-relaxed">
                    {label(notification.body_en, notification.body_bn)}
                  </p>
                ) : null}
                {notification.href ? (
                  <Link
                    href={notification.href.replace(/^\/(en|bn)/, '')}
                    className="text-primary mt-1.5 inline-block rounded text-sm underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus)]"
                  >
                    {t('title')}
                  </Link>
                ) : null}
              </div>
              <time dateTime={notification.created_at} className="text-muted shrink-0 text-xs">
                {format.dateTime(new Date(notification.created_at), 'short')}
              </time>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
