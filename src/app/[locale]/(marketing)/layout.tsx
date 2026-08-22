import { setRequestLocale } from 'next-intl/server';
import { MarketingHeader } from '@/components/layout/marketing-header';
import { MarketingFooter } from '@/components/layout/marketing-footer';
import { SkipLink } from '@/components/layout/skip-link';

export default async function MarketingLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  // Deliberately no session read here. Touching cookies() in the marketing
  // layout would opt every page beneath it into dynamic rendering. The header
  // resolves the signed-in state in the browser instead, which costs one
  // client-side check and keeps the public pages statically renderable.
  return (
    <div className="flex min-h-dvh flex-col">
      <SkipLink />
      <MarketingHeader />
      <main id="main-content" className="flex-1">
        {children}
      </main>
      <MarketingFooter />
    </div>
  );
}
