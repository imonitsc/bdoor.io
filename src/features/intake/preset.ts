import { BANGLADESH_PACKAGES } from '@/content/packages/catalog';
import type { IntakePreset } from './actions';
import {
  BANGLADESH_OBJECTIVES,
  OBJECTIVES,
  marketScopeFromPreset,
  targetCountryFromSlug,
  type Objective,
} from './questions';

/**
 * Country CTAs land on /start?country=<slug>&objective=<o>&package=<slug>.
 * Every parameter is validated against the question model or the commercial
 * catalog before it becomes an answer — an unknown value is dropped, never
 * echoed anywhere. The rebuilt (validated-only) query string is what gets
 * recorded as the application's source path.
 */
export function presetFromParams(params: {
  [key: string]: string | string[] | undefined;
}): IntakePreset & { redirectTo?: string } {
  const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

  const preset: IntakePreset & { redirectTo?: string } = { answers: {} };
  const query: string[] = [];

  const country = targetCountryFromSlug(first(params.country) ?? '');
  const pkg = first(params.package);
  const validPackage = pkg ? BANGLADESH_PACKAGES.find((p) => p.slug === pkg) : undefined;

  // Hotfix §2: an international country and a Bangladesh package must never
  // be silently merged. Deterministic rule: the package wins — it is the
  // most specific commercial intent a link can carry — and the visitor is
  // redirected to the clean canonical URL so the state matches the address.
  if (validPackage && country && country !== 'bangladesh') {
    preset.redirectTo = `/start?package=${validPackage.slug}`;
    return preset;
  }

  if (country) {
    preset.answers.target_country = country;
    query.push(`country=${country.replace(/_/g, '-')}`);
  }

  const objective = first(params.objective);
  if (objective && (OBJECTIVES as readonly string[]).includes(objective)) {
    preset.answers.objective = objective as Objective;
    query.push(`objective=${objective}`);
  }

  const scope = marketScopeFromPreset(country);
  if (scope) {
    preset.answers.market_scope = scope;
    if (scope === 'bangladesh') {
      preset.answers.target_country = 'bangladesh';
      if (
        preset.answers.objective &&
        !(BANGLADESH_OBJECTIVES as readonly string[]).includes(preset.answers.objective)
      ) {
        delete preset.answers.objective;
      }
    }
  }

  if (validPackage) {
    preset.packageSlug = validPackage.slug;
    query.push(`package=${validPackage.slug}`);
    preset.answers.market_scope = 'bangladesh';
    preset.answers.target_country = 'bangladesh';
    // The package decides the business stage (its catalogue segment), so the
    // flow continues from the first unanswered Bangladesh question rather
    // than re-asking what the link already said.
    if (
      !preset.answers.objective ||
      !(BANGLADESH_OBJECTIVES as readonly string[]).includes(preset.answers.objective)
    ) {
      preset.answers.objective = validPackage.segment === 'existing_business' ? 'existing' : 'new';
    }
  }

  if (query.length > 0) preset.sourcePath = `/start?${query.join('&')}`;
  return preset;
}
