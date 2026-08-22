import type { Metadata } from 'next';
import { getFormatter, getTranslations, setRequestLocale } from 'next-intl/server';
import { Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { DataList, type DataListColumn } from '@/components/ui/data-list';
import { EmptyState } from '@/components/ui/empty-state';
import { PageHeading } from '@/components/dashboard/page-heading';
import { Alert } from '@/components/ui/alert';
import { requireCapability } from '@/lib/auth/session';
import { createClient } from '@/lib/supabase/server';

export const metadata: Metadata = { robots: { index: false, follow: false } };

type UserRow = {
  id: string;
  fullName: string;
  email: string | null;
  roles: string[];
  mfaEnrolled: boolean;
  createdAt: string;
};

export default async function AdminUsersPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  await requireCapability('user.manage');

  const [t, tRoles, tCommon, tAuth, format] = await Promise.all([
    getTranslations('admin.nav'),
    getTranslations('roles'),
    getTranslations('common'),
    getTranslations('auth.mfa'),
    getFormatter(),
  ]);

  const supabase = await createClient();
  const [profilesResult, rolesResult, securityResult] = await Promise.all([
    supabase
      .from('profiles')
      .select('id, full_name, email, created_at')
      .order('created_at', { ascending: false })
      .limit(200),
    supabase.from('platform_roles').select('user_id, role'),
    supabase.from('user_security_settings').select('user_id, mfa_enrolled_at'),
  ]);

  const rolesByUser = new Map<string, string[]>();
  for (const row of rolesResult.data ?? []) {
    rolesByUser.set(row.user_id, [...(rolesByUser.get(row.user_id) ?? []), row.role]);
  }
  const mfaByUser = new Map((securityResult.data ?? []).map((r) => [r.user_id, r.mfa_enrolled_at]));

  const rows: UserRow[] = (profilesResult.data ?? []).map((row) => ({
    id: row.id,
    fullName: row.full_name,
    email: row.email,
    roles: rolesByUser.get(row.id) ?? [],
    mfaEnrolled: Boolean(mfaByUser.get(row.id)),
    createdAt: row.created_at,
  }));

  const staffMissingMfa = rows.filter((row) => row.roles.length > 0 && !row.mfaEnrolled);

  const columns: ReadonlyArray<DataListColumn<UserRow>> = [
    {
      key: 'name',
      header: t('users'),
      cell: (row) => (
        <div className="min-w-0">
          <p className="text-ink truncate font-medium">{row.fullName || '—'}</p>
          <p className="text-muted truncate text-xs">{row.email ?? ''}</p>
        </div>
      ),
    },
    {
      key: 'roles',
      header: tCommon('status'),
      cell: (row) =>
        row.roles.length === 0 ? (
          <span className="text-muted">—</span>
        ) : (
          <span className="flex flex-wrap gap-1">
            {row.roles.map((role) => (
              <Badge key={role} tone="info">
                {tRoles(role)}
              </Badge>
            ))}
          </span>
        ),
    },
    {
      key: 'mfa',
      header: tAuth('title'),
      cell: (row) => (
        <Badge tone={row.mfaEnrolled ? 'success' : row.roles.length > 0 ? 'danger' : 'neutral'}>
          {row.mfaEnrolled ? tAuth('enabled') : tAuth('disabled')}
        </Badge>
      ),
    },
    {
      key: 'created',
      header: tCommon('created'),
      cell: (row) => format.dateTime(new Date(row.createdAt), 'short'),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <PageHeading title={t('users')} />

      {staffMissingMfa.length > 0 ? (
        <Alert tone="danger" title={tAuth('requiredForRole')}>
          <ul className="mt-1 flex flex-col gap-1">
            {staffMissingMfa.map((row) => (
              <li key={row.id}>{row.fullName || row.email}</li>
            ))}
          </ul>
        </Alert>
      ) : null}

      <DataList
        rows={rows}
        columns={columns}
        getRowKey={(row) => row.id}
        caption={t('users')}
        empty={<EmptyState icon={<Users className="size-5" />} title={tCommon('noResults')} />}
      />
    </div>
  );
}
