import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

/**
 * Security settings are per-user, not per-workspace, so the partner area sends
 * people to the one place where they are managed rather than keeping a second
 * copy in sync.
 */
export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function PartnerSecurityPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  redirect(`/${locale}/app/security`);
}
