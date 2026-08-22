import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { ArrowRight } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';
import { Section } from '@/components/ui/section';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/marketing/page-header';
import { FaqList } from '@/components/marketing/faq-list';
import { IndependenceDisclosure } from '@/components/layout/disclosure';
import { getGlobalFaqs } from '@/features/catalog/queries';
import { MARKETING_ROUTES } from '@/lib/navigation';
import { localizedUrl } from '@/lib/site';
import type { Locale } from '@/features/catalog/types';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'howItWorksPage' });
  return {
    title: t('title'),
    description: t('description'),
    alternates: {
      canonical: localizedUrl(locale as Locale, '/how-it-works'),
      languages: {
        en: localizedUrl('en', '/how-it-works'),
        'bn-BD': localizedUrl('bn', '/how-it-works'),
      },
    },
  };
}

/** Who does what, by stage. Deliberately explicit about what BDoor cannot do. */
const RESPONSIBILITIES = [
  { stage: 'intake', bdoor: true, partner: false, authority: false, customer: true },
  { stage: 'kyc', bdoor: true, partner: false, authority: false, customer: true },
  { stage: 'eligibility', bdoor: false, partner: true, authority: false, customer: false },
  { stage: 'quote', bdoor: true, partner: true, authority: false, customer: true },
  { stage: 'drafting', bdoor: false, partner: true, authority: false, customer: true },
  { stage: 'submission', bdoor: true, partner: true, authority: false, customer: false },
  { stage: 'decision', bdoor: false, partner: false, authority: true, customer: false },
  { stage: 'compliance', bdoor: true, partner: false, authority: false, customer: true },
] as const;

export default async function HowItWorksPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  const [t, tSteps, { data: faqs }] = await Promise.all([
    getTranslations('howItWorksPage'),
    getTranslations('home.howItWorks.steps'),
    getGlobalFaqs(),
  ]);

  const steps = ['one', 'two', 'three', 'four'] as const;

  return (
    <>
      <PageHeader title={t('title')} description={t('description')} />

      <Section className="py-12 md:py-16">
        <div className="container-page">
          <h2 className="text-ink text-xl font-semibold">{t('timeline.title')}</h2>
          <ol className="mt-8 grid gap-8 md:grid-cols-2">
            {steps.map((step, index) => (
              <li key={step} className="flex gap-4">
                <span
                  className="bg-primary-soft text-info flex size-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold"
                  aria-hidden="true"
                >
                  {index + 1}
                </span>
                <div>
                  <h3 className="text-ink text-base font-semibold">{tSteps(`${step}.title`)}</h3>
                  <p className="text-muted mt-2 text-sm leading-relaxed">
                    {tSteps(`${step}.body`)}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </Section>

      <Section tone="surface" className="py-12 md:py-16">
        <div className="container-page">
          <h2 className="text-ink text-xl font-semibold">{t('responsibilities.title')}</h2>

          <div className="scroll-x mt-6">
            <table className="w-full min-w-[40rem] border-collapse text-sm">
              <caption className="sr-only">{t('responsibilities.title')}</caption>
              <thead>
                <tr className="border-border border-b">
                  <th
                    scope="col"
                    className="text-muted px-3 py-2.5 text-start text-xs font-semibold tracking-wide uppercase"
                  >
                    {t('timeline.title')}
                  </th>
                  {(['bdoor', 'partner', 'authority', 'customer'] as const).map((role) => (
                    <th
                      key={role}
                      scope="col"
                      className="text-muted px-3 py-2.5 text-start text-xs font-semibold tracking-wide uppercase"
                    >
                      {t(`responsibilities.${role}`)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-border divide-y">
                {RESPONSIBILITIES.map((row) => (
                  <tr key={row.stage}>
                    <th scope="row" className="text-ink px-3 py-3 text-start font-medium">
                      {t(`stages.${row.stage}`)}
                    </th>
                    {(['bdoor', 'partner', 'authority', 'customer'] as const).map((role) => (
                      <td key={role} className="px-3 py-3">
                        {row[role] ? (
                          <Badge tone={role === 'authority' ? 'warning' : 'success'}>
                            {t(`responsibilities.${role}`)}
                          </Badge>
                        ) : (
                          <span className="text-muted" aria-label="—">
                            —
                          </span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <IndependenceDisclosure className="mt-8" />
        </div>
      </Section>

      <Section className="py-12 md:py-16">
        <div className="container-page grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
          <div>
            <h2 className="text-ink text-xl font-semibold">{t('faqTitle')}</h2>
            <Button asChild className="mt-6">
              <Link href={MARKETING_ROUTES.start}>
                {t('cta')}
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </Button>
          </div>
          <FaqList faqs={faqs} locale={locale as Locale} />
        </div>
      </Section>
    </>
  );
}
