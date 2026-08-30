import 'server-only';

import { cookies } from 'next/headers';
import { createAdminClient, hasServiceRole } from '@/lib/supabase/admin';
import { sha256 } from '@/lib/utils/hash';
import { logger } from '@/lib/logger';
import { getEmailProvider } from '@/lib/email';
import { recordAnalyticsEvent } from '@/lib/analytics';
import {
  APPLICATION_STEPS,
  PROVIDER_TERMS_VERSION,
  commaToList,
  linesToList,
  newProviderApplicationReference,
  type ApplicationDraftValues,
  type ApplicationStepKey,
  type ProviderApplicationStatus,
  type StepValues,
} from './application';

/**
 * Provider-application drafts (portals spec §7).
 *
 * Same trust model as the questionnaire drafts: no account is required to
 * apply, so the draft is keyed by a high-entropy value in an httpOnly cookie
 * and only its SHA-256 is stored. The table has no anon/authenticated write
 * policy at all — every read and write goes through this module with the
 * service role after the cookie has been checked, so a stolen key cannot be
 * replayed against the Data API.
 */

const APPLY_COOKIE = 'bdoor_provider_apply';
const APPLY_MAX_AGE = 60 * 60 * 24 * 60; // resumable for 60 days

export type ProviderDraft = {
  id: string;
  reference: string;
  status: ProviderApplicationStatus;
  values: ApplicationDraftValues;
  informationRequest: string | null;
  submittedAt: string | null;
};

async function readKey(): Promise<string | null> {
  const store = await cookies();
  return store.get(APPLY_COOKIE)?.value ?? null;
}

async function writeKey(key: string): Promise<void> {
  const store = await cookies();
  store.set(APPLY_COOKIE, key, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: APPLY_MAX_AGE,
  });
}

export async function clearProviderDraftKey(): Promise<void> {
  const store = await cookies();
  store.delete(APPLY_COOKIE);
}

type Row = {
  id: string;
  reference: string;
  status: string;
  legal_name: string;
  trading_name: string | null;
  registration_no: string | null;
  established_on: string | null;
  firm_category: string;
  registered_address: string | null;
  operating_address: string | null;
  website: string | null;
  official_email_domain: string | null;
  contact_name: string;
  contact_email: string;
  contact_phone: string | null;
  signatory_name: string | null;
  owners: unknown;
  related_entities_note: string | null;
  sanctions_declaration: boolean;
  integrity_declaration: boolean;
  regulator_name: string | null;
  licence_no: string | null;
  licence_expires_on: string | null;
  disciplinary_declaration: boolean;
  indemnity_insurer: string | null;
  indemnity_expires_on: string | null;
  requested_categories: string[];
  jurisdictions: string[];
  services_note: string | null;
  languages: string[];
  turnaround_note: string | null;
  capacity_note: string | null;
  fee_note: string | null;
  conflict_process_note: string | null;
  complaint_process_note: string | null;
  security_note: string | null;
  retention_note: string | null;
  subcontractors_note: string | null;
  continuity_note: string | null;
  information_request: string | null;
  submitted_at: string | null;
};

const ROW_COLUMNS =
  'id, reference, status, legal_name, trading_name, registration_no, established_on, ' +
  'firm_category, registered_address, operating_address, website, official_email_domain, ' +
  'contact_name, contact_email, contact_phone, signatory_name, owners, related_entities_note, ' +
  'sanctions_declaration, integrity_declaration, regulator_name, licence_no, licence_expires_on, ' +
  'disciplinary_declaration, indemnity_insurer, indemnity_expires_on, requested_categories, ' +
  'jurisdictions, services_note, languages, turnaround_note, capacity_note, fee_note, ' +
  'conflict_process_note, complaint_process_note, security_note, retention_note, ' +
  'subcontractors_note, continuity_note, information_request, submitted_at';

