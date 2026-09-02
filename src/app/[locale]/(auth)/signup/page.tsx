import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { MagicSignUpForm, SignUpForm } from '@/components/forms/auth-forms';
import { authMode } from '@/features/auth/mode';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'auth' });
  return {
    title: t('signUpTitle'),
    // Authentication screens must never be indexed or cached.
    robots: { index: false, follow: false },
  };
}

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return authMode() === 'passwordless' ? <MagicSignUpForm /> : <SignUpForm />;
}
