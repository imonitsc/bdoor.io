import Image from 'next/image';
import { existsSync } from 'node:fs';
import path from 'node:path';

const SRC = '/images/bdoor/open-door-dhaka.webp';
const ABS = path.join(process.cwd(), 'public', 'images', 'bdoor', 'open-door-dhaka.webp');

/**
 * Homepage hero image slot for `open-door-dhaka.webp`.
 * When the asset is absent, reserve the layout with a documented placeholder
 * — do not invent stock art (production-fix §4).
 */
export function HeroDoorImage({ alt }: { alt: string }) {
  const ready = existsSync(ABS);

  return (
    <div className="relative mx-auto aspect-[4/5] w-full max-w-md overflow-hidden rounded-xl lg:mx-0 lg:max-h-[560px] lg:max-w-none">
      {ready ? (
        <Image
          src={SRC}
          alt={alt}
          fill
          priority
          sizes="(min-width: 1024px) 440px, (min-width: 640px) 400px, 92vw"
          className="object-cover object-[70%_center]"
        />
      ) : (
        <div
          role="img"
          aria-label={alt}
          className="bg-surface-sunken border-border text-muted flex h-full min-h-[260px] w-full flex-col items-center justify-center gap-2 border border-dashed p-6 text-center text-sm md:min-h-[320px]"
          data-missing-asset="open-door-dhaka.webp"
        >
          <span className="font-medium">{alt}</span>
          <span className="text-xs">Missing asset: public/images/bdoor/open-door-dhaka.webp</span>
        </div>
      )}
    </div>
  );
}
