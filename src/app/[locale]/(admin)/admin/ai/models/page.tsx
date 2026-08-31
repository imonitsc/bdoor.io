import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { gateway } from 'ai';

import { PageHeading } from '@/components/dashboard/page-heading';
import { Alert } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TBody, TD, TH, THead, TR } from '@/components/ui/table';
import { modelChain, type ModelRole } from '@/features/ai/models';
import { requireCapability } from '@/lib/auth/session';
import { logger } from '@/lib/logger';

export const metadata: Metadata = { robots: { index: false, follow: false } };

/**
 * Model routes (BI-OS §6.1).
 *
 * The admin's view of which model serves which role, beside the gateway's
 * LIVE model listing — chains are configured from current identifiers, not
 * remembered ones. This screen is read-only on purpose: a chain change is an
 * environment variable change with a deploy history, not a dashboard click
 * at 2am.
 */

const CHAIN_ROLES: Array<{ role: ModelRole; configuredVia: string | null }> = [
  { role: 'answer', configuredVia: 'AI_ANSWER_MODEL, AI_ANSWER_FALLBACK_MODELS' },
  { role: 'expert', configuredVia: 'AI_EXPERT_MODEL' },
  { role: 'verifier', configuredVia: 'AI_VERIFIER_MODEL' },
  { role: 'extraction', configuredVia: 'AI_EXTRACTION_MODEL' },
  { role: 'embedding', configuredVia: null },
];

/** The two roles served by code rather than a model, listed for honesty. */
const CODE_ROLES = ['router', 'reranker'] as const;

async function availableGatewayModels(): Promise<string[] | null> {
  try {
    const { models } = await gateway.getAvailableModels();
    return models.map((model) => model.id).sort();
  } catch (error) {
    // Local development without a gateway credential lands here; the page
    // still shows the configured chains.
    logger.debug('ai.models.gateway_list_failed', { message: (error as Error).message });
    return null;
  }
}

export default async function AdminAiModelsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  await requireCapability('content.publish');

  const t = await getTranslations('admin.aiModels');
  const gatewayIds = await availableGatewayModels();
  const listed = new Set(gatewayIds ?? []);

  return (
    <div className="space-y-8">
      <PageHeading title={t('title')} description={t('description')} />

      <Card>
        <CardHeader>
          <CardTitle>{t('roleColumn')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <THead>
                <TR>
                  <TH>{t('roleColumn')}</TH>
                  <TH>{t('chainColumn')}</TH>
                  <TH>{t('configColumn')}</TH>
                </TR>
              </THead>
              <TBody>
                {CHAIN_ROLES.map(({ role, configuredVia }) => {
                  const chain = modelChain(role);
                  return (
                    <TR key={role}>
                      <TD>
                        <span className="text-ink font-medium">{t(`roles.${role}.name`)}</span>
                        <span className="text-muted mt-0.5 block max-w-md text-xs">
                          {t(`roles.${role}.purpose`)}
                        </span>
                      </TD>
                      <TD>
                        {chain.length === 0 ? (
                          <Badge tone="neutral">{t('off')}</Badge>
                        ) : (
                          <ol className="space-y-1">
                            {chain.map((slug, index) => (
                              <li key={slug} className="flex items-center gap-1.5">
                                <span className="text-muted text-xs tabular-nums">
                                  {index + 1}.
                                </span>
                                <code className="text-ink text-xs">{slug}</code>
                                {gatewayIds && !listed.has(slug) ? (
                                  <Badge tone="warning">{t('gatewayUnlisted')}</Badge>
                                ) : null}
                              </li>
                            ))}
                          </ol>
                        )}
                      </TD>
                      <TD className="text-muted text-xs">
                        {configuredVia ? (
                          <>
                            <span className="block">{t('configuredVia')}</span>
                            <code>{configuredVia}</code>
                          </>
                        ) : (
                          t('builtIn')
                        )}
                      </TD>
                    </TR>
                  );
                })}
                {CODE_ROLES.map((role) => (
                  <TR key={role}>
                    <TD>
                      <span className="text-ink font-medium">{t(`roles.${role}.name`)}</span>
                      <span className="text-muted mt-0.5 block max-w-md text-xs">
                        {t(`roles.${role}.purpose`)}
                      </span>
                    </TD>
                    <TD>
                      <Badge tone="info">{t('deterministic')}</Badge>
                    </TD>
                    <TD className="text-muted text-xs">{t('builtIn')}</TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('gatewayTitle')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-muted text-sm">{t('gatewayDescription')}</p>
          {gatewayIds === null ? (
            <Alert tone="warning">{t('gatewayUnreachable')}</Alert>
          ) : (
            <>
              <p className="text-ink text-sm font-medium">
                {t('gatewayCount', { count: gatewayIds.length })}
              </p>
              <ul className="max-h-80 space-y-1 overflow-y-auto">
                {gatewayIds.map((id) => (
                  <li key={id}>
                    <code className="text-muted text-xs">{id}</code>
                  </li>
                ))}
              </ul>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
