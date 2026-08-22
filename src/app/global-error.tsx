'use client';

/**
 * Last-resort boundary: this replaces the root layout, so it must render its
 * own <html> and cannot use next-intl (the provider is above it). Copy is
 * English-only by necessity and deliberately minimal.
 */
export default function GlobalError({ error }: { error: Error & { digest?: string } }) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: '100dvh',
          display: 'grid',
          placeItems: 'center',
          background: '#F7F8F5',
          color: '#111827',
          fontFamily: 'system-ui, sans-serif',
          padding: '2rem',
        }}
      >
        <main style={{ maxWidth: '32rem', textAlign: 'center' }}>
          <h1 style={{ fontSize: '1.75rem', margin: '0 0 0.75rem' }}>Something went wrong</h1>
          <p style={{ color: '#64748B', lineHeight: 1.6, margin: '0 0 1.5rem' }}>
            We hit an unexpected problem. Nothing you entered has been lost. Please reload the page,
            and quote this reference if you contact us.
          </p>
          {error.digest ? (
            <p style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: '#64748B' }}>
              Reference: {error.digest}
            </p>
          ) : null}
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages --
              This boundary replaces the root layout, so neither next/link nor
              the locale-aware Link has a provider to render inside. */}
          <a
            href="/en"
            style={{
              display: 'inline-block',
              marginTop: '1.5rem',
              background: '#315EFB',
              color: '#fff',
              padding: '0.75rem 1.25rem',
              borderRadius: 10,
              textDecoration: 'none',
              fontWeight: 500,
            }}
          >
            Go to the homepage
          </a>
        </main>
      </body>
    </html>
  );
}
