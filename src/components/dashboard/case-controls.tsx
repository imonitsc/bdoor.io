'use client';

import { useActionState, useState } from 'react';
import { useTranslations } from 'next-intl';
import { AlertTriangle, ArrowRight, FilePlus, Landmark, UserPlus } from 'lucide-react';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Field, FieldControl, FieldDescription, FieldLabel } from '@/components/ui/field';
import { Input, NativeSelect, Textarea } from '@/components/ui/input';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  assignPartner,
  recordSubmission,
  requestDocument,
  transitionCase,
  type CaseActionState,
} from '@/features/admin/case-actions';
import { nextStatuses, type CaseStatus } from '@/features/cases/state-machine';

const INITIAL: CaseActionState = { status: 'idle' };

function Feedback({ state }: { state: CaseActionState }) {
  const t = useTranslations('admin.errors');
  if (state.status === 'idle' || !state.message) return null;
  return (
    <Alert tone={state.status === 'success' ? 'success' : 'danger'} live="polite">
      {t(state.message)}
    </Alert>
  );
}

/**
 * Status change.
 *
 * Only transitions the state machine actually allows are offered, and the
 * dialog says out loud that the change is recorded with the actor's name — a
 * confirmation step that carries information rather than just friction.
 */
export function TransitionControl({ caseId, status }: { caseId: string; status: CaseStatus }) {
  const t = useTranslations('admin.cases');
  const tStatus = useTranslations('caseStatus');
  const tCommon = useTranslations('common');
  const [state, action, pending] = useActionState(transitionCase, INITIAL);
  const [open, setOpen] = useState(false);

  const available = nextStatuses(status, 'staff');
  if (available.length === 0) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="secondary">
          <ArrowRight className="size-4" aria-hidden="true" />
          {t('changeStatus')}
        </Button>
      </DialogTrigger>
      <DialogContent closeLabel={tCommon('close')}>
        <DialogHeader>
          <DialogTitle>{t('confirmTitle')}</DialogTitle>
          <DialogDescription>{t('confirmBody')}</DialogDescription>
        </DialogHeader>

        <form action={action} className="flex flex-col gap-4">
          <input type="hidden" name="caseId" value={caseId} />
          <Feedback state={state} />

          <Field>
            <FieldLabel required>{t('changeStatus')}</FieldLabel>
            <FieldControl hasDescription={false}>
              <NativeSelect name="toStatus" defaultValue={available[0]} required>
                {available.map((next) => (
                  <option key={next} value={next}>
                    {tStatus(next)}
                  </option>
                ))}
              </NativeSelect>
            </FieldControl>
          </Field>

          <Field>
            <FieldLabel required>{t('statusReason')}</FieldLabel>
            <FieldControl hasDescription={false}>
              <Textarea name="reason" rows={2} required minLength={5} maxLength={1000} />
            </FieldControl>
          </Field>

          <Field>
            <FieldLabel>{t('publicNote')}</FieldLabel>
            <FieldDescription>{t('confirmBody')}</FieldDescription>
            <FieldControl>
              <Textarea name="publicNote" rows={2} maxLength={2000} />
            </FieldControl>
          </Field>

          <Field>
            <FieldLabel>{t('internalNote')}</FieldLabel>
            <FieldControl hasDescription={false}>
              <Textarea name="internalNote" rows={2} maxLength={2000} />
            </FieldControl>
          </Field>

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="ghost">
                {tCommon('cancel')}
              </Button>
            </DialogClose>
            <Button type="submit" disabled={pending}>
              <AlertTriangle className="size-4" aria-hidden="true" />
              {tCommon('submit')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function RequestDocumentControl({ caseId }: { caseId: string }) {
  const t = useTranslations('admin.cases');
  const tCommon = useTranslations('common');
  const tDocs = useTranslations('workspace.documents');
  const [state, action, pending] = useActionState(requestDocument, INITIAL);

  const categories = [
    'identity',
    'address_proof',
    'corporate',
    'financial',
    'photo',
    'signature',
    'authority_form',
    'other',
  ] as const;

  return (
    <form action={action} className="flex flex-col gap-4">
      <input type="hidden" name="caseId" value={caseId} />
      <Feedback state={state} />

      <div className="grid gap-4 sm:grid-cols-2">
        <Field>
          <FieldLabel required>{tDocs('categoryLabel')} (EN)</FieldLabel>
          <FieldControl hasDescription={false}>
            <Input name="labelEn" required maxLength={200} />
          </FieldControl>
        </Field>
        <Field>
          <FieldLabel>{tDocs('categoryLabel')} (বাংলা)</FieldLabel>
          <FieldControl hasDescription={false}>
            <Input name="labelBn" maxLength={200} lang="bn" />
          </FieldControl>
        </Field>
        <Field>
          <FieldLabel required>{tDocs('categoryLabel')}</FieldLabel>
          <FieldControl hasDescription={false}>
            <NativeSelect name="category" defaultValue="other" required>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category.replace(/_/g, ' ')}
                </option>
              ))}
            </NativeSelect>
          </FieldControl>
        </Field>
        <Field>
          <FieldLabel>{tCommon('dueDate')}</FieldLabel>
          <FieldControl hasDescription={false}>
            <Input name="dueOn" type="date" />
          </FieldControl>
        </Field>
      </div>

      <Button type="submit" disabled={pending} className="w-fit">
        <FilePlus className="size-4" aria-hidden="true" />
        {t('requestDocument')}
      </Button>
    </form>
  );
}

