import { cn } from '@/lib/utils/cn';

/**
 * The BDoor mark: a doorway seen head-on whose stile and two openings read as a
 * "B". Rendered inline rather than as an <img> so it inherits `currentColor`
 * and stays crisp at favicon size.
 */
export function BDoorSymbol({ className, title }: { className?: string; title?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      className={cn('size-8', className)}
      role={title ? 'img' : 'presentation'}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      fill="none"
    >
      {title ? <title>{title}</title> : null}
      <path
        fill="currentColor"
        d="M12 6h22a18 18 0 0 1 0 36h-4v10a2 2 0 0 1-2 2H12a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2Zm6 6v40h6V12h-6Zm12 0v24h4a12 12 0 0 0 0-24h-4Z"
      />
      <circle cx="27.5" cy="32" r="2.25" className="fill-accent" />
    </svg>
  );
}

export function BDoorLogo({
  className,
  inverse = false,
}: {
  className?: string;
  inverse?: boolean;
}) {
  return (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <BDoorSymbol
        className={cn('size-7', inverse ? 'text-[color:var(--bd-cobalt-200)]' : 'text-primary')}
      />
      <span
        className={cn(
          'text-[1.3rem] font-semibold tracking-[-0.02em]',
          inverse ? 'text-ink-inverse' : 'text-[color:var(--bd-midnight)]',
        )}
      >
        BDoor
      </span>
    </span>
  );
}
