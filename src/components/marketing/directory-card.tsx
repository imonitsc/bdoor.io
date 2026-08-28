import { ArrowRight } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { pickLocalized, type Localized, type OperationalStatus } from '@/features/directory/types';
import type { Locale } from '@/features/catalog/types';

export function DirectoryCard({
  href,
  title,
  summary,
  locale,
  status,
  comingSoonLabel,
  flagshipLabel,
}: {
  href: string;
  title: Localized;
  summary: Localized;
  locale: Locale;
  status: OperationalStatus;
  comingSoonLabel: string;
  flagshipLabel?: string;
}) {
  return (
    <Card as="article" className="group relative flex h-full flex-col gap-3 p-5 md:p-6">
      {status !== 'active' ? (
        <Badge tone="neutral">{comingSoonLabel}</Badge>
      ) : flagshipLabel ? (
        <Badge tone="accent">{flagshipLabel}</Badge>
      ) : null}
      <h2 className="text-ink text-base font-semibold">
        <Link
          href={href}
          className="rounded before:absolute before:inset-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus)]"
        >
          {pickLocalized(title, locale)}
        </Link>
      </h2>
      <p className="text-muted flex-1 text-sm leading-relaxed">{pickLocalized(summary, locale)}</p>
      <p className="text-primary mt-1 flex items-center gap-1.5 text-sm font-medium">
        <ArrowRight
          className="size-4 transition-transform group-hover:translate-x-0.5"
          aria-hidden="true"
        />
      </p>
    </Card>
  );
}
