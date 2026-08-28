import { redirect } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import {
  Bell,
  Building2,
  CalendarCheck,
  CreditCard,
  FileText,
  LayoutDashboard,
  MessageSquare,
  Settings,
  ShieldCheck,
  Users,
} from 'lucide-react';
import { AppShell, type NavItem } from '@/components/layout/app-shell';
import { SkipLink } from '@/components/layout/skip-link';
import { SignOutButton } from '@/components/dashboard/sign-out-button';
import { getSession } from '@/lib/auth/session';
import { createClient } from '@/lib/supabase/server';
import { APP_ROUTES } from '@/lib/navigation';

export default async function CustomerLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const session = await getSession();
  if (!session) redirect(`/${locale}/login?next=/${locale}/app`);

  const t = await getTranslations('workspace.nav');

  // Unread notifications drive the sidebar badge. RLS scopes this to the caller.
  const supabase = await createClient();
  const { count: unread } = await supabase
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .is('read_at', null);

  const items: NavItem[] = [
    {
      href: APP_ROUTES.dashboard,
      label: t('dashboard'),
      icon: <LayoutDashboard className="size-4" />,
    },
    {
      href: APP_ROUTES.applications,
      label: t('applications'),
      icon: <FileText className="size-4" />,
    },
    { href: APP_ROUTES.companies, label: t('companies'), icon: <Building2 className="size-4" /> },
    { href: APP_ROUTES.documents, label: t('documents'), icon: <FileText className="size-4" /> },
    { href: APP_ROUTES.billing, label: t('billing'), icon: <CreditCard className="size-4" /> },
    {
      href: APP_ROUTES.compliance,
      label: t('compliance'),
      icon: <CalendarCheck className="size-4" />,
    },
    { href: APP_ROUTES.messages, label: t('messages'), icon: <MessageSquare className="size-4" /> },
    {
      href: APP_ROUTES.notifications,
      label: t('notifications'),
      icon: <Bell className="size-4" />,
      badge: unread ?? 0,
    },
    { href: APP_ROUTES.team, label: t('team'), icon: <Users className="size-4" /> },
    { href: APP_ROUTES.settings, label: t('settings'), icon: <Settings className="size-4" /> },
    { href: APP_ROUTES.security, label: t('security'), icon: <ShieldCheck className="size-4" /> },
  ];

  const nav = await getTranslations('nav');

  return (
    <>
      <SkipLink />
      <AppShell items={items} areaLabel={nav('workspace')} headerActions={<SignOutButton />}>
        {children}
      </AppShell>
    </>
  );
}
