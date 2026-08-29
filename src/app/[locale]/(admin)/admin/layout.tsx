import { redirect } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import {
  Banknote,
  Briefcase,
  CalendarCheck,
  FileText,
  Handshake,
  LayoutDashboard,
  Newspaper,
  Package,
  ScrollText,
  Settings,
  ShieldAlert,
  Tags,
  UserRound,
  Users,
} from 'lucide-react';
import { AppShell, type NavItem } from '@/components/layout/app-shell';
import { SkipLink } from '@/components/layout/skip-link';
import { SignOutButton } from '@/components/dashboard/sign-out-button';
import { customerMemberships, getSession, partnerMemberships } from '@/lib/auth/session';
import { ADMIN_ROUTES, APP_ROUTES, PARTNER_ROUTES } from '@/lib/navigation';

/**
 * Staff area.
 *
 * Access needs a platform role, and every platform role must have satisfied MFA
 * for this session. Both checks also exist in the database policies; this one
 * simply keeps a staff member from reaching a screen they could not use.
 */
export default async function AdminLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const session = await getSession();
  if (!session) redirect(`/${locale}/login?next=/${locale}/admin`);
  if (session.platformRoles.length === 0) redirect(`/${locale}/app`);
  // Two different outstanding steps, two different destinations. Sending an
  // enrolled user to the enrolment page leaves them with no code box and no way
  // to reach aal2 at all.
  if (session.mfaStep === 'challenge') {
    redirect(`/${locale}/mfa/challenge?next=/${locale}/admin`);
  }
  if (session.mfaStep === 'enroll') redirect(`/${locale}/app/security?mfa=required`);

  const t = await getTranslations('admin.nav');
  const nav = await getTranslations('nav');

  const has = (...caps: Parameters<typeof session.capabilities.has>[0][]) =>
    caps.some((cap) => session.capabilities.has(cap));

  const items: NavItem[] = [
    {
      href: ADMIN_ROUTES.dashboard,
      label: t('dashboard'),
      icon: <LayoutDashboard className="size-4" />,
    },
    ...(has('case.manage')
      ? [{ href: ADMIN_ROUTES.leads, label: t('leads'), icon: <UserRound className="size-4" /> }]
      : []),
    { href: ADMIN_ROUTES.cases, label: t('cases'), icon: <Briefcase className="size-4" /> },
    ...(has('kyc.read', 'risk.read')
      ? [{ href: ADMIN_ROUTES.kyc, label: t('kyc'), icon: <ShieldAlert className="size-4" /> }]
      : []),
    ...(has('partner.verify', 'case.assign_partner')
      ? [
          {
            href: ADMIN_ROUTES.partners,
            label: t('partners'),
            icon: <Handshake className="size-4" />,
          },
        ]
      : []),
    ...(has('service.manage')
      ? [
          { href: ADMIN_ROUTES.services, label: t('services'), icon: <Tags className="size-4" /> },
          { href: ADMIN_ROUTES.pricing, label: t('pricing'), icon: <Package className="size-4" /> },
        ]
      : []),
    ...(has('payment.read')
      ? [{ href: ADMIN_ROUTES.finance, label: t('finance'), icon: <Banknote className="size-4" /> }]
      : []),
    {
      href: ADMIN_ROUTES.compliance,
      label: t('compliance'),
      icon: <CalendarCheck className="size-4" />,
    },
    ...(has('content.publish')
      ? [
          {
            href: ADMIN_ROUTES.content,
            label: t('content'),
            icon: <Newspaper className="size-4" />,
          },
        ]
      : []),
    ...(has('user.manage')
      ? [{ href: ADMIN_ROUTES.users, label: t('users'), icon: <Users className="size-4" /> }]
      : []),
    ...(has('audit.read')
      ? [{ href: ADMIN_ROUTES.audit, label: t('audit'), icon: <ScrollText className="size-4" /> }]
      : []),
    ...(has('settings.manage')
      ? [
          {
            href: ADMIN_ROUTES.settings,
            label: t('settings'),
            icon: <Settings className="size-4" />,
          },
        ]
      : []),
    { href: ADMIN_ROUTES.documents, label: t('documents'), icon: <FileText className="size-4" /> },
  ];

  // The axes are independent, so signpost the other areas this person holds
  // rather than leaving them to guess at URLs.
  if (customerMemberships(session).length > 0) {
    items.push({
      href: APP_ROUTES.dashboard,
      label: nav('workspace'),
      icon: <LayoutDashboard className="size-4" />,
    });
  }
  if (partnerMemberships(session).length > 0) {
    items.push({
      href: PARTNER_ROUTES.dashboard,
      label: nav('partnerArea'),
      icon: <Handshake className="size-4" />,
    });
  }

  return (
    <>
      <SkipLink />
      <AppShell items={items} areaLabel={nav('adminArea')} headerActions={<SignOutButton />}>
        {children}
      </AppShell>
    </>
  );
}
