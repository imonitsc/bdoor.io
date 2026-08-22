import type { Metadata } from 'next';
import { getFormatter, getTranslations, setRequestLocale } from 'next-intl/server';
import { Alert } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeading } from '@/components/dashboard/page-heading';
import { requireCapability } from '@/lib/auth/session';
import { createClient } from '@/lib/supabase/server';
import { integrationModes } from '@/lib/env';

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function AdminSettingsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  await requireCapability('settings.manage');

  const [t, tCommon, format] = await Promise.all([
    getTranslations('admin.nav'),
    getTranslations('common'),
    getFormatter(),
  ]);

  const modes = integrationModes();
  const supabase = await createClient();

  const [settingsResult, flagsResult, jobsResult] = await Promise.all([
    supabase.from('platform_settings').select('key, value, description, is_public').order('key'),
    supabase
      .from('feature_flags')
      .select('key, description, is_enabled, rollout_note')
      .order('key'),
    supabase
      .from('integration_events')
      .select('id, integration, event_type, status, attempts, last_error, created_at')
      .in('status', ['failed', 'dead_letter'])
      .order('created_at', { ascending: false })
      .limit(20),
  ]);

  const liveModes = Object.entries(modes).filter(
    ([, value]) => value !== 'mock' && value !== 'disabled',
  );

  return (
    <div className="flex flex-col gap-6">
      <PageHeading title={t('settings')} />

      <Card>
        <CardHeader>
          <CardTitle as="h2">Integrations</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="divide-border divide-y">
            {Object.entries(modes).map(([name, value]) => (
              <li key={name} className="flex items-center justify-between gap-4 py-3">
                <span className="text-ink text-sm">{name}</span>
                <Badge tone={value === 'mock' || value === 'disabled' ? 'warning' : 'success'}>
                  {value}
                </Badge>
              </li>
            ))}
          </ul>
          {liveModes.length === 0 ? (
            <Alert tone="warning" className="mt-4">
              Every integration is running in mock or disabled mode. No email is sent, no payment is
              taken, no screening is performed and no file is scanned.
            </Alert>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle as="h2">Feature flags</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="divide-border divide-y">
            {(flagsResult.data ?? []).map((flag) => (
              <li key={flag.key} className="flex flex-wrap items-start justify-between gap-3 py-3">
                <div className="min-w-0">
                  <p className="text-ink font-mono text-xs">{flag.key}</p>
                  <p className="text-muted text-sm">{flag.description}</p>
                  {flag.rollout_note ? (
                    <p className="text-muted mt-0.5 text-xs">{flag.rollout_note}</p>
                  ) : null}
                </div>
                <Badge tone={flag.is_enabled ? 'success' : 'neutral'}>
                  {flag.is_enabled ? tCommon('yes') : tCommon('no')}
                </Badge>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle as="h2">Platform settings</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="divide-border divide-y">
            {(settingsResult.data ?? []).map((setting) => (
              <li key={setting.key} className="py-3">
                <p className="text-ink font-mono text-xs">{setting.key}</p>
                <p className="text-muted text-sm">{setting.description}</p>
                <pre className="scroll-x bg-surface-sunken text-ink mt-1 rounded-[var(--radius-control)] p-2 text-xs">
                  {JSON.stringify(setting.value)}
                </pre>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {(jobsResult.data ?? []).length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle as="h2">{(await getTranslations('admin.queues'))('failedJobs')}</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="divide-border divide-y">
              {(jobsResult.data ?? []).map((job) => (
                <li key={job.id} className="py-3">
                  <p className="text-ink flex flex-wrap items-center gap-2 text-sm">
                    <span className="font-mono text-xs">{job.integration}</span>
                    <Badge tone="danger">{job.status}</Badge>
                    <span className="text-muted text-xs">
                      {format.dateTime(new Date(job.created_at), 'withTime')}
                    </span>
                  </p>
                  {job.last_error ? (
                    <p className="text-muted mt-1 text-xs">{job.last_error}</p>
                  ) : null}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
