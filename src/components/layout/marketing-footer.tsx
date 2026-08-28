import { useTranslations } from 'next-intl';
import { Mail } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import {
  FOOTER_COMPANY_LINKS,
  FOOTER_INDUSTRY_LINKS,
  FOOTER_INTERNATIONAL_LINKS,
  FOOTER_LEGAL_LINKS,
  FOOTER_SERVICE_LINKS,
  MARKETING_ROUTES,
} from '@/lib/navigation';
import { getPublicSocial } from '@/features/directory/queries';
import { BDoorLogo } from './logo';
import { LocaleSwitcher } from './locale-switcher';
import { IndependenceDisclosure } from './disclosure';
import { SITE } from '@/lib/site';

function FooterColumn({
  heading,
  links,
}: {
  heading: string;
  links: ReadonlyArray<{ href: string; label: string }>;
}) {
  return (
    <div>
      <h2 className="text-muted-inverse text-xs font-semibold tracking-[0.1em] uppercase">
        {heading}
      </h2>
      <ul className="mt-4 flex flex-col gap-2.5">
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="hover:text-ink-inverse inline-block rounded text-sm text-[color:var(--bd-offwhite)]/85 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--bd-cobalt-200)]"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function MarketingFooter() {
  const t = useTranslations();
  const year = new Date().getFullYear();
  const social = getPublicSocial();

  return (
    <footer className="bg-surface-inverse text-ink-inverse">
      <div className="container-page py-14 md:py-16">
        <div className="grid gap-10 md:grid-cols-2 xl:grid-cols-[1.3fr_1fr_1fr_1fr_1fr]">
          <div className="flex flex-col gap-4">
            <Link
              href={MARKETING_ROUTES.home}
              className="w-fit rounded focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[color:var(--bd-cobalt-200)]"
            >
              <BDoorLogo inverse />
            </Link>
            <p className="text-muted-inverse max-w-xs text-sm leading-relaxed">
              {t('brand.promise')}
            </p>
            <div className="mt-1">
              <LocaleSwitcher inverse />
            </div>
            {social.length > 0 ? (
              <ul className="mt-2 flex flex-wrap gap-3">
                {social.map((profile) => (
                  <li key={profile.network}>
                    <a
                      href={profile.url!}
                      rel="me noopener noreferrer"
                      target="_blank"
                      className="hover:text-ink-inverse inline-flex min-h-11 items-center rounded text-sm text-[color:var(--bd-offwhite)]/85 underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--bd-cobalt-200)]"
                    >
                      {t(`footer.social.${profile.network}`)}
                    </a>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>

          <FooterColumn
            heading={t('footer.servicesHeading')}
            links={FOOTER_SERVICE_LINKS.map((l) => ({ href: l.href, label: t(l.labelKey) }))}
          />
          <FooterColumn
            heading={t('footer.internationalHeading')}
            links={FOOTER_INTERNATIONAL_LINKS.map((l) => ({ href: l.href, label: t(l.labelKey) }))}
          />
          <FooterColumn
            heading={t('footer.industriesHeading')}
            links={FOOTER_INDUSTRY_LINKS.map((l) => ({ href: l.href, label: t(l.labelKey) }))}
          />
          <div className="flex flex-col gap-8">
            <FooterColumn
              heading={t('footer.companyHeading')}
              links={FOOTER_COMPANY_LINKS.map((l) => ({ href: l.href, label: t(l.labelKey) }))}
            />
            <FooterColumn
              heading={t('footer.legalHeading')}
              links={FOOTER_LEGAL_LINKS.map((l) => ({ href: l.href, label: t(l.labelKey) }))}
            />
            <div>
              <h2 className="text-muted-inverse text-xs font-semibold tracking-[0.1em] uppercase">
                {t('footer.contactHeading')}
              </h2>
              <a
                href={`mailto:${SITE.contactEmail}`}
                className="hover:text-ink-inverse mt-4 inline-flex min-h-11 items-center gap-2 rounded text-sm text-[color:var(--bd-offwhite)]/85 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--bd-cobalt-200)]"
              >
                <Mail className="size-4" aria-hidden="true" />
                {SITE.contactEmail}
              </a>
              <p className="text-muted-inverse mt-2 text-xs leading-relaxed">
                {t('footer.supportNote')}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-12">
          <IndependenceDisclosure variant="inverse" />
        </div>

        <p className="text-muted-inverse mt-8 text-xs">
          © {year} {t('brand.name')}. {t('footer.rights')}
        </p>
      </div>
    </footer>
  );
}
