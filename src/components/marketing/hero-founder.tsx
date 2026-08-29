import Image from 'next/image';

/**
 * The founder photograph that anchors the homepage hero.
 *
 * `fill` inside a parent that declares its own aspect ratio, rather than
 * intrinsic `width`/`height`. Both reserve the box before the file loads, but
 * the parent-ratio form also survives the artwork being re-exported at a
 * different pixel size: the box is unchanged and `contain` re-fits inside it.
 * With intrinsic dimensions, a re-export silently reintroduces layout shift.
 *
 * `contain`, never `cover`. The subject reaches every edge of the artboard —
 * the raised hand at the top, the laptop at the left, the interface cards at
 * the right — so any crop cuts something the composition depends on.
 *
 * No filter, no background and no blur placeholder: a transparent PNG has to
 * sit directly on the midnight hero, and anything painted behind it would
 * show up as a rectangle.
 */
export function HeroFounder({ alt, className }: { alt: string; className?: string }) {
  return (
    <div className={className}>
      {/*
        Capped and centred until the two-column layout kicks in. Left
        uncapped, a stacked tablet gave the photograph 92% of the viewport
        and pushed everything below it off the first screen; phones are
        narrow enough that the cap never binds there.
      */}
      <div className="relative mx-auto aspect-[3/2] w-full max-w-lg lg:max-w-none">
        <Image
          src="/images/bdoor-home-hero-founder.png"
          alt={alt}
          fill
          priority
          /*
            Measured against the rendered box rather than guessed, because a
            `sizes` that overstates makes the browser fetch a larger variant
            for no visible gain: a plain `55vw` pulled the 1920w file onto a
            1440px desktop where 1280w is already beyond 2x. Above 1440 the
            container stops growing, so the box is a fixed 620px; between
            1024 and 1440 it tracks the container at ~47vw; below that it is
            the max-w-lg cap, then very nearly the full viewport on a phone.
          */
          sizes="(min-width: 1440px) 620px, (min-width: 1024px) 47vw, (min-width: 640px) 512px, 92vw"
          className="object-contain object-bottom lg:object-right-bottom"
        />
      </div>
    </div>
  );
}
