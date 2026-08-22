'use client';

import * as React from 'react';

type Announcement = { message: string; assertive: boolean; id: number };

const AnnouncerContext = React.createContext<((message: string, assertive?: boolean) => void) | null>(
  null,
);

/**
 * A single pair of live regions for the whole app. Upload progress, validation
 * failures and case status changes announce through here so screen-reader users
 * are told what happened without a visual-only toast.
 */
export function AnnouncerProvider({ children }: { children: React.ReactNode }) {
  const [polite, setPolite] = React.useState<Announcement | null>(null);
  const [assertive, setAssertive] = React.useState<Announcement | null>(null);
  const counter = React.useRef(0);

  const announce = React.useCallback((message: string, isAssertive = false) => {
    counter.current += 1;
    const next = { message, assertive: isAssertive, id: counter.current };
    if (isAssertive) setAssertive(next);
    else setPolite(next);
  }, []);

  return (
    <AnnouncerContext.Provider value={announce}>
      {children}
      <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {polite?.message ?? ''}
      </div>
      <div className="sr-only" role="alert" aria-live="assertive" aria-atomic="true">
        {assertive?.message ?? ''}
      </div>
    </AnnouncerContext.Provider>
  );
}

export function useAnnounce() {
  const ctx = React.useContext(AnnouncerContext);
  return React.useCallback(
    (message: string, assertive = false) => {
      ctx?.(message, assertive);
    },
    [ctx],
  );
}
