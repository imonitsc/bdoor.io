import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'BDoor — Your door to business in Bangladesh',
    short_name: 'BDoor',
    description:
      'Company formation, licences, tax setup, compliance and official documents for Bangladesh, in one secure workspace.',
    start_url: '/en',
    display: 'standalone',
    background_color: '#F7F8F5',
    theme_color: '#0A1020',
    icons: [
      { src: '/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
      { src: '/apple-icon', sizes: '180x180', type: 'image/png' },
    ],
    lang: 'en',
  };
}
