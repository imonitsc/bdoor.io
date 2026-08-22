import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

/** Fee components are edited alongside the service they belong to. */
export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function AdminPricingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  redirect(`/${locale}/admin/services`);
}
