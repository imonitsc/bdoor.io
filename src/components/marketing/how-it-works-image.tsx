import Image from 'next/image';
import { existsSync } from 'node:fs';
import path from 'node:path';

const SRC = '/images/bdoor/compliance-review.webp';
const ABS = path.join(process.cwd(), 'public', 'images', 'bdoor', 'compliance-review.webp');

/**
 * Whether the owner-supplied compliance-review artwork is in the build.
 * The hotfix package that was meant to carry it arrived without the file,
 * so until it lands the section simply renders without an image column —
 * a customer must never see "Missing asset" text (that is what production
 * was showing), and no substitute may be invented.
 */
export const HOW_IT_WORKS_IMAGE_READY = existsSync(ABS);

/**
 * Homepage How-it-works image for `compliance-review.webp` (hotfix §5):
 * constrained to the 420–480px band, `object-contain`, no extra card.
 * Renders nothing while the asset is absent.
 */
export function HowItWorksImage({ alt }: { alt: string }) {
  if (!HOW_IT_WORKS_IMAGE_READY) return null;

  return (
    <div className="relative mx-auto aspect-[4/3] w-full max-w-[480px]">
      <Image
        src={SRC}
        alt={alt}
        fill
        sizes="(min-width: 1024px) 480px, (min-width: 640px) 440px, 92vw"
        className="object-contain object-center"
      />
    </div>
  );
}
