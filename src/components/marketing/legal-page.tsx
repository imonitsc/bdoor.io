import { getFormatter, getTranslations } from 'next-intl/server';
import { Alert } from '@/components/ui/alert';
import { Section } from '@/components/ui/section';
import { Markdown } from '@/components/marketing/markdown';
import type { LegalDocument } from '@/content/legal/types';
import type { Locale } from '@/features/catalog/types';

/**
 * Shared renderer for the legal documents. It always shows the draft banner
 * while `awaitingCounselReview` is true, and it always shows the version stamp
 * so a customer can tell which text they accepted.
 */
export async function LegalPage({ document, locale }: { document: LegalDocument; locale: Locale }) {
  const [t, format] = await Promise.all([getTranslations('legal'), getFormatter()]);
  const title = await getTranslations();

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
