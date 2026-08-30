import 'server-only';

import {
  COMMERCIAL_REVIEW_DATE,
  INTERNATIONAL_OFFERS,
  activePackageVersion,
  publishedPackages,
} from '@/content/packages/catalog';
import { computeLayerTotals } from '@/features/packages/pricing';
import type { InternationalOffer, PackageCurrency } from '@/features/packages/types';

/**
 * Live structured records for the assistant.
 *
 * Prices, inclusions and fee splits are read from the same catalog the pricing
 * pages render, never from an embedded paragraph. An embedded paragraph is a
 * photograph of a price on the day it was indexed; this is the price. The
 * system prompt tells Claude to prefer these records whenever the two disagree.
 *
 * What is deliberately NOT here is as important as what is. The domain types
 * mark several fields as internal — an international route's `status`,
 * `availability` and `feeComponents`, and any price at all before
 * `priceApproved` — and this module is the boundary that keeps them out of a
 * prompt. Anything that reaches this function can reach the customer, so only
 * fields the public pricing page already renders are included.
 */

function formatMinor(minor: number, currency: PackageCurrency): string {
  return `${currency} ${(minor / 100).toLocaleString('en-US')}`;
}

/** Bangladesh packages, with the fee split stated on every line. */
function bangladeshRecords(): string[] {
  const lines: string[] = [];

  for (const pkg of publishedPackages()) {
    const version = activePackageVersion(pkg);
    if (!version) continue;

    const parts: string[] = [`PACKAGE ${pkg.slug}: ${pkg.name.en} (${version.publicLabel.en})`];

    if (version.priceType === 'quote_required') {
      parts.push('price: quote required, no published figure');
    } else {
      const totals = computeLayerTotals(version.feeComponents);
      const currency = version.feeComponents[0]?.currency ?? 'BDT';
      const qualifier =
        version.priceType === 'from'
          ? 'from '
          : version.priceType === 'estimated'
            ? 'estimated '
            : '';

      // The fee split is the single most misquoted thing about this product,
      // so each layer is named separately rather than rolled into one total.
      parts.push(`bdoor professional fee: ${qualifier}${formatMinor(totals.bdoorMinor, currency)}`);
      parts.push(`published price statement: ${version.publicLabel.en}`);
      if (totals.governmentMinor > 0) {
        parts.push(
          `government fees (estimate, paid to the authority, not to bdoor): ${formatMinor(totals.governmentMinor, currency)}`,
        );
      } else {
        // The catalogue prices bdoor's own work only; the authority's schedule
        // is not carried here. Saying so explicitly matters more than saying
        // nothing: silence reads as "included", which is the single most
        // expensive misunderstanding this product has.
        parts.push(
          'government fees: not included in the figure above and not published here — they are set by the authority, paid to the authority, and confirmed in your quotation',
        );
      }
      if (totals.partnerMinor > 0) {
        parts.push(
          `independent professional fee (paid to the firm, not to bdoor): ${formatMinor(totals.partnerMinor, currency)}`,
        );
      }
      if (totals.thirdPartyMinor > 0) {
        parts.push(`third-party costs: ${formatMinor(totals.thirdPartyMinor, currency)}`);
      }
      parts.push(`indicative total: ${formatMinor(totals.estimatedTotalMinor, currency)}`);
    }

    if (version.inclusions.length) {
      parts.push(`includes: ${version.inclusions.map((i) => i.en).join('; ')}`);
    }
    if (version.exclusions.length) {
      parts.push(`excludes: ${version.exclusions.map((i) => i.en).join('; ')}`);
    }
    if (version.limits.length) {
      parts.push(`limits: ${version.limits.map((i) => i.en).join('; ')}`);
    }
    if (version.assumptions.length) {
      parts.push(`assumptions: ${version.assumptions.map((i) => i.en).join('; ')}`);
    }

    lines.push(parts.join(' | '));
  }

  return lines;
}

/**
 * One international route, public fields only.
 *
 * `priceApproved` gates the figure and `publicQualifier` travels with it,
 * because a starting estimate quoted without its qualifier is the thing the
 * type comment warns about. Internal readiness never appears.
 */
function internationalRecord(offer: InternationalOffer): string {
  const parts = [
    `INTERNATIONAL ${offer.countrySlug}: ${offer.route.en}`,
    `what a customer can do now: ${offer.publicStatus.replace(/_/g, ' ')}`,
    offer.summary.en,
  ];

  if (offer.priceApproved && offer.publicLabel) {
    const qualifier = offer.publicQualifier?.en ? ` (${offer.publicQualifier.en})` : '';
    parts.push(`published starting estimate: ${offer.publicLabel.en}${qualifier}`);
    if (offer.publicLabelAlt?.en) parts.push(`approximately ${offer.publicLabelAlt.en}`);
  } else {
    parts.push('no published price: a figure exists only after a specialist review');
  }

  if (offer.disclosures.length) {
    parts.push(`disclosures: ${offer.disclosures.map((d) => d.en).join('; ')}`);
  }
  parts.push(
    'delivered under a separate engagement by an approved country specialist, not by bdoor directly',
  );

  return parts.join(' | ');
}

const COUNTRY_SLUGS: Record<string, string> = {
  us: 'united-states',
  gb: 'united-kingdom',
  ae: 'united-arab-emirates',
  sg: 'singapore',
  sa: 'saudi-arabia',
  qa: 'qatar',
};

/**
 * The structured block for one question. Bangladesh always contributes its
 * package table — a customer asking about Dubai still needs to know what bdoor
 * does at home — and a selected international country adds its own route.
 */
export function structuredRecordsFor(country: string): string {
  const records = [...bangladeshRecords()];

  const slug = COUNTRY_SLUGS[country];
  if (slug) {
    for (const offer of INTERNATIONAL_OFFERS) {
      if (offer.countrySlug === slug) records.push(internationalRecord(offer));
    }
  }

  if (records.length === 0) return '';

  return [
    `(bdoor commercial catalogue, last reviewed ${COMMERCIAL_REVIEW_DATE})`,
    ...records.map((line) => `- ${line}`),
  ].join('\n');
}

/** Cited beside any answer that quoted a price from the records above. */
export const STRUCTURED_SOURCE = {
  title: 'bdoor package catalogue',
  url: '/pricing',
  lastReviewed: COMMERCIAL_REVIEW_DATE,
} as const;
