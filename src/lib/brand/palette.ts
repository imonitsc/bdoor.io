/**
 * The bdoor brand palette, from the redesign brief §5.2.
 *
 * These seven values are the brand and are used exactly as published. Three of
 * them cannot carry text: measured against white, Turquoise is 2.47:1,
 * Vermilion 3.77:1 and Marigold 1.66:1, so at their published values they are
 * fills, borders and large display type only.
 *
 * The brief also requires WCAG 2.2 AA (§24). Both hold together only if the
 * palette carries darkened companions for text, derived by scaling toward black
 * with the hue preserved until they reach 4.5:1 on white. `TEXT_SAFE` is those.
 *
 * Kept in TypeScript as well as CSS so the contrast rules can be tested rather
 * than asserted in a comment.
 */
export const BRAND = {
  cobalt: '#164EEB',
  vermilion: '#FF2630',
  turquoise: '#13B8AE',
  marigold: '#FFBE2E',
  midnight: '#081633',
  cloud: '#F2F5F8',
  white: '#FFFFFF',
} as const;

/**
 * Darkened companions for anything that has to be legible at body size.
 *
 * Derived against Cloud, not white. Cloud is the page canvas, so it is the
 * darkest light surface these ever sit on — deriving against white produced
 * values that cleared 4.5:1 there and landed at 4.16:1 on the actual
 * background, which the axe suite caught and the first version of the unit
 * test below did not.
 */
export const TEXT_SAFE = {
  turquoise: '#0D7D76',
  vermilion: '#DB2129',
  marigold: '#8F6A1A',
} as const;

/** WCAG 2.x relative luminance. */
export function luminance(hex: string): number {
  const channels = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const [r, g, b] = channels.map((c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!;
}

/** Contrast ratio between two hex colours, 1 to 21. */
export function contrastRatio(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi! + 0.05) / (lo! + 0.05);
}
