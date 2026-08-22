import { ImageResponse } from 'next/og';

export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0A1020',
        }}
      >
        <svg width="118" height="118" viewBox="0 0 64 64">
          <path
            fill="#FFFFFF"
            d="M12 6h22a18 18 0 0 1 0 36h-4v10a2 2 0 0 1-2 2H12a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2Zm6 6v40h6V12h-6Zm12 0v24h4a12 12 0 0 0 0-24h-4Z"
          />
          <circle cx="27.5" cy="32" r="2.25" fill="#19B89A" />
        </svg>
      </div>
    ),
    size,
  );
}
