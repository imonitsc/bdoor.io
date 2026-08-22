'use client';

import { useActionState } from 'react';
import { useTranslations } from 'next-intl';
import { UserPlus, X } from 'lucide-react';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Field, FieldControl, FieldLabel } from '@/components/ui/field';
import { Input, NativeSelect } from '@/components/ui/input';
import { inviteMember, removeMember, revokeInvitation, type OrgState } from '@/features/organizations/actions';

const INITIAL: OrgState = { status: 'idle' };

export function InviteForm({
  organizationId,
  roles,
}: {
  organizationId: string;
  roles: ReadonlyArray<{ value: string; label: string }>;
}) {
  const t = useTranslations('workspace.team');
  const tCommon = useTranslations('common');
  const tErrors = useTranslations('organizations.errors');
  const [state, action, pending] = useActionState(inviteMember, INITIAL);

  return (
    <form action={action} className="flex flex-col gap-4">
      <input type="hidden" name="organizationId" value={organizationId} />

      {state.status === 'error' && state.message ? (
        <Alert tone="danger" live="assertive">
          {tErrors(state.message)}
        </Alert>
      ) : null}
      {state.status === 'success' && state.message ? (
        <Alert tone="success" live="polite">
          {tErrors(state.message)}
        </Alert>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-[1fr_auto_auto] sm:items-end">
        <Field error={state.fieldErrors?.email ? tErrors(state.fieldErrors.email) : undefined}>
          <FieldLabel required>{t('inviteEmail')}</FieldLabel>
          <FieldControl hasDescription={false}>
            <Input name="email" type="email" autoComplete="email" required />
          </FieldControl>
        </Field>

        <Field>
          <FieldLabel required>{t('inviteRole')}</FieldLabel>
          <FieldControl hasDescription={false}>
            <NativeSelect name="role" defaultValue={roles[0]?.value} required>
              {roles.map((role) => (
                <option key={role.value} value={role.value}>
                  {role.label}
                </option>
              ))}
            </NativeSelect>
          </FieldControl>
        </Field>

        <Button type="submit" disabled={pending} className="h-11">
          {pending ? tCommon('saving') : t('inviteSend')}
          <UserPlus className="size-4" aria-hidden="true" />
        </Button>
      </div>
    </form>
  );
}

export function RevokeInvitationButton({
  invitationId,
  organizationId,
  email,
}: {
  invitationId: string;
  organizationId: string;
  email: string;
}) {
  const t = useTranslations('workspace.team');
  const [, action, pending] = useActionState(revokeInvitation, INITIAL);

  return (
    <form action={action}>
      <input type="hidden" name="invitationId" value={invitationId} />
      <input type="hidden" name="organizationId" value={organizationId} />
      <Button type="submit" variant="ghost" size="sm" disabled={pending}>
        <X className="size-4" aria-hidden="true" />
        {t('revoke')}
        <span className="sr-only"> — {email}</span>
      </Button>
    </form>
  );
}

export function RemoveMemberButton({
  userId,
  organizationId,
  name,
}: {
  userId: string;
  organizationId: string;
  name: string;
}) {
  const t = useTranslations('workspace.team');
  const tErrors = useTranslations('organizations.errors');
  const [state, action, pending] = useActionState(removeMember, INITIAL);

  return (
    <form action={action} className="flex flex-col items-end gap-1">
      <input type="hidden" name="userId" value={userId} />
      <input type="hidden" name="organizationId" value={organizationId} />
      <Button type="submit" variant="ghost" size="sm" disabled={pending}>
        <X className="size-4" aria-hidden="true" />
        {t('removeMember')}
        <span className="sr-only"> — {name}</span>
      </Button>
      {state.status === 'error' && state.message ? (
        <span className="text-xs font-medium text-danger" role="alert">
          {tErrors(state.message)}
        </span>
      ) : null}
    </form>
  );
}
