import type { Metadata } from 'next';
import { getFormatter, getTranslations, setRequestLocale } from 'next-intl/server';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert } from '@/components/ui/alert';
import { PageHeading } from '@/components/dashboard/page-heading';
import { MfaSetup } from '@/components/forms/mfa-setup';
import { SignOutOtherSessions } from '@/components/dashboard/session-controls';
import { requireSession } from '@/lib/auth/session';
import { createClient } from '@/lib/supabase/server';

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function SecurityPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ updated?: string }>;
}) {
  const [{ locale }, query] = await Promise.all([params, searchParams]);
  setRequestLocale(locale);

  const [session, t, tAuth, format] = await Promise.all([
    requireSession(),
    getTranslations('workspace.security'),
    getTranslations('auth'),
    getFormatter(),
  ]);

  const supabase = await createClient();
  const [{ data: factors }, { data: settings }, { data: auditRows }] = await Promise.all([
    supabase.auth.mfa.listFactors(),
    supabase
      .from('user_security_settings')
      .select('mfa_enrolled_at, last_password_change')
      .eq('user_id', session.userId)
      .maybeSingle(),
    supabase
      .from('audit_logs')
      .select('id, action, created_at')
      .eq('actor_id', session.userId)
      .in('action', [
        'auth.sign_in',
        'auth.password_changed',
        'auth.mfa_enrolled',
        'auth.mfa_removed',
        'auth.sessions_revoked',
      ])
      .order('created_at', { ascending: false })
      .limit(10),
  ]);

  const verified = factors?.totp?.find((f) => f.status === 'verified') ?? null;

  return (
    <div className="flex flex-col gap-6">
      <PageHeading title={t('title')} />

      {query.updated === 'password' ? (
        <Alert tone="success" live="polite">
          {tAuth('updatePasswordCta')}
        </Alert>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle as="h2">{t('mfa')}</CardTitle>
          <CardDescription>{tAuth('mfa.subtitle')}</CardDescription>
        </CardHeader>
        <CardContent>
          <MfaSetup
            enrolled={Boolean(verified)}
            factorId={verified?.id ?? null}
            required={session.mfaRequired}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle as="h2">{t('sessions')}</CardTitle>
          <CardDescription>{t('sessionsNote')}</CardDescription>
        </CardHeader>
        <CardContent>
          <SignOutOtherSessions />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle as="h2">{t('auditTitle')}</CardTitle>
        </CardHeader>
        <CardContent>
          {(auditRows ?? []).length === 0 ? (
            <p className="text-muted text-sm">{t('noSessions')}</p>
          ) : (
            <ul className="divide-border divide-y">
              {(auditRows ?? []).map((row) => (
                <li key={row.id} className="flex items-center justify-between gap-4 py-3 text-sm">
                  <span className="text-ink">{row.action}</span>
                  <time dateTime={row.created_at} className="text-muted">
                    {format.dateTime(new Date(row.created_at), 'withTime')}
                  </time>
                </li>
              ))}
            </ul>
          )}
          {settings?.last_password_change ? (
            <p className="text-muted mt-4 text-xs">
              {t('changePassword')}:{' '}
              {format.dateTime(new Date(settings.last_password_change), 'long')}
            </p>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
