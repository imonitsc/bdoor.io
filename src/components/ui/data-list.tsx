import * as React from 'react';
import { cn } from '@/lib/utils/cn';

export type DataListColumn<T> = {
  key: string;
  header: string;
  /** Rendered in both layouts. */
  cell: (row: T) => React.ReactNode;
  /** Hidden on the mobile card layout when true (e.g. duplicated info). */
  hideOnCard?: boolean;
  className?: string;
};

/**
 * Renders a real <table> from `md` up and a stack of labelled cards below it.
 * Tables never overflow the viewport on mobile — they become cards instead.
 */
export function DataList<T>({
  rows,
  columns,
  getRowKey,
  caption,
  empty,
  rowHref,
  className,
}: {
  rows: readonly T[];
  columns: ReadonlyArray<DataListColumn<T>>;
  getRowKey: (row: T) => string;
  caption: string;
  empty?: React.ReactNode;
  rowHref?: (row: T) => React.ReactNode;
  className?: string;
}) {
  if (rows.length === 0) {
    return <>{empty ?? null}</>;
  }

  return (
    <div className={className}>
      {/* Desktop */}
      <div className="scroll-x hidden md:block">
        <table className="w-full border-collapse text-sm">
          <caption className="sr-only">{caption}</caption>
          <thead>
            <tr className="border-border border-b">
              {columns.map((col) => (
                <th
                  key={col.key}
                  scope="col"
                  className="text-muted px-3 py-2.5 text-start text-xs font-semibold tracking-wide uppercase"
                >
                  {col.header}
                </th>
              ))}
              {rowHref ? (
                <th scope="col" className="px-3 py-2.5">
                  <span className="sr-only">Open</span>
                </th>
              ) : null}
            </tr>
          </thead>
          <tbody className="divide-border divide-y">
            {rows.map((row) => (
              <tr
                key={getRowKey(row)}
                className="hover:bg-surface-sunken align-top transition-colors"
              >
                {columns.map((col) => (
                  <td key={col.key} className={cn('text-ink px-3 py-3', col.className)}>
                    {col.cell(row)}
                  </td>
                ))}
                {rowHref ? <td className="px-3 py-3 text-end">{rowHref(row)}</td> : null}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile */}
      <ul className="flex flex-col gap-3 md:hidden">
        {rows.map((row) => (
          <li
            key={getRowKey(row)}
            className="border-border bg-surface rounded-[var(--radius-card)] border p-4 shadow-xs"
          >
            <dl className="flex flex-col gap-2.5">
              {columns
                .filter((col) => !col.hideOnCard)
                .map((col) => (
                  <div key={col.key} className="flex flex-col gap-0.5">
                    <dt className="text-muted text-xs font-semibold tracking-wide uppercase">
                      {col.header}
                    </dt>
                    <dd className="text-ink text-sm">{col.cell(row)}</dd>
                  </div>
                ))}
            </dl>
            {rowHref ? <div className="mt-3">{rowHref(row)}</div> : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
