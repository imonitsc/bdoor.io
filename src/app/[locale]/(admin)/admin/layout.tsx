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
import { getSession } from '@/lib/auth/session';
import { ADMIN_ROUTES } from '@/lib/navigation';

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
  if (!session.mfaSatisfied) redirect(`/${locale}/app/security?mfa=required`);

  const t = await getTranslations('admin.nav');
  const nav = await getTranslations('nav');

  const has = (...caps: Parameters<typeof session.capabilities.has>[0][]) =>
    caps.some((cap) => session.capabilities.has(cap));

  const items: NavItem[] = [
    { href: ADMIN_ROUTES.dashboard, label: t('dashboard'), icon: LayoutDashboard },
    ...(has('case.manage')
      ? [{ href: ADMIN_ROUTES.leads, label: t('leads'), icon: UserRound }]
      : []),
    { href: ADMIN_ROUTES.cases, label: t('cases'), icon: Briefcase },
    ...(has('kyc.read', 'risk.read')
      ? [{ href: ADMIN_ROUTES.kyc, label: t('kyc'), icon: ShieldAlert }]
      : []),
    ...(has('partner.verify', 'case.assign_partner')
      ? [{ href: ADMIN_ROUTES.partners, label: t('partners'), icon: Handshake }]
      : []),
    ...(has('service.manage')
      ? [{ href: ADMIN_ROUTES.services, label: t('services'), icon: Tags }]
      : []),
    ...(has('payment.read')
      ? [{ href: ADMIN_ROUTES.finance, label: t('finance'), icon: Banknote }]
      : []),
    { href: ADMIN_ROUTES.compliance, label: t('compliance'), icon: CalendarCheck },
    ...(has('content.publish')
      ? [{ href: ADMIN_ROUTES.content, label: t('content'), icon: Newspaper }]
      : []),
    ...(has('user.manage') ? [{ href: ADMIN_ROUTES.users, label: t('users'), icon: Users }] : []),
    ...(has('audit.read')
      ? [{ href: ADMIN_ROUTES.audit, label: t('audit'), icon: ScrollText }]
      : []),
    ...(has('settings.manage')
      ? [{ href: ADMIN_ROUTES.settings, label: t('settings'), icon: Settings }]
      : []),
    { href: ADMIN_ROUTES.documents, label: t('documents'), icon: FileText },
  ];

  return (
    <>
      <SkipLink />
      <AppShell items={items} areaLabel={nav('adminArea')} headerActions={<SignOutButton />}>
        {children}
      </AppShell>
    </>
  );
}
