import * as React from 'react';
import { cn } from '@/lib/utils/cn';

/**
 * Data table that scrolls inside its own container on small screens.
 * For row-per-record data prefer <DataList> below, which renders as cards
 * on mobile and a table from `md` up.
 */
export function Table({ className, ...props }: React.HTMLAttributes<HTMLTableElement>) {
  return (
    <div className="scroll-x -mx-1 px-1">
      <table className={cn('w-full min-w-[36rem] border-collapse text-sm', className)} {...props} />
    </div>
  );
}

export function THead({ className, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return <thead className={cn('border-border border-b text-start', className)} {...props} />;
}

export function TBody({ className, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return <tbody className={cn('divide-border divide-y', className)} {...props} />;
}

export function TR({ className, ...props }: React.HTMLAttributes<HTMLTableRowElement>) {
  return <tr className={cn('align-top', className)} {...props} />;
}

export function TH({
  className,
  scope = 'col',
  ...props
}: React.ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      scope={scope}
      className={cn(
        'text-muted px-3 py-2.5 text-start text-xs font-semibold tracking-wide uppercase',
        className,
      )}
      {...props}
    />
  );
}

export function TD({ className, ...props }: React.TdHTMLAttributes<HTMLTableCellElement>) {
  return <td className={cn('text-ink px-3 py-3', className)} {...props} />;
}
