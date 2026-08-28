import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Alert } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeading } from '@/components/dashboard/page-heading';
import { requireCapability } from '@/lib/auth/session';
import { LAUNCH_GATES, p0GatesOpen } from '@/content/launch/gates';

export const metadata: Metadata = { robots: { index: false, follow: false } };

const TONE = {
  open: 'danger',
  partial: 'warning',
  closed: 'success',
} as const;

export default async function LaunchGatesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  await requireCapability('settings.manage');
  const t = await getTranslations('admin.launch');

  return (
    <div className="flex flex-col gap-6">
      <PageHeading title={t('title')} description={t('description')} />
      {p0GatesOpen() ? <Alert tone="warning" title={t('openWarning')} /> : null}
      <ul className="flex flex-col gap-4">
        {LAUNCH_GATES.map((gate) => (
          <li key={gate.id}>
            <Card>
              <CardHeader className="flex flex-row items-start justify-between gap-4">
                <div>
                  <p className="text-muted text-xs font-semibold tracking-wide uppercase">
                    {t('gate', { id: gate.id })}
                  </p>
                  <CardTitle as="h2" className="mt-1">
                    {gate.title}
                  </CardTitle>
                </div>
                <Badge tone={TONE[gate.status]}>{t(`status.${gate.status}`)}</Badge>
              </CardHeader>
              <CardContent className="flex flex-col gap-2 text-sm">
                <p>
                  <span className="text-muted">{t('owner')}: </span>
                  {gate.owner}
                </p>
                <p>
                  <span className="text-muted">{t('evidence')}: </span>
                  {gate.evidence}
                </p>
                <p>
                  <span className="text-muted">{t('consequence')}: </span>
                  {gate.blockingConsequence}
                </p>
              </CardContent>
            </Card>
          </li>
        ))}
      </ul>
    </div>
  );
}
