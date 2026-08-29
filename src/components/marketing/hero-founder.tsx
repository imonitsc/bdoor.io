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
 * the right — so any crop cuts something the composition depends on. This is
 * also why the hero does not use the 4:5 portrait crop the door-photograph
 * slot was built for.
 *
 * No filter, no background and no blur placeholder: the PNG is cut out and
 * carries a real alpha channel, so it sits directly on the hero's canvas and
 * anything painted behind it would show up as a rectangle.
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
      <div className="relative mx-auto aspect-[3/2] w-full max-w-lg lg:mx-0 lg:max-w-none">
        <Image
          src="/images/bdoor-home-hero-founder.png"
          alt={alt}
          fill
          priority
          /*
            Measured against the rendered box rather than guessed, because a
            `sizes` that overstates makes the browser fetch a larger variant
            for no visible gain. The hero grid is 1.4fr/1fr with a 4rem gap
            inside a 1280px container, so above 1280 the right column is a
            fixed ~480px; between 1024 and 1280 it tracks the viewport at
            ~42vw; below that it is the max-w-lg cap, then very nearly the
            full viewport on a phone.
          */
          sizes="(min-width: 1280px) 480px, (min-width: 1024px) 42vw, (min-width: 640px) 512px, 92vw"
          className="object-contain object-bottom"
        />
      </div>
    </div>
  );
}
