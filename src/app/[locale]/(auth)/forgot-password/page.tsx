import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { redirect } from 'next/navigation';
import { ForgotPasswordForm } from '@/components/forms/auth-forms';
import { authMode } from '@/features/auth/mode';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'auth' });
  return {
    title: t('resetTitle'),
    // Authentication screens must never be indexed or cached.
    robots: { index: false, follow: false },
  };
}

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  // Nothing to reset when there are no passwords. Sign-in is the same one-time
  // link this page would otherwise send, so send the caller straight there.
  if (authMode() === 'passwordless') redirect(`/${locale}/login`);
  return <ForgotPasswordForm />;
}
