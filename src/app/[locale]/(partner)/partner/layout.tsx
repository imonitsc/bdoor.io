import { redirect } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import {
  Briefcase,
  Building2,
  FileText,
  LayoutDashboard,
  ListChecks,
  ShieldCheck,
  Users,
} from 'lucide-react';
import { AppShell, type NavItem } from '@/components/layout/app-shell';
import { SkipLink } from '@/components/layout/skip-link';
import { SignOutButton } from '@/components/dashboard/sign-out-button';
import { getSession, partnerMemberships } from '@/lib/auth/session';
import { PARTNER_ROUTES } from '@/lib/navigation';

export default async function PartnerLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const session = await getSession();
  if (!session) redirect(`/${locale}/login?next=/${locale}/partner`);
  if (partnerMemberships(session).length === 0) redirect(`/${locale}/app`);

  // Partner staff handle other people's documents, so MFA is not optional.
  if (session.mfaStep === 'challenge') {
    redirect(`/${locale}/mfa/challenge?next=/${locale}/partner`);
  }
  if (session.mfaStep === 'enroll') redirect(`/${locale}/app/security?mfa=required`);

  const t = await getTranslations('partnerWorkspace.nav');
  const nav = await getTranslations('nav');

  const items: NavItem[] = [
    { href: PARTNER_ROUTES.dashboard, label: t('dashboard'), icon: LayoutDashboard },
    { href: PARTNER_ROUTES.cases, label: t('cases'), icon: Briefcase },
    { href: PARTNER_ROUTES.tasks, label: t('tasks'), icon: ListChecks },
    { href: PARTNER_ROUTES.documents, label: t('documents'), icon: FileText },
    { href: PARTNER_ROUTES.team, label: t('team'), icon: Users },
    { href: PARTNER_ROUTES.organization, label: t('organization'), icon: Building2 },
    { href: PARTNER_ROUTES.security, label: t('security'), icon: ShieldCheck },
  ];

  return (
    <>
      <SkipLink />
      <AppShell items={items} areaLabel={nav('partnerArea')} headerActions={<SignOutButton />}>
        {children}
      </AppShell>
    </>
  );
}
