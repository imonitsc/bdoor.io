'use server';

import { headers } from 'next/headers';
import { enforceRateLimit } from '@/lib/rate-limit';
import { RateLimitError } from '@/lib/permissions/errors';
import { providerApplicationsStatus } from '@/lib/launch/gates';
import { hasServiceRole } from '@/lib/supabase/admin';
import {
  APPLICATION_STEPS,
  STEP_SCHEMAS,
  type ApplicationDraftValues,
  type ApplicationStepKey,
  type ProviderApplicationStatus,
} from './application';
import {
  draftIsEditable,
  ensureProviderDraft,
  getProviderDraft,
  saveProviderStep,
  submitProviderDraft,
} from './application-session';

/**
 * Server actions for /partners/apply. The PROVIDER_APPLICATIONS_STATUS gate
 * is enforced here — on the server, on every action — not just by hiding the
 * form. Everything the client sends is re-validated by the shared schemas,
 * and the columns written are allow-listed in application-session.ts.
 */

export type ProviderApplyState = {
  enabled: boolean;
  /** False when no database is configured — the form warns nothing persists. */
  storeAvailable: boolean;
  reference?: string;
  status?: ProviderApplicationStatus;
  values?: ApplicationDraftValues;
  informationRequest?: string | null;
};

async function limiterKey(): Promise<string> {
  const headerList = await headers();
  return (headerList.get('x-forwarded-for') ?? '').split(',')[0]?.trim() || 'unknown';
}

export async function loadProviderApplication(): Promise<ProviderApplyState> {
  const enabled = providerApplicationsStatus() === 'enabled';
  if (!enabled) return { enabled, storeAvailable: hasServiceRole() };

  const draft = await getProviderDraft();
  if (!draft) return { enabled, storeAvailable: hasServiceRole() };
  return {
    enabled,
    storeAvailable: true,
    reference: draft.reference,
    status: draft.status,
    values: draft.values,
    informationRequest: draft.informationRequest,
  };
}

export type StepSaveResult =
  | { ok: true }
  | {
      ok: false;
      error: 'closed' | 'rateLimited' | 'unavailable' | 'validation';
      fields?: Record<string, string>;
    };

export async function saveProviderApplicationStep(
  step: string,
  payload: unknown,
): Promise<StepSaveResult> {
  if (providerApplicationsStatus() !== 'enabled') return { ok: false, error: 'closed' };
  if (!(APPLICATION_STEPS as readonly string[]).includes(step)) {
    return { ok: false, error: 'validation' };
  }
  const stepKey = step as ApplicationStepKey;

  try {
    await enforceRateLimit('provider_application.save', await limiterKey());
  } catch (error) {
    if (error instanceof RateLimitError) return { ok: false, error: 'rateLimited' };
    throw error;
  }

  const parsed = STEP_SCHEMAS[stepKey].safeParse(payload);
  if (!parsed.success) {
    const fields: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? '');
      if (key && !fields[key]) fields[key] = issue.message;
    }
    return { ok: false, error: 'validation', fields };
  }

  if (!hasServiceRole()) {
    // Degraded mode: the visitor can still walk the form; nothing persists
    // and the page says so. Treat the step as accepted so the flow works.
    return { ok: true };
  }

  const draft = (await getProviderDraft()) ?? (await ensureProviderDraft('en'));
  if (!draft || !draftIsEditable(draft.status)) return { ok: false, error: 'unavailable' };

  const saved = await saveProviderStep(stepKey, parsed.data);
  return saved ? { ok: true } : { ok: false, error: 'unavailable' };
}

export type SubmitResult =
  | { ok: true; reference: string; stored: boolean }
  | { ok: false; error: 'closed' | 'rateLimited' | 'incomplete' | 'unavailable' };

export async function submitProviderApplication(): Promise<SubmitResult> {
  if (providerApplicationsStatus() !== 'enabled') return { ok: false, error: 'closed' };

  try {
    await enforceRateLimit('provider_application.submit', await limiterKey());
  } catch (error) {
    if (error instanceof RateLimitError) return { ok: false, error: 'rateLimited' };
    throw error;
  }

  if (!hasServiceRole()) {
    // Nothing can be stored; the UI shows the degraded notice instead of a
    // fabricated reference.
    return { ok: false, error: 'unavailable' };
  }

  const result = await submitProviderDraft();
  if (!result.ok) return { ok: false, error: result.reason };
  return { ok: true, reference: result.reference, stored: true };
}
