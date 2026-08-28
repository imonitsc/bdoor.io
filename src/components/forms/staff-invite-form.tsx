'use client';

import { useActionState } from 'react';
import { useTranslations } from 'next-intl';
import { UserPlus, X } from 'lucide-react';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Field, FieldControl, FieldDescription, FieldLabel } from '@/components/ui/field';
import { Input, NativeSelect, Textarea } from '@/components/ui/input';
import {
  inviteStaff,
  revokeStaffInvitation,
  type StaffInviteState,
} from '@/features/admin/staff-invitations';
import type { InvitableTemplate } from '@/features/admin/invitable-templates';

const INITIAL: StaffInviteState = { status: 'idle' };

export function StaffInviteForm({ templates }: { templates: readonly InvitableTemplate[] }) {
  const t = useTranslations('admin.staffInvites');
  const tCommon = useTranslations('common');
  const [state, action, pending] = useActionState(inviteStaff, INITIAL);

  // Nothing this administrator may hand out. Showing an empty select and a
  // button that can only fail would be worse than saying so.
  if (templates.length === 0) {
    return (
      <Alert tone="info" live="polite">
        {t('nothingInvitable')}
      </Alert>
    );
  }

  return (
    <form action={action} className="flex flex-col gap-4">
      {state.status === 'error' && state.message ? (
        <Alert tone="danger" live="assertive">
          {t(state.message)}
        </Alert>
      ) : null}
      {state.status === 'success' && state.message ? (
        <Alert tone="success" live="polite">
          {t(state.message)}
        </Alert>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field error={state.fieldErrors?.email ? t('emailRequired') : undefined}>
          <FieldLabel required>{t('email')}</FieldLabel>
          <FieldControl hasDescription={false}>
            <Input name="email" type="email" autoComplete="off" required />
          </FieldControl>
        </Field>

        <Field
          error={state.fieldErrors?.templateCode ? t('templateRequired') : undefined}
          // The list holds only what this administrator may actually grant. The
          // database decides for real; this just avoids offering the refusal.
        >
          <FieldLabel required>{t('role')}</FieldLabel>
          <FieldControl hasDescription={false}>
            <NativeSelect name="templateCode" defaultValue={templates[0]?.code} required>
              {templates.map((template) => (
                <option key={template.code} value={template.code}>
                  {template.label}
                </option>
              ))}
            </NativeSelect>
          </FieldControl>
        </Field>
      </div>

      <Field error={state.fieldErrors?.reason ? t('reasonTooShort') : undefined}>
        <FieldLabel required>{t('reason')}</FieldLabel>
        <FieldControl>
          <Textarea name="reason" rows={2} required minLength={8} maxLength={500} />
        </FieldControl>
        <FieldDescription>{t('reasonHelp')}</FieldDescription>
      </Field>

      <Button type="submit" disabled={pending} className="w-fit">
        {pending ? tCommon('saving') : t('send')}
        <UserPlus className="size-4" aria-hidden="true" />
      </Button>
    </form>
  );
}

export function RevokeStaffInvitationButton({ invitationId }: { invitationId: string }) {
  const t = useTranslations('admin.staffInvites');
  const [, action, pending] = useActionState(revokeStaffInvitation, INITIAL);

  return (
    <form action={action}>
      <input type="hidden" name="invitationId" value={invitationId} />
      <Button type="submit" variant="ghost" size="sm" disabled={pending}>
        {t('revoke')}
        <X className="size-3.5" aria-hidden="true" />
      </Button>
    </form>
  );
}
