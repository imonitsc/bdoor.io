import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import { RuleControls } from '@/components/admin/ai-registry-controls';
import { PageHeading } from '@/components/dashboard/page-heading';
import { Alert } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { listRules, type RuleStatus } from '@/features/ai/registry/rules';
import { Link } from '@/i18n/navigation';
import { requireCapability } from '@/lib/auth/session';

export const metadata: Metadata = { robots: { index: false, follow: false } };

const STATUS_TONE: Record<RuleStatus, 'neutral' | 'info' | 'success' | 'warning' | 'danger'> = {
  draft: 'neutral',
  in_review: 'warning',
  approved: 'info',
  published: 'success',
  superseded: 'neutral',
  withdrawn: 'danger',
};

/**
 * The structured-rule review queue. A model-extracted rule arrives here as a
 * draft; nothing it says reaches a customer until a person moves it through
 * review, verifies (or clears) its fee, and publishes it.
 */
export default async function AdminAiRulesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  await requireCapability('content.publish');

  const t = await getTranslations('admin.aiRegistry');
  const rules = await listRules();
  const drafts = rules.filter((rule) => ['draft', 'in_review'].includes(rule.status));

  return (
    <div className="space-y-8">
      <PageHeading title={t('rulesTitle')} description={t('rulesDescription')} />

      {drafts.length > 0 ? (
        <Alert tone="warning">{t('rulesAwaiting', { count: drafts.length })}</Alert>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>{t('rulesTitle')}</CardTitle>
        </CardHeader>
        <CardContent>
          {rules.length === 0 ? (
            <EmptyState title={t('rulesEmpty')} description={t('rulesEmptyBody')} />
          ) : (
            <ul className="divide-border divide-y">
              {rules.map((rule) => (
                <li key={rule.id} className="space-y-2 py-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone={STATUS_TONE[rule.status]}>{t(`ruleStatus.${rule.status}`)}</Badge>
                    <Badge tone="neutral">{t(`topics.${rule.topic}`)}</Badge>
                    <span className="text-ink text-sm font-medium">{rule.title}</span>
                  </div>
                  <dl className="text-muted grid gap-x-6 gap-y-1 text-xs sm:grid-cols-2">
                    <div>
                      <dt className="inline font-medium">{t('ruleFields.appliesTo')}: </dt>
                      <dd className="inline">{rule.applies_to}</dd>
                    </div>
                    <div>
                      <dt className="inline font-medium">{t('ruleFields.authority')}: </dt>
                      <dd className="inline">{rule.responsible_authority}</dd>
                    </div>
                    <div>
                      <dt className="inline font-medium">{t('ruleFields.action')}: </dt>
                      <dd className="inline">{rule.required_action}</dd>
                    </div>
                    <div>
                      <dt className="inline font-medium">{t('ruleFields.legalBasis')}: </dt>
                      <dd className="inline">{rule.legal_authority}</dd>
                    </div>
                    {rule.government_fee_text ? (
                      <div>
                        <dt className="inline font-medium">{t('ruleFields.fee')}: </dt>
                        <dd className="inline">
                          {rule.government_fee_text}{' '}
                          {rule.government_fee_verified ? (
                            <Badge tone="success">{t('feeVerified')}</Badge>
                          ) : (
                            <Badge tone="warning">{t('feeUnverified')}</Badge>
                          )}
                        </dd>
                      </div>
                    ) : null}
                    {rule.deadline_text ? (
                      <div>
                        <dt className="inline font-medium">{t('ruleFields.deadline')}: </dt>
                        <dd className="inline">{rule.deadline_text}</dd>
                      </div>
                    ) : null}
                    {rule.extracted_by_model ? (
                      <div>
                        <dt className="inline font-medium">{t('ruleFields.extractedBy')}: </dt>
                        <dd className="inline">{rule.extracted_by_model}</dd>
                      </div>
                    ) : null}
                    {rule.registry_document_id ? (
                      <div>
                        <Link
                          href={`/admin/ai/documents/${rule.registry_document_id}`}
                          className="text-primary underline underline-offset-2"
                        >
                          {t('sourceDocument')}
                        </Link>
                      </div>
                    ) : null}
                  </dl>
                  <RuleControls
                    ruleId={rule.id}
                    status={rule.status}
                    hasFee={Boolean(rule.government_fee_text)}
                    feeVerified={rule.government_fee_verified}
                  />
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
