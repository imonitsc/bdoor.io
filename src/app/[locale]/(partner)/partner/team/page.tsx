import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeading } from '@/components/dashboard/page-heading';
import { InviteForm, RemoveMemberButton } from '@/components/forms/team-forms';
import { requirePartnerOrganization } from '@/lib/auth/require-organization';
import { createClient } from '@/lib/supabase/server';

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function PartnerTeamPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  const [{ session, active }, t, tRoles] = await Promise.all([
    requirePartnerOrganization(),
    getTranslations('workspace.team'),
    getTranslations('roles'),
  ]);

  const isOwner = active.role === 'partner_owner';
  const supabase = await createClient();
  const { data } = await supabase
    .from('organization_memberships')
    .select('id, user_id, role, profiles(full_name, email)')
    .eq('organization_id', active.organizationId)
    .order('joined_at');

  type Row = {
    id: string;
    user_id: string;
    role: string;
    profiles: { full_name: string; email: string | null } | null;
  };
  const members = (data ?? []) as unknown as Row[];

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
                { value: 'partner_staff', label: tRoles('partner_staff') },
                { value: 'partner_owner', label: tRoles('partner_owner') },
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
    </div>
  );
}
