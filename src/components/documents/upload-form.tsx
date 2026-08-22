'use client';

import { useActionState, useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { FileUp, Upload } from 'lucide-react';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Field, FieldControl, FieldDescription, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { useAnnounce } from '@/components/ui/announcer';
import { uploadDocument, type UploadState } from '@/features/documents/actions';
import { ALLOWED_MIME_TYPES } from '@/features/documents/validation';
import { cn } from '@/lib/utils/cn';

const INITIAL: UploadState = { status: 'idle' };

export function UploadForm({
  organizationId,
  caseId,
  requestId,
  maxMb = 25,
}: {
  organizationId: string;
  caseId?: string;
  requestId?: string;
  maxMb?: number;
}) {
  const t = useTranslations('workspace.documents');
  const tErrors = useTranslations('documents.errors');
  const announce = useAnnounce();
  const [state, action, pending] = useActionState(uploadDocument, INITIAL);
  const [selected, setSelected] = useState<{ name: string; documentId: string | null } | null>(
    null,
  );
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // A successful upload clears the picker. The file input is remounted via its
  // `key` rather than reset through the ref, because touching a ref during
  // render is not allowed — and the key is honest about what is happening.
  if (state.status === 'success' && selected && selected.documentId !== state.documentId) {
    setSelected(null);
  }

  const fileName = selected?.name ?? null;

  useEffect(() => {
    if (state.status === 'success') {
      announce(t('uploadSuccess', { name: '' }));
    } else if (state.status === 'error' && state.message) {
      announce(tErrors(state.message), true);
    }
  }, [state, announce, t, tErrors]);

  return (
    <form action={action} className="flex flex-col gap-4">
      <input type="hidden" name="organizationId" value={organizationId} />
      {caseId ? <input type="hidden" name="caseId" value={caseId} /> : null}
      {requestId ? <input type="hidden" name="requestId" value={requestId} /> : null}

      {state.status === 'error' && state.message ? (
        <Alert tone="danger" live="assertive">
          {tErrors(state.message)}
        </Alert>
      ) : null}
      {state.status === 'success' ? (
        <Alert tone="success" live="polite">
          {t('uploadSuccess', { name: '' })}
        </Alert>
      ) : null}

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          const dropped = e.dataTransfer.files?.[0];
          if (dropped && inputRef.current) {
            const transfer = new DataTransfer();
            transfer.items.add(dropped);
            inputRef.current.files = transfer.files;
            setSelected({ name: dropped.name, documentId: state.documentId ?? null });
          }
        }}
        className={cn(
          'flex flex-col items-center gap-3 rounded-[var(--radius-card)] border-2 border-dashed p-6 text-center transition-colors',
          dragging ? 'border-primary bg-primary-soft' : 'border-border-strong bg-surface',
        )}
      >
        <FileUp className="text-muted size-6" aria-hidden="true" />
        <div>
          <p className="text-ink text-sm font-medium">{t('dropzone')}</p>
          <p className="text-muted mt-1 text-xs">{t('dropzoneHint', { maxMb })}</p>
        </div>

        <Field>
          <FieldLabel className="sr-only">{t('chooseFile')}</FieldLabel>
          <FieldDescription className="sr-only">{t('dropzoneHint', { maxMb })}</FieldDescription>
          <FieldControl>
            <Input
              key={state.documentId ?? 'idle'}
              ref={inputRef}
              type="file"
              name="file"
              required
              accept={ALLOWED_MIME_TYPES.join(',')}
              onChange={(e) => {
                const chosen = e.currentTarget.files?.[0];
                setSelected(
                  chosen ? { name: chosen.name, documentId: state.documentId ?? null } : null,
                );
              }}
              className="file:bg-surface-sunken file:text-ink h-auto cursor-pointer border-0 bg-transparent p-0 text-sm file:me-3 file:rounded-[var(--radius-control)] file:border-0 file:px-3 file:py-2 file:text-sm file:font-medium"
            />
          </FieldControl>
        </Field>

        {fileName ? (
          <p className="text-ink text-sm" aria-live="polite">
            {fileName}
          </p>
        ) : null}
      </div>

      <Button type="submit" disabled={pending || !fileName} className="w-fit">
        {pending ? t('uploading', { name: fileName ?? '' }) : t('uploadCta')}
        <Upload className="size-4" aria-hidden="true" />
      </Button>
    </form>
  );
}
