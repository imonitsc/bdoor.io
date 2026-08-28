import { redirect } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import {
  Briefcase,
  Building2,
  FileText,
  LayoutDashboard,
  ListChecks,
  ShieldAlert,
  ShieldCheck,
  Users,
} from 'lucide-react';
import { AppShell, type NavItem } from '@/components/layout/app-shell';
import { SkipLink } from '@/components/layout/skip-link';
import { SignOutButton } from '@/components/dashboard/sign-out-button';
import { customerMemberships, getSession, partnerMemberships } from '@/lib/auth/session';
import { ADMIN_ROUTES, APP_ROUTES, PARTNER_ROUTES } from '@/lib/navigation';

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
    {
      href: PARTNER_ROUTES.dashboard,
      label: t('dashboard'),
      icon: <LayoutDashboard className="size-4" />,
    },
    { href: PARTNER_ROUTES.cases, label: t('cases'), icon: <Briefcase className="size-4" /> },
    { href: PARTNER_ROUTES.tasks, label: t('tasks'), icon: <ListChecks className="size-4" /> },
    {
      href: PARTNER_ROUTES.documents,
      label: t('documents'),
      icon: <FileText className="size-4" />,
    },
    { href: PARTNER_ROUTES.team, label: t('team'), icon: <Users className="size-4" /> },
    {
      href: PARTNER_ROUTES.organization,
      label: t('organization'),
      icon: <Building2 className="size-4" />,
    },
    {
      href: PARTNER_ROUTES.security,
      label: t('security'),
      icon: <ShieldCheck className="size-4" />,
    },
  ];

  if (session.platformRoles.length > 0) {
    items.push({
      href: ADMIN_ROUTES.dashboard,
      label: nav('adminArea'),
      icon: <ShieldAlert className="size-4" />,
    });
  }
  if (customerMemberships(session).length > 0) {
    items.push({
      href: APP_ROUTES.dashboard,
      label: nav('workspace'),
      icon: <LayoutDashboard className="size-4" />,
    });
  }

  return (
    <>
      <SkipLink />
      <AppShell items={items} areaLabel={nav('partnerArea')} headerActions={<SignOutButton />}>
        {children}
      </AppShell>
    </>
  );
}
