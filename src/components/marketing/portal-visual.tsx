/**
 * The hero visual: a doorway drawn in CSS/SVG rather than stock photography.
 *
 * Concentric arches recede toward a lit opening — the "door" the brand is named
 * for. Decorative, so it is hidden from assistive technology, and the animation
 * is a single slow fade that `prefers-reduced-motion` switches off globally.
 */
export function PortalVisual({ className }: { className?: string }) {
  return (
    <div className={className} aria-hidden="true">
      <svg viewBox="0 0 400 420" className="h-full w-full" role="presentation">
        <defs>
          <linearGradient id="bd-portal-depth" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1B2947" />
            <stop offset="100%" stopColor="#0A1020" />
          </linearGradient>
          <linearGradient id="bd-portal-light" x1="0.5" y1="0" x2="0.5" y2="1">
            <stop offset="0%" stopColor="#7C9BFF" stopOpacity="0.95" />
            <stop offset="55%" stopColor="#315EFB" stopOpacity="0.75" />
            <stop offset="100%" stopColor="#19B89A" stopOpacity="0.55" />
          </linearGradient>
          <clipPath id="bd-portal-clip">
            <path d="M60 400V150a140 140 0 0 1 280 0v250Z" />
          </clipPath>
        </defs>

        <rect width="400" height="420" fill="url(#bd-portal-depth)" rx="20" />

        <g clipPath="url(#bd-portal-clip)">
          {[0, 1, 2, 3, 4].map((i) => {
            const inset = i * 26;
            return (
              <path
                key={i}
                d={`M${60 + inset} 400V${150 + inset * 0.55}a${140 - inset} ${140 - inset} 0 0 1 ${
                  280 - inset * 2
                } 0v${250 - inset * 0.55}Z`}
                fill="none"
                stroke="#3C4A6B"
                strokeOpacity={0.45 - i * 0.06}
                strokeWidth="1.5"
              />
            );
          })}

          {/* The opening itself. */}
          <path
            d="M190 400V236a52 52 0 0 1 104 0v164Z"
            transform="translate(-42 0)"
            fill="url(#bd-portal-light)"
          />

          {/* Floor light spill. */}
          <ellipse cx="200" cy="400" rx="120" ry="26" fill="#315EFB" opacity="0.22" />
        </g>

        {/* Frame */}
        <path
          d="M60 400V150a140 140 0 0 1 280 0v250"
          fill="none"
          stroke="#4C5E85"
          strokeOpacity="0.7"
          strokeWidth="2"
        />
        <line x1="30" y1="400" x2="370" y2="400" stroke="#4C5E85" strokeOpacity="0.5" strokeWidth="2" />

        {/* Handle — the small teal dot that also appears in the logo. */}
        <circle cx="176" cy="300" r="4.5" fill="#19B89A" />
      </svg>
    </div>
  );
}
