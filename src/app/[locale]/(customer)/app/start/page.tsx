import { redirect } from 'next/navigation';

/**
 * The questionnaire lives on the public /start route and already resumes a
 * signed-in user's saved answers, so there is nothing separate to build here.
 */
export default async function AppStartPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  redirect(`/${locale}/start`);
}
