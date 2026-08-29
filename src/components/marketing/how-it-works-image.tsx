import Image from 'next/image';
import { existsSync } from 'node:fs';
import path from 'node:path';

const SRC = '/images/bdoor/compliance-review.webp';
const ABS = path.join(process.cwd(), 'public', 'images', 'bdoor', 'compliance-review.webp');

/**
 * Homepage How-it-works image slot for `compliance-review.webp`.
 * Layout-ready when the owner drops the file in; no stock substitute.
 */
export function HowItWorksImage({ alt }: { alt: string }) {
  const ready = existsSync(ABS);

  return (
    <div className="relative mx-auto aspect-[4/3] w-full max-w-lg overflow-hidden rounded-xl lg:mx-0 lg:max-h-[440px] lg:max-w-none">
      {ready ? (
        <Image
          src={SRC}
          alt={alt}
          fill
          sizes="(min-width: 1024px) 520px, (min-width: 640px) 480px, 92vw"
          className="object-cover object-center"
        />
      ) : (
        <div
          role="img"
          aria-label={alt}
          className="bg-surface-sunken border-border text-muted flex h-full min-h-[220px] w-full flex-col items-center justify-center gap-2 border border-dashed p-6 text-center text-sm"
          data-missing-asset="compliance-review.webp"
        >
          <span className="font-medium">{alt}</span>
          <span className="text-xs">Missing asset: public/images/bdoor/compliance-review.webp</span>
        </div>
      )}
    </div>
  );
}
