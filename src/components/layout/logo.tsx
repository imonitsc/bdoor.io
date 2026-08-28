import Image from 'next/image';
import { cn } from '@/lib/utils/cn';

/**
 * The official bdoor lockups, served from the supplied production SVGs.
 *
 * These files come from `bdoor_branding/01_Logos/SVG/` and the wordmark in them
 * is converted to vector outlines. The brand guide is explicit that the
 * wordmark must not be recreated by typing it in a font, which is exactly what
 * this component used to do — it set the text "BDoor" in the UI typeface beside
 * a hand-drawn mark. Referencing the files rather than inlining their paths
 * means replacing the asset is a file swap, with no chance of the copy in the
 * component drifting from the package.
 *
 * The intrinsic size is the artboard, 760x180. Width and height are always
 * passed so the header reserves the right box and nothing shifts as it loads.
 */
const ARTBOARD = { width: 760, height: 180 } as const;

/** The bdoor symbol on its own, in full colour. */
export function BDoorSymbol({ className, title }: { className?: string; title?: string }) {
  return (
    <Image
      src="/brand/bdoor-symbol-colour.svg"
      alt={title ?? ''}
      aria-hidden={title ? undefined : true}
      width={64}
      height={64}
      className={cn('size-8', className)}
      priority
    />
  );
}

/**
 * The horizontal lockup.
 *
 * `inverse` selects the reversed artwork for dark surfaces rather than
 * recolouring the primary one — the reversed file is a separate supplied asset
 * with its own white wordmark, not a filtered copy.
 */
export function BDoorLogo({
  className,
  inverse = false,
  title = 'bdoor',
}: {
  className?: string;
  inverse?: boolean;
  title?: string;
}) {
  return (
    <Image
      src={inverse ? '/brand/bdoor-primary-reversed.svg' : '/brand/bdoor-primary-horizontal.svg'}
      alt={title}
      width={ARTBOARD.width}
      height={ARTBOARD.height}
      className={cn('h-8 w-auto', className)}
      priority
    />
  );
}
