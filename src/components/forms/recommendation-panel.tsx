'use client';

import { useLocale, useTranslations } from 'next-intl';
import { AlertTriangle, ArrowRight, CircleCheck, HelpCircle, UserCheck } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { Alert } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { MARKETING_ROUTES } from '@/lib/navigation';
import {
  localized,
  MANUAL_REVIEW_REASONS,
  STRUCTURE_LABELS,
} from '@/features/intake/recommendation-copy';
import { useIsSignedIn } from '@/features/auth/use-is-signed-in';
import type { Recommendation } from '@/features/intake/rules';

/**
 * The preliminary recommendation.
 *
 * Everything here is explicitly labelled as preliminary and subject to review.
 * The disclaimer is rendered above the recommendation, not buried under it.
 */
export function RecommendationPanel({ recommendation }: { recommendation: Recommendation }) {
  const t = useTranslations('start.recommendation');
  const tServices = useTranslations('services');
  const tCommon = useTranslations('common');
  const locale = useLocale();
  const signedIn = useIsSignedIn();

  const structureLabel = recommendation.suggestedStructure
    ? localized(STRUCTURE_LABELS, recommendation.suggestedStructure, locale)
    : null;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Badge tone="warning" icon={<AlertTriangle className="size-3" />}>
          {t('preliminaryBadge')}
        </Badge>
        <h2 className="text-ink mt-3 text-2xl font-semibold">{t('title')}</h2>
      </div>

      <Alert tone="warning">{t('disclaimer')}</Alert>

      {recommendation.requiresManualReview ? (
        <Card className="border-warning/30 bg-warning-soft p-5">
          <h3 className="text-ink flex items-center gap-2 text-base font-semibold">
            <UserCheck className="text-warning size-5" aria-hidden="true" />
            {t('manualReviewTitle')}
          </h3>
          <p className="text-ink/85 mt-2 text-sm leading-relaxed">{t('manualReviewBody')}</p>
          <ul className="mt-3 flex flex-col gap-2">
            {recommendation.manualReviewReasons.map((reason) => (
              <li key={reason} className="text-ink flex gap-2.5 text-sm">
                <span
                  className="bg-warning mt-2 size-1.5 shrink-0 rounded-full"
                  aria-hidden="true"
                />
                <span>{localized(MANUAL_REVIEW_REASONS, reason, locale) ?? reason}</span>
              </li>
            ))}
          </ul>
        </Card>
      ) : null}

      {structureLabel ? (
        <section>
          <h3 className="text-ink text-base font-semibold">{t('structureTitle')}</h3>
          <p className="text-ink mt-2 text-sm">{structureLabel}</p>
        </section>
      ) : null}

      <section>
        <h3 className="text-ink text-base font-semibold">{t('servicesTitle')}</h3>
        {recommendation.serviceSlugs.length === 0 ? (
          <p className="text-muted mt-2 text-sm">{t('noServices')}</p>
        ) : (
          <ul className="mt-3 flex flex-col gap-2">
            {recommendation.serviceSlugs.map((slug) => (
              <li key={slug}>
                <Link
                  href={`/services/${slug}`}
                  className="border-border bg-surface text-ink hover:bg-surface-sunken flex items-center justify-between gap-3 rounded-[var(--radius-control)] border px-4 py-3 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus)]"
                >
                  <span className="flex items-center gap-2.5">
                    <CircleCheck className="text-accent size-4 shrink-0" aria-hidden="true" />
                    {slug.replace(/-/g, ' ')}
                  </span>
                  <span className="text-muted shrink-0 text-xs">{tServices('viewService')}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {recommendation.assumptions.length > 0 ? (
        <section>
          <h3 className="text-ink text-base font-semibold">{t('assumptionsTitle')}</h3>
          <ul className="mt-3 flex flex-col gap-2">
            {recommendation.assumptions.map((assumption) => (
              <li key={assumption} className="text-muted flex gap-2.5 text-sm leading-relaxed">
                <span
                  className="bg-border-strong mt-2 size-1.5 shrink-0 rounded-full"
                  aria-hidden="true"
                />
                <span>{assumption}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {recommendation.partnerQuestions.length > 0 ? (
        <section>
          <h3 className="text-ink flex items-center gap-2 text-base font-semibold">
            <HelpCircle className="text-muted size-4" aria-hidden="true" />
            {t('questionsTitle')}
          </h3>
          <ul className="mt-3 flex flex-col gap-2">
            {recommendation.partnerQuestions.map((question) => (
              <li key={question} className="text-muted flex gap-2.5 text-sm leading-relaxed">
                <span
                  className="bg-accent mt-2 size-1.5 shrink-0 rounded-full"
                  aria-hidden="true"
                />
                <span>{question}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <div className="border-border flex flex-wrap gap-3 border-t pt-6">
        <Button asChild size="lg">
          <Link href={signedIn ? '/app' : `${MARKETING_ROUTES.signup}?from=start`}>
            {signedIn ? t('continueCta') : t('createAccountCta')}
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </Button>
        <Button asChild size="lg" variant="secondary">
          <Link href={MARKETING_ROUTES.contact}>{tCommon('learnMore')}</Link>
        </Button>
      </div>
    </div>
  );
}
