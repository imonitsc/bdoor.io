import { existsSync, readFileSync } from 'node:fs';
import { inflateSync } from 'node:zlib';
import { describe, expect, it } from 'vitest';

/**
 * The homepage hero founder photograph.
 *
 * The hero foundation is midnight navy, and the artwork sits directly on it
 * with nothing painted behind. That only works if the PNG carries a real alpha
 * channel: an opaque export renders as a light rectangle on the navy, which
 * looks like a broken asset rather than a design choice. The failure is
 * invisible to typecheck, lint and the build — the file loads fine, it is just
 * wrong — so it is asserted here instead.
 *
 * A hand-rolled reader rather than a dependency: the repository ships no image
 * library, and this needs three facts (dimensions, colour type, whether any
 * pixel is genuinely non-opaque) that are cheap to read directly.
 */
const PATH = 'public/images/bdoor-home-hero-founder.png';

const SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

/** PNG colour types that carry a per-pixel alpha sample. */
const GREYSCALE_ALPHA = 4;
const TRUECOLOUR_ALPHA = 6;

function readChunks(file: Buffer) {
  const chunks: { tag: string; data: Buffer }[] = [];
  let offset = SIGNATURE.length;
  while (offset < file.length) {
    const length = file.readUInt32BE(offset);
    const tag = file.subarray(offset + 4, offset + 8).toString('ascii');
    chunks.push({ tag, data: file.subarray(offset + 8, offset + 8 + length) });
    offset += length + 12; // length + tag + data + crc
  }
  return chunks;
}

function paeth(a: number, b: number, c: number) {
  const p = a + b - c;
  const pa = Math.abs(p - a);
  const pb = Math.abs(p - b);
  const pc = Math.abs(p - c);
  if (pa <= pb && pa <= pc) return a;
  return pb <= pc ? b : c;
}

/** Undo the per-scanline filters and return the raw samples. */
function unfilter(raw: Buffer, width: number, height: number, bytesPerPixel: number) {
  const stride = width * bytesPerPixel;
  const out = Buffer.alloc(stride * height);

  for (let y = 0; y < height; y += 1) {
    const filter = raw[y * (stride + 1)];
    const line = raw.subarray(y * (stride + 1) + 1, y * (stride + 1) + 1 + stride);

    for (let x = 0; x < stride; x += 1) {
      const left = x >= bytesPerPixel ? out[y * stride + x - bytesPerPixel]! : 0;
      const up = y > 0 ? out[(y - 1) * stride + x]! : 0;
      const upLeft = y > 0 && x >= bytesPerPixel ? out[(y - 1) * stride + x - bytesPerPixel]! : 0;
      const value = line[x]!;

      let restored: number;
      switch (filter) {
        case 0:
          restored = value;
          break;
        case 1:
          restored = value + left;
          break;
        case 2:
          restored = value + up;
          break;
        case 3:
          restored = value + ((left + up) >> 1);
          break;
        case 4:
          restored = value + paeth(left, up, upLeft);
          break;
        default:
          throw new Error(`unknown PNG filter ${filter} on row ${y}`);
      }
      out[y * stride + x] = restored & 0xff;
    }
  }
  return out;
}

describe('the homepage hero founder image', () => {
  /**
   * The file is supplied by the owner and is legitimately absent until then:
   * the hero renders the workspace preview as its visual in that case (a
   * build-time switch in the homepage), so absence is a known state, not a
   * defect. What is never acceptable is the file existing in the WRONG form —
   * an opaque export renders as a pale rectangle on the midnight hero.
   */
  it.skipIf(!existsSync(PATH))(
    'placeholder so the suite names the absent-image state explicitly',
    () => {
      // Covered by the e2e fallback assertions when the file is absent.
    },
  );

  it.skipIf(!existsSync(PATH))('is a PNG with an alpha channel, and actually uses it', () => {
    const file = readFileSync(PATH);
    expect(file.subarray(0, 8).equals(SIGNATURE), 'not a PNG').toBe(true);

    const chunks = readChunks(file);
    const header = chunks.find((c) => c.tag === 'IHDR');
    expect(header, 'no IHDR chunk').toBeDefined();

    const width = header!.data.readUInt32BE(0);
    const height = header!.data.readUInt32BE(4);
    const bitDepth = header!.data.readUInt8(8);
    const colourType = header!.data.readUInt8(9);
    const interlaced = header!.data.readUInt8(12);

    expect(width).toBeGreaterThan(0);
    expect(height).toBeGreaterThan(0);

    expect(
      [GREYSCALE_ALPHA, TRUECOLOUR_ALPHA].includes(colourType),
      `colour type ${colourType} carries no alpha channel. The hero sits on midnight ` +
        'navy, so an opaque export shows as a pale rectangle. Re-export with transparency.',
    ).toBe(true);

    // Every case below assumes a non-interlaced 8-bit export, which is what
    // every mainstream tool produces. Fail loudly rather than quietly passing.
    expect(bitDepth, 'expected an 8-bit PNG').toBe(8);
    expect(interlaced, 'expected a non-interlaced PNG').toBe(0);

    const samplesPerPixel = colourType === TRUECOLOUR_ALPHA ? 4 : 2;
    const idat = Buffer.concat(chunks.filter((c) => c.tag === 'IDAT').map((c) => c.data));
    const pixels = unfilter(inflateSync(idat), width, height, samplesPerPixel);

    let transparent = 0;
    for (let i = samplesPerPixel - 1; i < pixels.length; i += samplesPerPixel) {
      if (pixels[i]! < 255) transparent += 1;
    }

    expect(
      transparent,
      'every pixel is fully opaque, so the alpha channel is decorative. The subject has ' +
        'not been cut out and the hero will show a rectangle against the navy.',
    ).toBeGreaterThan(0);
  });
});
