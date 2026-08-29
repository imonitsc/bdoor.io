import Image from 'next/image';
import { existsSync } from 'node:fs';
import path from 'node:path';

const SRC = '/images/bdoor/formation-documents.webp';
const ABS = path.join(process.cwd(), 'public', 'images', 'bdoor', 'formation-documents.webp');

/**
 * Services/Pricing image slot for `formation-documents.webp` (once only).
 * Homepage must not use this asset.
 */
export function FormationDocumentsImage({ alt }: { alt: string }) {
  const ready = existsSync(ABS);

  return (
    <div className="relative mx-auto aspect-[16/10] w-full max-w-xl overflow-hidden rounded-xl">
      {ready ? (
        <Image
          src={SRC}
          alt={alt}
          fill
          sizes="(min-width: 1024px) 560px, 92vw"
          className="object-cover object-center"
        />
      ) : (
        <div
          role="img"
          aria-label={alt}
          className="bg-surface-sunken border-border text-muted flex h-full min-h-[180px] w-full flex-col items-center justify-center gap-2 border border-dashed p-6 text-center text-sm"
          data-missing-asset="formation-documents.webp"
        >
          <span className="font-medium">{alt}</span>
          <span className="text-xs">
            Missing asset: public/images/bdoor/formation-documents.webp
          </span>
        </div>
      )}
    </div>
  );
}
