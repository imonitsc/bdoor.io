import { cn } from '@/lib/utils/cn';

export function PageHeading({
  title,
  description,
  actions,
  breadcrumb,
  className,
}: {
  title: string;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  breadcrumb?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-col gap-3', className)}>
      {breadcrumb}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold text-ink md:text-3xl">{title}</h1>
          {description ? (
            <div className="mt-1.5 text-sm leading-relaxed text-muted">{description}</div>
          ) : null}
        </div>
        {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
      </div>
    </div>
  );
}
