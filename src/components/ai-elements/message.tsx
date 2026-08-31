'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Sparkles } from 'lucide-react';

import { cn } from '@/lib/utils/cn';

/**
 * Message: one turn of the conversation.
 *
 * User turns sit right in a soft bubble; assistant turns sit left, marked by
 * the bdoor AI avatar, and render Markdown — the model writes lists and
 * emphasis, and plain text renders them as noise. react-markdown escapes raw
 * HTML by default, which is the property that matters: model output and
 * retrieved content are never interpreted as markup.
 */

export function Message({
  from,
  className,
  children,
  ...props
}: React.ComponentProps<'div'> & { from: 'user' | 'assistant' }) {
  return (
    <div
      data-role={from}
      className={cn('flex w-full gap-2.5', from === 'user' ? 'justify-end' : 'justify-start', className)}
      {...props}
    >
      {children}
    </div>
  );
}

/** The bdoor AI mark: the wordmark initial with a spark, no robots. */
export function BdoorAiAvatar({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'bg-primary text-on-primary relative inline-flex size-7 shrink-0 items-center justify-center rounded-[var(--radius-control)] text-sm font-semibold select-none',
        className,
      )}
    >
      b
      <Sparkles className="absolute -top-1 -right-1 size-3 text-[color:var(--color-warning,#eab308)]" />
    </span>
  );
}

export function MessageContent({
  from,
  className,
  children,
  ...props
}: React.ComponentProps<'div'> & { from: 'user' | 'assistant' }) {
  return (
    <div
      className={cn(
        'min-w-0 text-sm leading-relaxed',
        from === 'user'
          ? 'bg-primary-soft text-ink max-w-[85%] rounded-[var(--radius-panel)] px-3.5 py-2 whitespace-pre-wrap'
          : 'text-ink max-w-full flex-1',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

/** Markdown for assistant answers. Compact, readable, table-safe. */
export function MessageMarkdown({ children }: { children: string }) {
  return (
    <div className="space-y-2.5 [&_ol]:list-decimal [&_ol]:space-y-1 [&_ol]:ps-5 [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:ps-5">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => <p className="text-ink pt-1 font-semibold">{children}</p>,
          h2: ({ children }) => <p className="text-ink pt-1 font-semibold">{children}</p>,
          h3: ({ children }) => <p className="text-ink pt-1 font-semibold">{children}</p>,
          h4: ({ children }) => <p className="text-ink pt-1 font-semibold">{children}</p>,
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noreferrer noopener"
              className="text-primary underline underline-offset-2"
            >
              {children}
            </a>
          ),
          code: ({ children }) => (
            <code className="bg-surface-sunken rounded px-1 py-0.5 text-[0.85em]">{children}</code>
          ),
          table: ({ children }) => (
            <div className="overflow-x-auto">
              <table className="border-border w-full border-collapse text-start text-xs [&_td]:border [&_td]:px-2 [&_td]:py-1.5 [&_th]:border [&_th]:px-2 [&_th]:py-1.5 [&_th]:font-semibold">
                {children}
              </table>
            </div>
          ),
          blockquote: ({ children }) => (
            <blockquote className="border-border text-muted border-s-2 ps-3">{children}</blockquote>
          ),
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
