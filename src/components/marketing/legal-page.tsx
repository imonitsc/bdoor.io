import { getFormatter, getTranslations } from 'next-intl/server';
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
 * While LEGAL_CONTENT_STATUS is `draft`, public pages show the substantive
 * working draft with a clear draft banner and stay noindexed. Publishing a
 * bare "under review" stub hid the owner-supplied policy pack and blocked
 * counsel review of the live preview. Payment, KYC and identity uploads
 * remain force-closed until the gate flips to `approved`.
 *
 * Bangla routes render the full English draft plus a translation-review
 * notice until a professional Bangla translation is approved — never an
 * abbreviated automatic summary.
 */
export async function LegalPage({ document, locale }: { document: LegalDocument; locale: Locale }) {
  const [t, format] = await Promise.all([getTranslations('legal'), getFormatter()]);
  const title = await getTranslations();
  const isDraft = legalContentStatus() === 'draft' || document.awaitingCounselReview;
  const showEnglishOnBangla = locale === 'bn';

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
                    {section.heading.en}
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

            {isDraft ? (
              <Alert tone="warning" title={t('draftBanner')} className="mt-6">
                {t('draftBannerBody')}
              </Alert>
            ) : null}

            {showEnglishOnBangla ? (
              <Alert tone="info" title={t('translationReviewTitle')} className="mt-4">
                {t('translationReviewBody')}
              </Alert>
            ) : null}

            <p className="text-muted mt-4 text-sm leading-relaxed">
              {t('contactLine', { email: COMPANY.email, legalName: COMPANY.legalName })}
            </p>

            <div className="prose-bdoor text-ink mt-8 max-w-none">
              {document.sections.map((section) => (
                <section key={section.id} id={section.id} className="scroll-mt-24">
                  <h2>{section.heading.en}</h2>
                  <Markdown content={section.body.en} />
                </section>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Section>
  );
}
