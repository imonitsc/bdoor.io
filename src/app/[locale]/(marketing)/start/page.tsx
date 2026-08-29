import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Section } from '@/components/ui/section';
import { Card } from '@/components/ui/card';
import { Questionnaire } from '@/components/forms/questionnaire';
import { IndependenceDisclosure } from '@/components/layout/disclosure';
import { loadIntake, type IntakePreset } from '@/features/intake/actions';
import { BD_OBJECTIVES, targetCountryFromSlug, type Objective } from '@/features/intake/questions';
import { BANGLADESH_PACKAGES } from '@/content/packages/catalog';
import { localizedUrl } from '@/lib/site';
import type { Locale } from '@/features/catalog/types';

/**
 * Country CTAs land here as /start?country=<slug>&objective=<o>&package=<slug>.
 * Every parameter is validated against the question model or the commercial
 * catalog before it becomes an answer — an unknown value is dropped, never
 * echoed anywhere. The rebuilt (validated-only) query string is what gets
 * recorded as the application's source path.
 */
function presetFromParams(params: { [key: string]: string | string[] | undefined }): IntakePreset {
  const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

  const preset: IntakePreset = { answers: {} };
  const query: string[] = [];

  // ?country= seeds the branch, not just a value: bangladesh answers the
  // opening location question alone; an international slug answers it AND
  // the country question the "outside" branch would ask next.
  const country = targetCountryFromSlug(first(params.country) ?? '');
  if (country === 'bangladesh') {
    preset.answers.business_location = 'bangladesh';
    query.push('country=bangladesh');
  } else if (country) {
    preset.answers.business_location = 'outside';
    preset.answers.target_country = country;
    query.push(`country=${country.replace(/_/g, '-')}`);
  }

  // The objective question exists only on the Bangladesh branch.
  const objective = first(params.objective);
  if (
    country === 'bangladesh' &&
    objective &&
    (BD_OBJECTIVES as readonly string[]).includes(objective)
  ) {
    preset.answers.objective = objective as Objective;
    query.push(`objective=${objective}`);
  }

  const pkg = first(params.package);
  if (pkg && BANGLADESH_PACKAGES.some((p) => p.slug === pkg)) {
    preset.packageSlug = pkg;
    query.push(`package=${pkg}`);
  }

  if (query.length > 0) preset.sourcePath = `/start?${query.join('&')}`;
  return preset;
}

/**
 * The questionnaire renders the visitor's own saved draft, so it is
 * per-request by definition and must never be prerendered or shared-cached.
 */
export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'start' });
  return {
    title: t('title'),
    description: t('description'),
    alternates: {
      canonical: localizedUrl(locale as Locale, '/start'),
      languages: { en: localizedUrl('en', '/start'), 'bn-BD': localizedUrl('bn', '/start') },
    },
    // The questionnaire holds a draft of the visitor's answers; it must not be
    // cached anywhere shared.
    robots: { index: true, follow: true, nocache: true },
  };
}

export default async function StartPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const preset = presetFromParams(await searchParams);
  const [t, initial] = await Promise.all([getTranslations('start'), loadIntake(preset)]);

  return (
    <Section className="py-10 md:py-14">
      <div className="container-page">
        <div className="mx-auto max-w-3xl">
          <h1 className="text-ink text-3xl leading-tight md:text-4xl">{t('title')}</h1>
          <p className="text-muted mt-3 text-base leading-relaxed">{t('description')}</p>

          <Card className="mt-8 p-5 md:p-8">
            <Questionnaire initial={initial} />
          </Card>

          <div className="mt-8">
            <IndependenceDisclosure />
          </div>
        </div>
      </div>
    </Section>
  );
}
