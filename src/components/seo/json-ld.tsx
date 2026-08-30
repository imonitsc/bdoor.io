import { COMPANY } from '@/content/company';
import { SITE, siteUrl } from '@/lib/site';

/**
 * schema.org structured data.
 *
 * Factual fields only: name, URL, contact and page structure. No address,
 * registration number, logo claims, ratings, reviews or aggregate figures —
 * bdoor has no verified ones, and inventing them for a rich result would be
 * the copy-rules violation the rest of the site avoids.
 */
function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      // Serialised on the server from repo-owned literals — nothing
      // user-supplied reaches this sink. `<` is escaped so no content can
      // close the script element early.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, '\\u003c') }}
    />
  );
}

export function OrganizationJsonLd() {
  return (
    <JsonLd
      data={{
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: COMPANY.legalName,
        alternateName: 'bdoor',
        url: siteUrl(),
        email: SITE.contactEmail,
      }}
    />
  );
}

export function BreadcrumbJsonLd({
  items,
}: {
  items: ReadonlyArray<{ name: string; path: string }>;
}) {
  return (
    <JsonLd
      data={{
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: items.map((item, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          name: item.name,
          item: `${siteUrl()}${item.path}`,
        })),
      }}
    />
  );
}

export function FaqJsonLd({ faqs }: { faqs: ReadonlyArray<{ question: string; answer: string }> }) {
  if (faqs.length === 0) return null;
  return (
    <JsonLd
      data={{
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: faqs.map((faq) => ({
          '@type': 'Question',
          name: faq.question,
          acceptedAnswer: { '@type': 'Answer', text: faq.answer },
        })),
      }}
    />
  );
}

export function ServiceJsonLd({
  name,
  description,
  path,
}: {
  name: string;
  description: string;
  path: string;
}) {
  return (
    <JsonLd
      data={{
        '@context': 'https://schema.org',
        '@type': 'Service',
        name,
        description,
        url: `${siteUrl()}${path}`,
        provider: { '@type': 'Organization', name: COMPANY.legalName, url: siteUrl() },
      }}
    />
  );
}
