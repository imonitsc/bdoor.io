'use server';

import { revalidatePath } from 'next/cache';
import { createHash } from 'node:crypto';
import { headers } from 'next/headers';
import { getLocale } from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';
import { requireSession } from '@/lib/auth/session';
import { enforceRateLimit } from '@/lib/rate-limit';
import { hashIdentifier } from '@/lib/utils/hash';
import { RateLimitError } from '@/lib/permissions/errors';
import { recordAudit } from '@/lib/audit';
import { getMalwareScanner } from '@/lib/malware';
import { logger } from '@/lib/logger';
import { validateUpload } from './validation';

export type UploadState = {
  status: 'idle' | 'error' | 'success';
  message?: string;
  documentId?: string;
};

/** Bucket chosen from the document category, never from the client. */
function bucketFor(category: string): string {
  switch (category) {
    case 'identity':
    case 'address_proof':
    case 'photo':
    case 'signature':
      return 'identity-documents';
    case 'official_record':
    case 'receipt':
      return 'official-records';
    default:
      return 'case-documents';
  }
}

function retentionFor(category: string): string {
  switch (category) {
    case 'identity':
    case 'address_proof':
      return 'aml_record';
    case 'receipt':
    case 'financial':
      return 'financial_record';
    default:
      return 'standard';
  }
}

/**
 * Uploads a document.
 *
 * Order matters: validate the bytes, create the row, derive the canonical
 * storage path from ids the server controls, upload, then record the version.
 * The client never chooses the bucket or the path, so it cannot write into
 * another organization's prefix even if it forges every field it does control.
 */
