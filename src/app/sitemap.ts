import type { MetadataRoute } from 'next';
import { locales } from '@/i18n/routing';
import { SITEMAP_ROUTES } from '@/lib/navigation';
import { countrySitemapEntries } from '@/content/international';
import { getResources, getServices } from '@/features/catalog/queries';
import { isPubliclyVisible } from '@/features/catalog/types';
import { localizedUrl } from '@/lib/site';

/**
 * Public routes only. Everything under /app, /partner and /admin is excluded
 * here and blocked in robots.txt as well.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [{ data: services }, { data: resources }] = await Promise.all([
    getServices(),
    getResources(),
  ]);

  const staticPaths = SITEMAP_ROUTES.map((route) => ({
    path: route.path,
    priority: route.priority,
    changeFrequency: route.changeFrequency,
    lastModified: undefined as Date | undefined,
  }));

  // Country pages derive from the catalog (ROADMAP P5): a new country
  // reaches the sitemap without a navigation edit.
  const countryPaths = countrySitemapEntries().map((entry) => ({
    path: entry.path,
    priority: entry.priority,
    changeFrequency: 'monthly' as const,
    lastModified: undefined as Date | undefined,
  }));

  const servicePaths = services.filter(isPubliclyVisible).map((service) => ({
    path: `/services/${service.slug}`,
    priority: 0.7,
    changeFrequency: 'monthly' as const,
    lastModified: service.timeReviewedAt ? new Date(service.timeReviewedAt) : undefined,
  }));

  const resourcePaths = resources.map((resource) => ({
    path: `/resources/${resource.slug}`,
    priority: 0.6,
    changeFrequency: 'monthly' as const,
    lastModified: resource.publishedAt ? new Date(resource.publishedAt) : undefined,
  }));

  return [...staticPaths, ...countryPaths, ...servicePaths, ...resourcePaths].flatMap((entry) =>
    locales.map((locale) => ({
      url: localizedUrl(locale, entry.path),
      lastModified: entry.lastModified,
      changeFrequency: entry.changeFrequency,
      priority: entry.priority,
      alternates: {
        languages: Object.fromEntries(
          locales.map((alt) => [alt === 'bn' ? 'bn-BD' : 'en', localizedUrl(alt, entry.path)]),
        ),
      },
    })),
  );
}
