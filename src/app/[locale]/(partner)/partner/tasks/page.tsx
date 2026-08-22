import type { Metadata } from 'next';
import { getFormatter, getTranslations, setRequestLocale } from 'next-intl/server';
import { ListChecks } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { PageHeading } from '@/components/dashboard/page-heading';
import { requirePartnerOrganization } from '@/lib/auth/require-organization';
import { createClient } from '@/lib/supabase/server';

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function PartnerTasksPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const { active } = await requirePartnerOrganization();

  const [t, tCommon, format] = await Promise.all([
    getTranslations('partnerWorkspace.nav'),
    getTranslations('common'),
    getFormatter(),
  ]);

  const supabase = await createClient();
  const { data } = await supabase
    .from('tasks')
    .select('id, title, description, status, due_on, case_id, cases(reference)')
    .eq('assigned_org_id', active.organizationId)
    .order('due_on', { nullsFirst: false });

  type Row = {
    id: string;
    title: string;
    description: string | null;
    status: string;
    due_on: string | null;
    case_id: string;
    cases: { reference: string } | null;
  };
  const tasks = (data ?? []) as unknown as Row[];

  return (
    <div className="flex flex-col gap-6">
      <PageHeading title={t('tasks')} />
      {tasks.length === 0 ? (
        <EmptyState icon={<ListChecks className="size-5" />} title={tCommon('noResults')} />
      ) : (
        <ul className="divide-border border-border divide-y border-y">
          {tasks.map((task) => (
            <li key={task.id} className="flex flex-wrap items-start justify-between gap-3 py-4">
              <div className="min-w-0">
                <p className="text-ink text-sm font-medium">{task.title}</p>
                {task.description ? (
                  <p className="text-muted mt-1 text-sm leading-relaxed">{task.description}</p>
                ) : null}
                {task.cases ? (
                  <Link
                    href={`/partner/cases/${task.case_id}`}
                    className="text-primary mt-1 inline-block rounded font-mono text-xs underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus)]"
                  >
                    {task.cases.reference}
                  </Link>
                ) : null}
              </div>
              <div className="flex items-center gap-3">
                {task.due_on ? (
                  <span className="text-muted text-sm">
                    {format.dateTime(new Date(task.due_on), 'short')}
                  </span>
                ) : null}
                <Badge tone={task.status === 'done' ? 'success' : 'info'}>{task.status}</Badge>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
