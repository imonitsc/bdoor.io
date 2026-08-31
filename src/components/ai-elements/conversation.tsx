'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowDown } from 'lucide-react';

import { cn } from '@/lib/utils/cn';

/**
 * Conversation: the scrollable transcript region.
 *
 * Sticks to the bottom while a response streams, but the moment the customer
 * scrolls up it stops following — yanking the viewport away from something
 * they are reading is worse than a missed token. The scroll button appears
 * whenever the view is not at the bottom.
 */

export function Conversation({
  className,
  children,
  ...props
}: React.ComponentProps<'div'>) {
  const viewport = useRef<HTMLDivElement>(null);
  const [atBottom, setAtBottom] = useState(true);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    viewport.current?.scrollTo({ top: viewport.current.scrollHeight, behavior });
  }, []);

  useEffect(() => {
    const node = viewport.current;
    if (!node) return;

    const onScroll = () => {
      setAtBottom(node.scrollHeight - node.scrollTop - node.clientHeight < 48);
    };
    node.addEventListener('scroll', onScroll, { passive: true });

    // Follow streamed content only while pinned to the bottom.
    const observer = new MutationObserver(() => {
      if (node.scrollHeight - node.scrollTop - node.clientHeight < 120) {
        node.scrollTop = node.scrollHeight;
      }
    });
    observer.observe(node, { childList: true, subtree: true, characterData: true });

    return () => {
      node.removeEventListener('scroll', onScroll);
      observer.disconnect();
    };
  }, []);

  return (
    <div className={cn('relative min-h-0 flex-1', className)} {...props}>
      <div
        ref={viewport}
        role="log"
        aria-live="polite"
        className="h-full overflow-y-auto overscroll-contain scroll-pb-4"
      >
        {children}
      </div>
      {!atBottom ? (
        <button
          type="button"
          onClick={() => scrollToBottom()}
          aria-label="Scroll to latest message"
          className="border-border bg-surface text-ink shadow-sm hover:bg-surface-sunken absolute bottom-3 left-1/2 inline-flex size-9 -translate-x-1/2 items-center justify-center rounded-full border"
        >
          <ArrowDown className="size-4" aria-hidden="true" />
        </button>
      ) : null}
    </div>
  );
}

export function ConversationContent({ className, ...props }: React.ComponentProps<'div'>) {
  return <div className={cn('mx-auto w-full max-w-3xl space-y-4 px-4 py-4', className)} {...props} />;
}
