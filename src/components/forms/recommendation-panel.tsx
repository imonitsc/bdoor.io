'use client';

import { useLocale, useTranslations } from 'next-intl';
import { AlertTriangle, ArrowRight, CircleCheck, HelpCircle, UserCheck } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { Alert } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { MARKETING_ROUTES } from '@/lib/navigation';
import { localized, MANUAL_REVIEW_REASONS, STRUCTURE_LABELS } from '@/features/intake/recommendation-copy';
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
        <h2 className="mt-3 text-2xl font-semibold text-ink">{t('title')}</h2>
      </div>

      <Alert tone="warning">{t('disclaimer')}</Alert>

      {recommendation.requiresManualReview ? (
        <Card className="border-warning/30 bg-warning-soft p-5">
          <h3 className="flex items-center gap-2 text-base font-semibold text-ink">
            <UserCheck className="size-5 text-warning" aria-hidden="true" />
            {t('manualReviewTitle')}
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-ink/85">{t('manualReviewBody')}</p>
          <ul className="mt-3 flex flex-col gap-2">
            {recommendation.manualReviewReasons.map((reason) => (
              <li key={reason} className="flex gap-2.5 text-sm text-ink">
                <span className="mt-2 size-1.5 shrink-0 rounded-full bg-warning" aria-hidden="true" />
                <span>{localized(MANUAL_REVIEW_REASONS, reason, locale) ?? reason}</span>
              </li>
            ))}
          </ul>
        </Card>
      ) : null}

      {structureLabel ? (
        <section>
          <h3 className="text-base font-semibold text-ink">{t('structureTitle')}</h3>
          <p className="mt-2 text-sm text-ink">{structureLabel}</p>
        </section>
      ) : null}

      <section>
        <h3 className="text-base font-semibold text-ink">{t('servicesTitle')}</h3>
        {recommendation.serviceSlugs.length === 0 ? (
          <p className="mt-2 text-sm text-muted">{t('noServices')}</p>
        ) : (
          <ul className="mt-3 flex flex-col gap-2">
            {recommendation.serviceSlugs.map((slug) => (
              <li key={slug}>
                <Link
                  href={`/services/${slug}`}
                  className="flex items-center justify-between gap-3 rounded-[var(--radius-control)] border border-border bg-surface px-4 py-3 text-sm text-ink transition-colors hover:bg-surface-sunken focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus)]"
                >
                  <span className="flex items-center gap-2.5">
                    <CircleCheck className="size-4 shrink-0 text-accent" aria-hidden="true" />
                    {slug.replace(/-/g, ' ')}
                  </span>
                  <span className="shrink-0 text-xs text-muted">{tServices('viewService')}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {recommendation.assumptions.length > 0 ? (
        <section>
          <h3 className="text-base font-semibold text-ink">{t('assumptionsTitle')}</h3>
          <ul className="mt-3 flex flex-col gap-2">
            {recommendation.assumptions.map((assumption) => (
              <li key={assumption} className="flex gap-2.5 text-sm leading-relaxed text-muted">
                <span className="mt-2 size-1.5 shrink-0 rounded-full bg-border-strong" aria-hidden="true" />
                <span>{assumption}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {recommendation.partnerQuestions.length > 0 ? (
        <section>
          <h3 className="flex items-center gap-2 text-base font-semibold text-ink">
            <HelpCircle className="size-4 text-muted" aria-hidden="true" />
            {t('questionsTitle')}
          </h3>
          <ul className="mt-3 flex flex-col gap-2">
            {recommendation.partnerQuestions.map((question) => (
              <li key={question} className="flex gap-2.5 text-sm leading-relaxed text-muted">
                <span className="mt-2 size-1.5 shrink-0 rounded-full bg-accent" aria-hidden="true" />
                <span>{question}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <div className="flex flex-wrap gap-3 border-t border-border pt-6">
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
