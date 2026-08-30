import Image from 'next/image';
import { existsSync } from 'node:fs';
import path from 'node:path';

const SRC = '/images/bdoor/bdoor-founder-imon-cobalt.webp';
const ABS = path.join(process.cwd(), 'public', 'images', 'bdoor', 'bdoor-founder-imon-cobalt.webp');

/**
 * Whether the owner-supplied founder portrait is in the build. The hotfix
 * package that was meant to carry it arrived without the file; until it
 * lands the About founder section renders text-only — no placeholder text
 * and no substitute image (AI-generated people are forbidden here).
 */
export const FOUNDER_PORTRAIT_READY = existsSync(ABS);

/**
 * Founder portrait for the About page only — the hotfix keeps this artwork
 * off the homepage hero. 320–400px wide on desktop, at most 280px on
 * mobile. Renders nothing while the asset is absent.
 */
export function FounderPortrait({ alt }: { alt: string }) {
  if (!FOUNDER_PORTRAIT_READY) return null;

  return (
    <div className="relative mx-auto aspect-[4/5] w-full max-w-[280px] overflow-hidden rounded-xl lg:mx-0 lg:max-w-[400px]">
      <Image
        src={SRC}
        alt={alt}
        fill
        sizes="(min-width: 1024px) 400px, 280px"
        className="object-cover object-top"
      />
    </div>
  );
}
