import type { MetadataRoute } from 'next';
import { locales } from '@/i18n/routing';
import { SITEMAP_ROUTES } from '@/lib/navigation';
import { getResources, getServices } from '@/features/catalog/queries';
import { getAuthorities, getCountries, getIndustries } from '@/features/directory/queries';
import { localizedUrl } from '@/lib/site';

/**
 * Public routes only. Everything under /app, /partner and /admin is excluded
 * here and blocked in robots.txt as well.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [
    { data: services },
    { data: resources },
    { data: industries },
    { data: countries },
    { data: authorities },
  ] = await Promise.all([
    getServices(),
    getResources(),
    getIndustries(),
    getCountries(),
    getAuthorities(),
  ]);

  const staticPaths = SITEMAP_ROUTES.map((route) => ({
    path: route.path,
    priority: route.priority,
    changeFrequency: route.changeFrequency,
    lastModified: undefined as Date | undefined,
  }));

  const servicePaths = services.map((service) => ({
    path: `/services/${service.slug}`,
    priority: service.status === 'published' ? 0.7 : 0.4,
    changeFrequency: 'monthly' as const,
    lastModified: service.timeReviewedAt ? new Date(service.timeReviewedAt) : undefined,
  }));

  const industryPaths = industries.map((row) => ({
    path: `/industries/${row.slug}`,
    priority: 0.55,
    changeFrequency: 'monthly' as const,
    lastModified: undefined as Date | undefined,
  }));

  const countryPaths = countries.map((row) => ({
    path: `/international/${row.slug}`,
    priority: row.isFlagship ? 0.7 : 0.45,
    changeFrequency: 'monthly' as const,
    lastModified: undefined as Date | undefined,
  }));

  const authorityPaths = authorities.map((row) => ({
    path: `/authorities/${row.slug}`,
    priority: 0.4,
    changeFrequency: 'monthly' as const,
    lastModified: undefined as Date | undefined,
  }));

  const resourcePaths = resources.map((resource) => ({
    path: `/resources/${resource.slug}`,
    priority: 0.6,
    changeFrequency: 'monthly' as const,
    lastModified: resource.publishedAt ? new Date(resource.publishedAt) : undefined,
  }));

  return [
    ...staticPaths,
    ...servicePaths,
    ...industryPaths,
    ...countryPaths,
    ...authorityPaths,
    ...resourcePaths,
  ].flatMap((entry) =>
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
