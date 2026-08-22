import type { Metadata } from 'next';
import { getFormatter, getTranslations, setRequestLocale } from 'next-intl/server';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeading } from '@/components/dashboard/page-heading';
import {
  InviteForm,
  RemoveMemberButton,
  RevokeInvitationButton,
} from '@/components/forms/team-forms';
import { requireCustomerOrganization } from '@/lib/auth/require-organization';
import { createClient } from '@/lib/supabase/server';

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function TeamPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  const [{ session, active }, t, tRoles, format] = await Promise.all([
    requireCustomerOrganization(),
    getTranslations('workspace.team'),
    getTranslations('roles'),
    getFormatter(),
  ]);

  const isOwner = active.role === 'customer_owner';
  const supabase = await createClient();

  const [membersResult, invitationsResult] = await Promise.all([
    supabase
      .from('organization_memberships')
      .select('id, user_id, role, joined_at, profiles(full_name, email)')
      .eq('organization_id', active.organizationId)
      .order('joined_at'),
    isOwner
      ? supabase
          .from('organization_invitations')
          .select('id, email, role, expires_at, status')
          .eq('organization_id', active.organizationId)
          .eq('status', 'pending')
          .order('created_at', { ascending: false })
      : Promise.resolve({
          data: [] as Array<{
            id: string;
            email: string;
            role: string;
            expires_at: string;
            status: string;
          }>,
        }),
  ]);

  type MemberRow = {
    id: string;
    user_id: string;
    role: string;
    joined_at: string;
    profiles: { full_name: string; email: string | null } | null;
  };

  const members = (membersResult.data ?? []) as unknown as MemberRow[];
  const invitations = invitationsResult.data ?? [];

  return (
    <div className="flex flex-col gap-6">
      <PageHeading title={t('title')} description={active.organizationName} />

      {isOwner ? (
        <Card>
          <CardHeader>
            <CardTitle as="h2">{t('inviteCta')}</CardTitle>
          </CardHeader>
          <CardContent>
            <InviteForm
              organizationId={active.organizationId}
              roles={[
                { value: 'customer_member', label: tRoles('customer_member') },
                { value: 'customer_owner', label: tRoles('customer_owner') },
              ]}
            />
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle as="h2">{t('members')}</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="divide-border divide-y">
            {members.map((member) => (
              <li
                key={member.id}
                className="flex flex-wrap items-center justify-between gap-3 py-3.5"
              >
                <div className="min-w-0">
                  <p className="text-ink flex items-center gap-2 text-sm font-medium">
                    {member.profiles?.full_name ||
                      member.profiles?.email ||
                      member.user_id.slice(0, 8)}
                    {member.user_id === session.userId ? (
                      <Badge tone="neutral">{t('youBadge')}</Badge>
                    ) : null}
                  </p>
                  <p className="text-muted text-xs">{member.profiles?.email ?? ''}</p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge tone="info">{tRoles(member.role)}</Badge>
                  {isOwner && member.user_id !== session.userId ? (
                    <RemoveMemberButton
                      userId={member.user_id}
                      organizationId={active.organizationId}
                      name={member.profiles?.full_name ?? ''}
                    />
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {isOwner && invitations.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle as="h2">{t('invitations')}</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="divide-border divide-y">
              {invitations.map((invitation) => (
                <li
                  key={invitation.id}
                  className="flex flex-wrap items-center justify-between gap-3 py-3.5"
                >
                  <div className="min-w-0">
                    <p className="text-ink truncate text-sm">{invitation.email}</p>
                    <p className="text-muted text-xs">
                      {t('expiresOn', {
                        date: format.dateTime(new Date(invitation.expires_at), 'short'),
                      })}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge tone="neutral">{tRoles(invitation.role)}</Badge>
                    <RevokeInvitationButton
                      invitationId={invitation.id}
                      organizationId={active.organizationId}
                      email={invitation.email}
                    />
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
