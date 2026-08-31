import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import { DocumentControls } from '@/components/admin/ai-registry-controls';
import { PageHeading } from '@/components/dashboard/page-heading';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getDocument } from '@/features/ai/registry/documents';
import { originalDocumentUrl } from '@/features/ai/registry/ingest';
import { listRules } from '@/features/ai/registry/rules';
import { Link } from '@/i18n/navigation';
import { requireCapability } from '@/lib/auth/session';

export const metadata: Metadata = { robots: { index: false, follow: false } };

/**
 * One registry document: full metadata, the version chain, the extracted text
 * beside a signed link to the stored original, and the rules drawn from it.
 * This is the review surface — what a person reads before anything reaches a
 * customer.
 */
export default async function AdminAiDocumentPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  await requireCapability('content.publish');

  const t = await getTranslations('admin.aiRegistry');
  const document = await getDocument(id);
  if (!document) notFound();

  const [originalUrl, rules] = await Promise.all([
    originalDocumentUrl(document),
    listRules().then((all) => all.filter((rule) => rule.registry_document_id === id)),
  ]);

  const meta: Array<[string, string | null]> = [
    [t('fields.institution'), document.issuing_institution],
    [t('fields.kind'), document.source_kind],
    [t('fields.reference'), document.reference_number],
    [t('fields.language'), document.language],
    [t('fields.jurisdiction'), document.jurisdiction],
    [t('fields.publicationDate'), document.publication_date],
    [t('fields.effectiveDate'), document.effective_date],
    [t('fields.expiryDate'), document.expiry_date],
    [t('fields.currency'), t(`currencyValues.${document.currency}`)],
    [t('fields.checksum'), document.checksum ? `${document.checksum.slice(0, 16)}…` : null],
    [t('fields.retrievedAt'), document.retrieved_at?.slice(0, 16).replace('T', ' ') ?? null],
    [
      t('fields.extraction'),
      document.extraction_method
        ? `${document.extraction_method}${document.ocr_applied ? ' + OCR' : ''}${document.page_count ? ` · ${document.page_count}p` : ''}`
        : null,
    ],
  ];

  return (
    <div className="space-y-8">
      <PageHeading
        title={document.official_title}
        description={t('documentDetailDescription')}
        actions={<DocumentControls documentId={document.id} lifecycle={document.lifecycle} />}
      />

      <div className="flex flex-wrap items-center gap-2">
        <Badge tone={document.lifecycle === 'published' ? 'success' : 'info'}>
          {t(`lifecycle.${document.lifecycle}`)}
        </Badge>
        <Badge tone="neutral">{t('tier', { tier: document.authority_tier })}</Badge>
        {document.topics.map((topic) => (
          <Badge key={topic} tone="neutral">
            {t(`topics.${topic}`)}
          </Badge>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('metadataTitle')}</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-x-6 gap-y-2 sm:grid-cols-2">
            {meta.map(([label, value]) => (
              <div key={label} className="flex justify-between gap-3 text-sm">
                <dt className="text-muted">{label}</dt>
                <dd className="text-ink text-end">{value ?? '—'}</dd>
              </div>
            ))}
          </dl>
          <p className="text-muted mt-4 text-xs break-all">
            {t('fields.canonicalUrl')}:{' '}
            <a
              href={document.canonical_url}
              target="_blank"
              rel="noreferrer noopener"
              className="text-primary underline underline-offset-2"
            >
              {document.canonical_url}
            </a>
          </p>
          {(document.previous_version_id || document.replaced_by_id) && (
            <p className="text-muted mt-2 text-xs">
              {document.previous_version_id ? (
                <Link
                  href={`/admin/ai/documents/${document.previous_version_id}`}
                  className="text-primary underline underline-offset-2"
                >
                  {t('previousVersion')}
                </Link>
              ) : null}
              {document.previous_version_id && document.replaced_by_id ? ' · ' : null}
              {document.replaced_by_id ? (
                <Link
                  href={`/admin/ai/documents/${document.replaced_by_id}`}
                  className="text-primary underline underline-offset-2"
                >
                  {t('replacedBy')}
                </Link>
              ) : null}
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('extractedTitle')}</CardTitle>
        </CardHeader>
        <CardContent>
          {originalUrl ? (
            <p className="mb-3 text-sm">
              <a
                href={originalUrl}
                target="_blank"
                rel="noreferrer noopener"
                className="text-primary underline underline-offset-2"
              >
                {t('openOriginal')}
              </a>{' '}
              <span className="text-muted text-xs">{t('originalNote')}</span>
            </p>
          ) : (
            <p className="text-muted mb-3 text-sm">{t('noOriginal')}</p>
          )}
          {document.extracted_text ? (
            <pre className="bg-surface-sunken text-ink max-h-[32rem] overflow-auto rounded-[var(--radius-control)] p-4 text-xs leading-relaxed whitespace-pre-wrap">
              {document.extracted_text.slice(0, 40_000)}
            </pre>
          ) : (
            <p className="text-muted text-sm">{t('noExtractedText')}</p>
          )}
        </CardContent>
      </Card>

      {rules.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>{t('rulesFromDocument', { count: rules.length })}</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="divide-border divide-y">
              {rules.map((rule) => (
                <li key={rule.id} className="py-2.5">
                  <p className="text-ink text-sm font-medium">{rule.title}</p>
                  <p className="text-muted mt-0.5 text-xs">
                    {t(`ruleStatus.${rule.status}`)} · {rule.legal_authority}
                  </p>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
