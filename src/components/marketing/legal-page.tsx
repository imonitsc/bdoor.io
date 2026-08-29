import { getFormatter, getTranslations } from 'next-intl/server';
import { Mail } from 'lucide-react';
import { Alert } from '@/components/ui/alert';
import { Section } from '@/components/ui/section';
import { Markdown } from '@/components/marketing/markdown';
import { legalContentStatus } from '@/lib/launch/gates';
import { COMPANY } from '@/content/company';
import type { LegalDocument } from '@/content/legal/types';
import type { Locale } from '@/features/catalog/types';

/**
 * Shared renderer for the legal documents.
 *
 * While LEGAL_CONTENT_STATUS is `draft` the public page carries a concise
 * pre-launch notice instead of the working draft: publishing thousands of
 * words of unreviewed terms under a "draft" banner reads as finished text to
 * most visitors, and nothing on the site is chargeable yet, so there is no
 * agreement a customer needs to study. The drafts stay in the repository
 * (src/content/legal/documents.ts) for the professional reviewers, and the
 * pages are noindexed until approval.
 *
 * Once approved, the full document renders with its version stamp so a
 * customer can always tell which text they accepted.
 */
export async function LegalPage({ document, locale }: { document: LegalDocument; locale: Locale }) {
  const [t, format] = await Promise.all([getTranslations('legal'), getFormatter()]);
  const title = await getTranslations();

  if (legalContentStatus() === 'draft') {
    return (
      <Section className="py-12 md:py-16">
        <div className="container-page max-w-2xl">
          <h1 className="text-ink text-3xl leading-tight md:text-4xl">
            {title(document.titleKey)}
          </h1>
          <Alert tone="info" title={t('preLaunchTitle')} className="mt-8">
            {t('preLaunchBody')}
          </Alert>
          <p className="text-muted mt-6 text-sm leading-relaxed">{t('preLaunchDetail')}</p>
          <p className="text-muted mt-4 text-sm leading-relaxed">
            {t('preLaunchOperator', { legalName: COMPANY.legalName })}
          </p>
          <a
            href={`mailto:${COMPANY.email}`}
            className="text-primary mt-6 inline-flex min-h-11 items-center gap-2 rounded text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus)]"
          >
            <Mail className="size-4" aria-hidden="true" />
            {COMPANY.email}
          </a>
        </div>
      </Section>
    );
  }

  return (
    <Section className="py-12 md:py-16">
      <div className="container-page">
        <div className="grid gap-10 lg:grid-cols-[0.28fr_0.72fr] lg:gap-14">
          <nav aria-label={t('tableOfContents')} className="h-fit lg:sticky lg:top-24">
            <h2 className="text-muted text-xs font-semibold tracking-[0.1em] uppercase">
              {t('tableOfContents')}
            </h2>
            <ol className="mt-3 flex flex-col gap-2">
              {document.sections.map((section) => (
                <li key={section.id}>
                  <a
                    href={`#${section.id}`}
                    className="text-muted hover:text-ink rounded text-sm underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus)]"
                  >
                    {locale === 'bn' ? section.heading.bn : section.heading.en}
                  </a>
                </li>
              ))}
            </ol>
          </nav>

          <div>
            <h1 className="text-ink text-3xl leading-tight md:text-4xl">
              {title(document.titleKey)}
            </h1>
            <p className="text-muted mt-3 text-sm">
              {t('lastUpdated', {
                date: format.dateTime(new Date(document.lastUpdated), 'long'),
              })}{' '}
              · {document.version}
            </p>

            {document.awaitingCounselReview ? (
              <Alert tone="warning" title={t('draftBanner')} className="mt-6">
                {t('draftBannerBody')}
              </Alert>
            ) : null}

            <div className="prose-bdoor text-ink mt-8 max-w-none">
              {document.sections.map((section) => (
                <section key={section.id} id={section.id} className="scroll-mt-24">
                  <h2>{locale === 'bn' ? section.heading.bn : section.heading.en}</h2>
                  <Markdown content={locale === 'bn' ? section.body.bn : section.body.en} />
                </section>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Section>
  );
}
