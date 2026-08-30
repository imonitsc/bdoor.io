import Image from 'next/image';
import { existsSync } from 'node:fs';
import path from 'node:path';

const SRC = '/images/bdoor/formation-documents.webp';
const ABS = path.join(process.cwd(), 'public', 'images', 'bdoor', 'formation-documents.webp');

/**
 * Whether the owner-supplied formation-documents artwork is in the build.
 * The hotfix package that was meant to carry it arrived without the file;
 * until it lands the Services introduction renders without the image — a
 * customer must never see "Missing asset" text, and no substitute may be
 * invented.
 */
export const FORMATION_DOCUMENTS_IMAGE_READY = existsSync(ABS);

/**
 * Services image for `formation-documents.webp`, used once near the
 * introduction (hotfix §5). Renders nothing while the asset is absent.
 */
export function FormationDocumentsImage({ alt }: { alt: string }) {
  if (!FORMATION_DOCUMENTS_IMAGE_READY) return null;

  return (
    <div className="relative mx-auto aspect-[16/10] w-full max-w-xl overflow-hidden rounded-xl">
      <Image
        src={SRC}
        alt={alt}
        fill
        sizes="(min-width: 1024px) 560px, 92vw"
        className="object-cover object-center"
      />
    </div>
  );
}