export async function uploadDocument(
  _previous: UploadState,
  formData: FormData,
): Promise<UploadState> {
  const session = await requireSession();

  try {
    await enforceRateLimit('document.upload', hashIdentifier(session.userId));
  } catch (error) {
    if (error instanceof RateLimitError) return { status: 'error', message: 'rateLimited' };
    throw error;
  }

  const file = formData.get('file');
  const caseId = String(formData.get('caseId') ?? '') || null;
  const requestId = String(formData.get('requestId') ?? '') || null;
  const organizationId = String(formData.get('organizationId') ?? '');
  const title = String(formData.get('title') ?? '').trim();

  if (!(file instanceof File) || !organizationId) {
    return { status: 'error', message: 'noFile' };
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  const validation = validateUpload({
    bytes: bytes.slice(0, 32),
    declaredMimeType: file.type,
    fileName: file.name,
    byteSize: bytes.byteLength,
  });

  if (!validation.ok) {
    return { status: 'error', message: `upload.${validation.failure.code}` };
  }

  const supabase = await createClient();

  // The request tells us what kind of document this is; falling back to 'other'
  // keeps an ad-hoc upload out of the identity bucket.
  let category = 'other';
  if (requestId) {
    const { data } = await supabase
      .from('document_requests')
      .select('category, case_id')
      .eq('id', requestId)
      .maybeSingle();
    if (data) category = data.category;
  }

  const bucket = bucketFor(category);

  const { data: document, error: documentError } = await supabase
    .from('documents')
    .insert({
      organization_id: organizationId,
      case_id: caseId,
      request_id: requestId,
      bucket_id: bucket,
      title: title || validation.safeFileName,
      category,
      visibility: 'customer',
      status: 'uploaded',
      current_version: 1,
      retention_category: retentionFor(category),
      uploaded_by: session.userId,
      uploaded_by_org_id: organizationId,
    })
    .select('id')
    .single();

  if (documentError || !document) {
    logger.error('document.insert_failed', { message: documentError?.message });
    return { status: 'error', message: 'generic' };
  }

  // Canonical, server-generated path. Mirrors app.canonical_document_path().
  const storagePath = `org/${organizationId}/case/${caseId ?? 'none'}/doc/${document.id}/v1.${validation.extension}`;

  const { error: storageError } = await supabase.storage
    .from(bucket)
    .upload(storagePath, bytes, { contentType: validation.mimeType, upsert: false });

  if (storageError) {
    logger.error('document.storage_failed', { message: storageError.message });
    await supabase.from('documents').delete().eq('id', document.id);
    return { status: 'error', message: 'generic' };
  }

  const checksum = createHash('sha256').update(bytes).digest('hex');
  const scan = await getMalwareScanner().scan({
    storagePath,
    byteSize: bytes.byteLength,
    mimeType: validation.mimeType,
  });

  const { error: versionError } = await supabase.from('document_versions').insert({
    document_id: document.id,
    version_no: 1,
    storage_path: storagePath,
    file_name: validation.safeFileName,
    mime_type: validation.mimeType,
    byte_size: bytes.byteLength,
    checksum_sha256: checksum,
    scan_status: scan.status,
    scan_provider: scan.provider,
    scanned_at: new Date().toISOString(),
    uploaded_by: session.userId,
  });

  if (versionError) {
    logger.error('document.version_failed', { message: versionError.message });
    return { status: 'error', message: 'generic' };
  }

  if (requestId) {
    await supabase
      .from('document_requests')
      .update({ status: 'uploaded', fulfilled_at: new Date().toISOString() })
      .eq('id', requestId);
  }

  await supabase.from('document_access_logs').insert({
    document_id: document.id,
    actor_id: session.userId,
    actor_org_id: organizationId,
    action: 'upload',
  });

  await recordAudit({
    action: 'document.uploaded',
    targetType: 'document',
    targetId: document.id,
    organizationId,
    caseId,
    metadata: { category, byteSize: bytes.byteLength, mimeType: validation.mimeType, scan: scan.status },
  });

  revalidatePath(`/${await getLocale()}/app/documents`);
  return { status: 'success', documentId: document.id, message: 'uploaded' };
}

/**
 * Issues a short-lived signed URL and logs the access.
 *
 * RLS on `documents` is what decides whether the caller may see the row at all;
 * if the select comes back empty we simply refuse rather than explaining why.
 */
export async function createDownloadUrl(
  documentId: string,
  action: 'preview' | 'download' = 'download',
): Promise<{ ok: true; url: string; fileName: string } | { ok: false; reason: string }> {
  const session = await requireSession();

  try {
    await enforceRateLimit('document.download', hashIdentifier(session.userId));
  } catch (error) {
    if (error instanceof RateLimitError) return { ok: false, reason: 'rateLimited' };
    throw error;
  }

  const supabase = await createClient();
  const { data: document } = await supabase
    .from('documents')
    .select('id, bucket_id, organization_id, case_id, current_version')
    .eq('id', documentId)
    .maybeSingle();

  if (!document) return { ok: false, reason: 'notFound' };

  const { data: version } = await supabase
    .from('document_versions')
    .select('id, storage_path, file_name, scan_status')
    .eq('document_id', documentId)
    .eq('version_no', document.current_version)
    .maybeSingle();

  if (!version) return { ok: false, reason: 'notFound' };

  // A quarantined file is never handed out, to anyone.
  if (version.scan_status === 'infected' || version.scan_status === 'quarantined') {
    return { ok: false, reason: 'quarantined' };
  }

  const { data: signed, error } = await supabase.storage
    .from(document.bucket_id)
    .createSignedUrl(version.storage_path, 300, { download: action === 'download' });

  if (error || !signed) {
    logger.error('document.sign_failed', { message: error?.message });
    return { ok: false, reason: 'generic' };
  }

  const headerList = await headers();
  await supabase.from('document_access_logs').insert({
    document_id: documentId,
    version_id: version.id,
    actor_id: session.userId,
    actor_org_id: document.organization_id,
    action,
    ip_hash: hashIdentifier((headerList.get('x-forwarded-for') ?? '').split(',')[0]?.trim() ?? ''),
  });

  await recordAudit({
    action: action === 'download' ? 'document.downloaded' : 'document.previewed',
    targetType: 'document',
    targetId: documentId,
    organizationId: document.organization_id,
    caseId: document.case_id,
  });

  return { ok: true, url: signed.signedUrl, fileName: version.file_name };
}