function rowToDraft(row: Row): ProviderDraft {
  const owners = Array.isArray(row.owners) ? (row.owners as string[]).join('\n') : '';
  return {
    id: row.id,
    reference: row.reference,
    status: row.status as ProviderApplicationStatus,
    informationRequest: row.information_request,
    submittedAt: row.submitted_at,
    values: {
      firm: {
        legal_name: row.legal_name || undefined,
        trading_name: row.trading_name ?? undefined,
        registration_no: row.registration_no ?? undefined,
        established_on: row.established_on ?? undefined,
        firm_category: (row.firm_category || undefined) as never,
        registered_address: row.registered_address ?? undefined,
        operating_address: row.operating_address ?? undefined,
        website: row.website ?? undefined,
        official_email_domain: row.official_email_domain ?? undefined,
        contact_name: row.contact_name || undefined,
        contact_email: row.contact_email || undefined,
        contact_phone: row.contact_phone ?? undefined,
        signatory_name: row.signatory_name ?? undefined,
      },
      ownership: {
        owners_text: owners || undefined,
        related_entities_note: row.related_entities_note ?? undefined,
        sanctions_declaration: (row.sanctions_declaration || undefined) as true | undefined,
        integrity_declaration: (row.integrity_declaration || undefined) as true | undefined,
      },
      standing: {
        regulator_name: row.regulator_name ?? undefined,
        licence_no: row.licence_no ?? undefined,
        licence_expires_on: row.licence_expires_on ?? undefined,
        disciplinary_declaration: (row.disciplinary_declaration || undefined) as true | undefined,
        indemnity_insurer: row.indemnity_insurer ?? undefined,
        indemnity_expires_on: row.indemnity_expires_on ?? undefined,
      },
      services: {
        requested_categories: row.requested_categories as never,
        jurisdictions: row.jurisdictions as never,
        services_note: row.services_note ?? undefined,
        languages_text: row.languages.length > 0 ? row.languages.join(', ') : undefined,
        turnaround_note: row.turnaround_note ?? undefined,
        capacity_note: row.capacity_note ?? undefined,
        fee_note: row.fee_note ?? undefined,
      },
      controls: {
        conflict_process_note: row.conflict_process_note ?? undefined,
        complaint_process_note: row.complaint_process_note ?? undefined,
        security_note: row.security_note ?? undefined,
        retention_note: row.retention_note ?? undefined,
        subcontractors_note: row.subcontractors_note ?? undefined,
        continuity_note: row.continuity_note ?? undefined,
      },
    },
  };
}

export async function getProviderDraft(): Promise<ProviderDraft | null> {
  if (!hasServiceRole()) return null;
  const key = await readKey();
  if (!key) return null;

  const admin = createAdminClient();
  const { data } = await admin
    .from('provider_applications')
    .select(ROW_COLUMNS)
    .eq('resume_key_hash', sha256(key))
    .maybeSingle();
  return data ? rowToDraft(data as unknown as Row) : null;
}

export async function ensureProviderDraft(locale: 'en' | 'bn'): Promise<ProviderDraft | null> {
  if (!hasServiceRole()) return null;
  const existing = await getProviderDraft();
  if (existing) return existing;

  const admin = createAdminClient();
  const key = crypto.randomUUID().replace(/-/g, '') + crypto.randomUUID().replace(/-/g, '');

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const reference = newProviderApplicationReference();
    const { data, error } = await admin
      .from('provider_applications')
      .insert({ reference, locale, resume_key_hash: sha256(key) })
      .select(ROW_COLUMNS)
      .single();
    if (!error && data) {
      await writeKey(key);
      return rowToDraft(data as unknown as Row);
    }
    if (error?.code !== '23505') {
      logger.error('provider_application.create_failed', {
        code: error?.code,
        message: error?.message,
      });
      return null;
    }
  }
  return null;
}

