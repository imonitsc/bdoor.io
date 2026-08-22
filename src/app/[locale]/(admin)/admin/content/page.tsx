import type { Metadata } from 'next';
import { getFormatter, getTranslations, setRequestLocale } from 'next-intl/server';
import { Newspaper } from 'lucide-react';
import { Alert } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { PageHeading } from '@/components/dashboard/page-heading';
import { requireCapability } from '@/lib/auth/session';
import { createClient } from '@/lib/supabase/server';
import { LEGAL_DOCUMENTS } from '@/content/legal/documents';

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function AdminContentPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  await requireCapability('content.publish');

  const [t, tServices, tLegal, tCommon, format] = await Promise.all([
    getTranslations('admin.nav'),
    getTranslations('admin.services'),
    getTranslations('legal'),
    getTranslations('common'),
    getFormatter(),
  ]);

  const supabase = await createClient();
  const [pagesResult, faqsResult] = await Promise.all([
    supabase
      .from('content_pages')
      .select(
        'slug, kind, title_en, status, is_compliance_sensitive, last_reviewed_at, next_review_due',
      )
      .order('kind'),
    supabase
      .from('service_faqs')
      .select(
        'id, question_en, status, is_compliance_sensitive, last_reviewed_at, internal_source_ref',
      )
      .order('sort_order'),
  ]);

  const today = new Date().toISOString().slice(0, 10);
  const pages = pagesResult.data ?? [];
  const faqs = faqsResult.data ?? [];
  const overdue = pages.filter((p) => p.next_review_due && p.next_review_due < today);

  const legalDrafts = Object.values(LEGAL_DOCUMENTS).filter((d) => d.awaitingCounselReview);

  return (
    <div className="flex flex-col gap-6">
      <PageHeading title={t('content')} />

      {legalDrafts.length > 0 ? (
        <Alert tone="warning" title={tLegal('draftBanner')}>
          <p>{tLegal('draftBannerBody')}</p>
          <ul className="mt-2 flex flex-wrap gap-1.5">
            {legalDrafts.map((doc) => (
              <li key={doc.slug}>
                <Badge tone="warning">
                  {doc.slug} · {doc.version}
                </Badge>
              </li>
            ))}
          </ul>
        </Alert>
      ) : null}

      {overdue.length > 0 ? (
        <Alert tone="warning" title={tServices('reviewOverdue')}>
          <ul className="mt-1 flex flex-col gap-1">
            {overdue.map((page) => (
              <li key={page.slug}>{page.title_en}</li>
            ))}
          </ul>
        </Alert>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle as="h2">{t('content')}</CardTitle>
        </CardHeader>
        <CardContent>
          {pages.length === 0 ? (
            <EmptyState icon={<Newspaper className="size-5" />} title={tCommon('noResults')} />
          ) : (
            <ul className="divide-border divide-y">
              {pages.map((page) => (
                <li
                  key={page.slug}
                  className="flex flex-wrap items-center justify-between gap-3 py-3.5"
                >
                  <div className="min-w-0">
                    <p className="text-ink truncate text-sm font-medium">{page.title_en}</p>
                    <p className="text-muted font-mono text-xs">/{page.slug}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {page.is_compliance_sensitive ? (
                      <Badge tone="warning">{tCommon('reviewNote')}</Badge>
                    ) : null}
                    <Badge tone={page.status === 'published' ? 'success' : 'neutral'}>
                      {page.status}
                    </Badge>
                    {page.last_reviewed_at ? (
                      <span className="text-muted text-xs">
                        {format.dateTime(new Date(page.last_reviewed_at), 'short')}
                      </span>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle as="h2">FAQ</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="divide-border divide-y">
            {faqs.map((faq) => (
              <li key={faq.id} className="py-3.5">
                <p className="text-ink text-sm">{faq.question_en}</p>
                <p className="mt-1 flex flex-wrap items-center gap-2">
                  <Badge tone={faq.status === 'published' ? 'success' : 'neutral'}>
                    {faq.status}
                  </Badge>
                  {faq.is_compliance_sensitive ? (
                    <Badge tone="warning">{tServices('sourceReference')}</Badge>
                  ) : null}
                  {faq.last_reviewed_at ? (
                    <span className="text-muted text-xs">
                      {format.dateTime(new Date(faq.last_reviewed_at), 'short')}
                    </span>
                  ) : null}
                </p>
                {faq.internal_source_ref ? (
                  <p className="text-muted mt-1 text-xs">{faq.internal_source_ref}</p>
                ) : null}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