export function AssignPartnerControl({
  caseId,
  partners,
}: {
  caseId: string;
  partners: ReadonlyArray<{ id: string; name: string }>;
}) {
  const t = useTranslations('admin.cases');
  const tPartner = useTranslations('partnerWorkspace.assignment');
  const [state, action, pending] = useActionState(assignPartner, INITIAL);

  if (partners.length === 0) return null;

  return (
    <form action={action} className="flex flex-col gap-4">
      <input type="hidden" name="caseId" value={caseId} />
      <Feedback state={state} />

      <Field>
        <FieldLabel required>{t('assignPartner')}</FieldLabel>
        <FieldControl hasDescription={false}>
          <NativeSelect name="partnerOrgId" defaultValue={partners[0]?.id} required>
            {partners.map((partner) => (
              <option key={partner.id} value={partner.id}>
                {partner.name}
              </option>
            ))}
          </NativeSelect>
        </FieldControl>
      </Field>

      <Field>
        <FieldLabel required>{tPartner('conflictCheck')}</FieldLabel>
        <FieldDescription>{tPartner('scopeNote')}</FieldDescription>
        <FieldControl>
          <Textarea name="scopeNote" rows={2} required minLength={5} maxLength={1000} />
        </FieldControl>
      </Field>

      <Button type="submit" disabled={pending} className="w-fit">
        <UserPlus className="size-4" aria-hidden="true" />
        {t('assignPartner')}
      </Button>
    </form>
  );
}

export function RecordSubmissionControl({ caseId }: { caseId: string }) {
  const t = useTranslations('admin.cases');
  const tCase = useTranslations('workspace.case');
  const [state, action, pending] = useActionState(recordSubmission, INITIAL);

  return (
    <form action={action} className="flex flex-col gap-4">
      <input type="hidden" name="caseId" value={caseId} />
      <Feedback state={state} />

      <div className="grid gap-4 sm:grid-cols-2">
        <Field>
          <FieldLabel required>{tCase('submissions')}</FieldLabel>
          <FieldControl hasDescription={false}>
            <Input name="authorityName" required maxLength={200} />
          </FieldControl>
        </Field>
        <Field>
          <FieldLabel required>{tCase('service')}</FieldLabel>
          <FieldControl hasDescription={false}>
            <Input name="submissionType" required maxLength={200} />
          </FieldControl>
        </Field>
        <Field>
          <FieldLabel>{tCase('submissionRef')}</FieldLabel>
          <FieldControl hasDescription={false}>
            <Input name="referenceNo" maxLength={120} className="font-mono" />
          </FieldControl>
        </Field>
        <Field>
          <FieldLabel required>{tCase('openedOn')}</FieldLabel>
          <FieldControl hasDescription={false}>
            <Input name="submittedOn" type="date" required />
          </FieldControl>
        </Field>
      </div>

      <Button type="submit" disabled={pending} className="w-fit">
        <Landmark className="size-4" aria-hidden="true" />
        {t('recordSubmission')}
      </Button>
    </form>
  );
}