/** Maps validated step values onto their allow-listed columns — nothing else. */
function stepToColumns(step: ApplicationStepKey, values: StepValues<ApplicationStepKey>) {
  switch (step) {
    case 'firm': {
      const v = values as StepValues<'firm'>;
      return {
        legal_name: v.legal_name,
        trading_name: v.trading_name ?? null,
        registration_no: v.registration_no ?? null,
        established_on: v.established_on ?? null,
        firm_category: v.firm_category,
        registered_address: v.registered_address,
        operating_address: v.operating_address ?? null,
        website: v.website ?? null,
        official_email_domain: v.official_email_domain ?? null,
        contact_name: v.contact_name,
        contact_email: v.contact_email,
        contact_phone: v.contact_phone ?? null,
        signatory_name: v.signatory_name,
      };
    }
    case 'ownership': {
      const v = values as StepValues<'ownership'>;
      return {
        owners: linesToList(v.owners_text) as never,
        related_entities_note: v.related_entities_note ?? null,
        sanctions_declaration: v.sanctions_declaration,
        integrity_declaration: v.integrity_declaration,
      };
    }
    case 'standing': {
      const v = values as StepValues<'standing'>;
      return {
        regulator_name: v.regulator_name,
        licence_no: v.licence_no,
        licence_expires_on: v.licence_expires_on ?? null,
        disciplinary_declaration: v.disciplinary_declaration,
        indemnity_insurer: v.indemnity_insurer ?? null,
        indemnity_expires_on: v.indemnity_expires_on ?? null,
      };
    }
    case 'services': {
      const v = values as StepValues<'services'>;
      return {
        requested_categories: v.requested_categories,
        jurisdictions: v.jurisdictions,
        services_note: v.services_note,
        languages: commaToList(v.languages_text),
        turnaround_note: v.turnaround_note ?? null,
        capacity_note: v.capacity_note ?? null,
        fee_note: v.fee_note ?? null,
      };
    }
    case 'controls': {
      const v = values as StepValues<'controls'>;
      return {
        conflict_process_note: v.conflict_process_note,
        complaint_process_note: v.complaint_process_note,
        security_note: v.security_note ?? null,
        retention_note: v.retention_note ?? null,
        subcontractors_note: v.subcontractors_note ?? null,
        continuity_note: v.continuity_note ?? null,
      };
    }
    case 'declarations':
      // Declarations are only recorded by submitProviderDraft, atomically
      // with the status change; there is nothing to save incrementally.
      return {};
  }
}

/** True when the draft may still be edited by the applicant. */
export function draftIsEditable(status: ProviderApplicationStatus): boolean {
  return status === 'draft' || status === 'needs_information';
}

export async function saveProviderStep(
  step: ApplicationStepKey,
  values: StepValues<ApplicationStepKey>,
): Promise<boolean> {
  const draft = await getProviderDraft();
  if (!draft || !draftIsEditable(draft.status)) return false;

  const admin = createAdminClient();
  const { error } = await admin
    .from('provider_applications')
    .update(stepToColumns(step, values))
    .eq('id', draft.id);
  if (error) {
    logger.error('provider_application.save_failed', { step, code: error.code });
    return false;
  }
  return true;
}

export async function submitProviderDraft(): Promise<
  { ok: true; reference: string } | { ok: false; reason: 'incomplete' | 'unavailable' }
> {
  const draft = await getProviderDraft();
  if (!draft || !draftIsEditable(draft.status)) return { ok: false, reason: 'unavailable' };

  // Every step except declarations must already be persisted and valid.
  const { STEP_SCHEMAS } = await import('./application');
  for (const step of APPLICATION_STEPS) {
    if (step === 'declarations') continue;
    const parsed = STEP_SCHEMAS[step].safeParse(draft.values[step] ?? {});
    if (!parsed.success) return { ok: false, reason: 'incomplete' };
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from('provider_applications')
    .update({
      status: 'submitted',
      submitted_at: new Date().toISOString(),
      declarations_accepted_at: new Date().toISOString(),
      terms_version: PROVIDER_TERMS_VERSION,
    })
    .eq('id', draft.id)
    .in('status', ['draft', 'needs_information']);
  if (error) {
    logger.error('provider_application.submit_failed', { code: error.code });
    return { ok: false, reason: 'unavailable' };
  }

  const email = draft.values.firm?.contact_email;
  if (email) {
    try {
      await getEmailProvider().send({
        to: email,
        subject: `bdoor provider application received — ${draft.reference}`,
        template: 'provider-application-received',
        locale: 'en',
        text:
          `Thank you for applying to join the bdoor provider network.\n\n` +
          `Your reference is ${draft.reference}. Our partner team reviews every ` +
          `application and will contact you at this address; verification of ` +
          `credentials happens before any approval. No fee is payable to apply.\n\n` +
          `bdoor compliance ltd.`,
      });
    } catch (error) {
      logger.warn('provider_application.ack_failed', {
        message: error instanceof Error ? error.message : 'unknown',
      });
    }
  }

  logger.info('provider_application.submitted', { reference: draft.reference });
  await recordAnalyticsEvent({
    event: 'provider_application_submitted',
    idempotencyKey: `provider_application_submitted:${draft.id}`,
    actorEmail: email ?? null,
    properties: { reference: draft.reference },
  });
  return { ok: true, reference: draft.reference };
}
