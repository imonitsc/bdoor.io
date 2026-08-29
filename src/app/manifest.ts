import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'bdoor — Your door to business in Bangladesh',
    short_name: 'bdoor',
    description:
      'Company formation, licences, tax setup, compliance and official documents for Bangladesh, in one secure workspace.',
    start_url: '/en',
    display: 'standalone',
    // Cloud and Midnight, from bdoor_branding/06_Design_Tokens/bdoor-tokens.json.
    background_color: '#F2F5F8',
    theme_color: '#081633',
    icons: [
      // PNGs, not the SVG: the convention serves icon.svg from a hashed URL
      // that cannot be written here, and installable icons want raster anyway.
      { src: '/brand/symbol-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/brand/symbol-512.png', sizes: '512x512', type: 'image/png' },
      { src: '/apple-icon.png', sizes: '1024x1024', type: 'image/png' },
    ],
    lang: 'en',
  };
}
