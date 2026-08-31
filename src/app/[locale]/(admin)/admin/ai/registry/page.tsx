import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import { RegistrySeedButton, RegistryToggle } from '@/components/admin/ai-registry-controls';
import { PageHeading } from '@/components/dashboard/page-heading';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Table, TBody, TD, TH, THead, TR } from '@/components/ui/table';
import { listRegistry } from '@/features/ai/registry/documents';
import { requireCapability } from '@/lib/auth/session';

export const metadata: Metadata = { robots: { index: false, follow: false } };

/**
 * The source registry: which official institutions the knowledge system
 * watches, at which authority tier, how often, and how healthily. Editable —
 * a source can be disabled without deleting its history.
 */
export default async function AdminAiRegistryPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  await requireCapability('content.publish');

  const t = await getTranslations('admin.aiRegistry');
  const sources = await listRegistry();

  return (
    <div className="space-y-8">
      <PageHeading
        title={t('registryTitle')}
        description={t('registryDescription')}
        actions={<RegistrySeedButton />}
      />

      <Card>
        <CardHeader>
          <CardTitle>{t('registryTitle')}</CardTitle>
        </CardHeader>
        <CardContent>
          {sources.length === 0 ? (
            <EmptyState title={t('registryEmpty')} description={t('registryEmptyBody')} />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <THead>
                  <TR>
                    <TH>{t('columns.institution')}</TH>
                    <TH>{t('columns.tier')}</TH>
                    <TH>{t('columns.frequency')}</TH>
                    <TH>{t('columns.lastChecked')}</TH>
                    <TH>{t('columns.health')}</TH>
                    <TH>{t('columns.actions')}</TH>
                  </TR>
                </THead>
                <TBody>
                  {sources.map((source) => (
                    <TR key={source.id}>
                      <TD>
                        <span className="text-ink font-medium">{source.institution}</span>
                        <span className="text-muted block text-xs">
                          {source.code} · {source.kind}
                        </span>
                      </TD>
                      <TD>
                        <Badge
                          tone={
                            source.authority_tier <= 2
                              ? 'success'
                              : source.authority_tier <= 4
                                ? 'info'
                                : 'neutral'
                          }
                        >
                          {t('tier', { tier: source.authority_tier })}
                        </Badge>
                      </TD>
                      <TD className="text-muted text-xs">
                        {t('everyHours', { hours: source.check_frequency_hours })}
                      </TD>
                      <TD className="text-muted text-xs">
                        {source.last_checked_at?.slice(0, 16).replace('T', ' ') ??
                          t('neverChecked')}
                      </TD>
                      <TD>
                        {!source.enabled ? (
                          <Badge tone="neutral">{t('disabled')}</Badge>
                        ) : source.consecutive_failures > 0 ? (
                          <Badge tone="danger">
                            {t('failures', { count: source.consecutive_failures })}
                          </Badge>
                        ) : (
                          <Badge tone="success">{t('healthy')}</Badge>
                        )}
                      </TD>
                      <TD>
                        <RegistryToggle sourceId={source.id} enabled={source.enabled} />
                      </TD>
                    </TR>
                  ))}
                </TBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
