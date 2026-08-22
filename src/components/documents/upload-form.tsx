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
  const [fileName, setFileName] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (state.status === 'success') {
      announce(t('uploadSuccess', { name: fileName ?? '' }));
      setFileName(null);
      if (inputRef.current) inputRef.current.value = '';
    } else if (state.status === 'error' && state.message) {
      announce(tErrors(state.message), true);
    }
    // `fileName` intentionally excluded: announcing should follow the action result.
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
          {t('uploadSuccess', { name: fileName ?? '' })}
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
            setFileName(dropped.name);
          }
        }}
        className={cn(
          'flex flex-col items-center gap-3 rounded-[var(--radius-card)] border-2 border-dashed p-6 text-center transition-colors',
          dragging ? 'border-primary bg-primary-soft' : 'border-border-strong bg-surface',
        )}
      >
        <FileUp className="size-6 text-muted" aria-hidden="true" />
        <div>
          <p className="text-sm font-medium text-ink">{t('dropzone')}</p>
          <p className="mt-1 text-xs text-muted">{t('dropzoneHint', { maxMb })}</p>
        </div>

        <Field>
          <FieldLabel className="sr-only">{t('chooseFile')}</FieldLabel>
          <FieldDescription className="sr-only">{t('dropzoneHint', { maxMb })}</FieldDescription>
          <FieldControl>
            <Input
              ref={inputRef}
              type="file"
              name="file"
              required
              accept={ALLOWED_MIME_TYPES.join(',')}
              onChange={(e) => setFileName(e.currentTarget.files?.[0]?.name ?? null)}
              className="h-auto cursor-pointer border-0 bg-transparent p-0 text-sm file:me-3 file:rounded-[var(--radius-control)] file:border-0 file:bg-surface-sunken file:px-3 file:py-2 file:text-sm file:font-medium file:text-ink"
            />
          </FieldControl>
        </Field>

        {fileName ? (
          <p className="text-sm text-ink" aria-live="polite">
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
