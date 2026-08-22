import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Alert } from '@/components/ui/alert';
import { SignInForm } from '@/components/forms/auth-forms';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'auth' });
  return { title: t('signInTitle'), robots: { index: false, follow: false } };
}

export default async function LoginPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const [{ locale }, query] = await Promise.all([params, searchParams]);
  setRequestLocale(locale);
  const t = await getTranslations('auth.errors');

  // Only site-relative paths are ever passed through, so the sign-in redirect
  // cannot be turned into an open redirect.
  const next =
    query.next && query.next.startsWith('/') && !query.next.startsWith('//')
      ? query.next
      : undefined;

  return (
    <div className="flex flex-col gap-5">
      {query.error ? (
        <Alert tone="warning" live="polite">
          {t(query.error === 'expired_link' ? 'linkExpired' : 'generic')}
        </Alert>
      ) : null}
      <SignInForm next={next} />
    </div>
  );
}
