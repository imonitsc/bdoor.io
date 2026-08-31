import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import { RetrievalConsole } from '@/components/admin/ai-registry-controls';
import { PageHeading } from '@/components/dashboard/page-heading';
import { Alert } from '@/components/ui/alert';
import { Card, CardContent } from '@/components/ui/card';
import { requireCapability } from '@/lib/auth/session';

export const metadata: Metadata = { robots: { index: false, follow: false } };

/**
 * The retrieval testing console: the exact context the model would be handed
 * for a question, without calling the model. Costs an embedding, not an
 * answer — the cheap way to see why a question retrieves the wrong section.
 */
export default async function AdminAiTestingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  await requireCapability('content.publish');

  const t = await getTranslations('admin.aiRegistry');

  return (
    <div className="space-y-8">
      <PageHeading title={t('testingTitle')} description={t('testingDescription')} />
      <Alert tone="info">{t('testingNote')}</Alert>
      <Card>
        <CardContent className="pt-6">
          <RetrievalConsole />
        </CardContent>
      </Card>
    </div>
  );
}
