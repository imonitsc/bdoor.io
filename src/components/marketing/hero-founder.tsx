import Image from 'next/image';

/**
 * The founder photograph that anchors the homepage hero.
 *
 * `fill` inside a parent that declares the artwork's own 1600:1495 ratio,
 * rather than intrinsic `width`/`height`. Both reserve the box before the file
 * loads, but the parent-ratio form also survives a re-export at a different
 * pixel size: the box is unchanged and `contain` re-fits inside it. With
 * intrinsic dimensions, a re-export silently reintroduces layout shift.
 *
 * `contain`, never `cover`. The subject reaches every edge of the artboard —
 * the raised hand at the top, the laptop at the left, the interface cards at
 * the right — so any crop cuts something the composition depends on. Because
 * the box carries the artwork's ratio, `contain` fills it exactly and no
 * letterboxing appears; `object-right-bottom` is the anchor if the two ever
 * diverge.
 *
 * No filter, no background and no blur placeholder: the WebP is cut out and
 * carries a real alpha channel, so it sits directly on the hero canvas and
 * anything painted behind it would show up as a rectangle.
 */
export function HeroFounder({ alt, className }: { alt: string; className?: string }) {
  return (
    <div className={className}>
      {/*
        Capped at 480px and centred while the layout is stacked — uncapped, a
        near-square photograph takes most of a phone screen and pushes the CTA
        below the fold. From xl the hero splits and the artwork runs up to
        760px, flush to the right of its column.
      */}
      <div className="relative mx-auto aspect-[1600/1495] w-full max-w-[30rem] lg:max-w-none xl:mr-0 xl:ml-auto xl:max-w-[47.5rem]">
        <Image
          src="/images/bdoor/bdoor-homepage-hero-large.webp"
          alt={alt}
          fill
          priority
          /*
            Measured against the rendered box rather than guessed, because a
            `sizes` that overstates makes the browser fetch a larger variant
            for no visible gain. From 1624px the 760px cap binds; between 1280
            and 1624 the column tracks the viewport a little under 55vw; below
            1280 the hero keeps its text-led 1.4/1 split, then the stacked cap
            and finally the phone viewport.
          */
          sizes="(min-width: 1624px) 760px, (min-width: 1280px) 55vw, (min-width: 1024px) 42vw, (min-width: 640px) 480px, 92vw"
          className="object-contain object-right-bottom"
        />
      </div>
    </div>
  );
}
