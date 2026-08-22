import { ImageResponse } from 'next/og';

export const alt = 'BDoor — Your door to business in Bangladesh';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

/**
 * Social card. Drawn with the brand palette and the door mark rather than a
 * stock photograph, and generated at build time so it stays in sync.
 */
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: 'linear-gradient(140deg, #0A1020 0%, #141C31 60%, #1B2947 100%)',
          padding: 72,
          color: '#F7F8F5',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
          <svg width="56" height="56" viewBox="0 0 64 64">
            <path
              fill="#7C9BFF"
              d="M12 6h22a18 18 0 0 1 0 36h-4v10a2 2 0 0 1-2 2H12a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2Zm6 6v40h6V12h-6Zm12 0v24h4a12 12 0 0 0 0-24h-4Z"
            />
            <circle cx="27.5" cy="32" r="2.25" fill="#3FD6BA" />
          </svg>
          <span style={{ fontSize: 44, fontWeight: 700, letterSpacing: -1 }}>BDoor</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <span style={{ fontSize: 22, color: '#3FD6BA', letterSpacing: 2, textTransform: 'uppercase' }}>
            Your door to business in Bangladesh
          </span>
          <span style={{ fontSize: 62, lineHeight: 1.1, fontWeight: 650, maxWidth: 900 }}>
            Start and run your business in Bangladesh—from anywhere.
          </span>
        </div>

        <span style={{ fontSize: 22, color: '#9AA8C0' }}>
          Independent platform · Partner professionals · Transparent fees
        </span>
      </div>
    ),
    size,
  );
}
