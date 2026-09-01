import { useLocale, useTranslations } from 'next-intl';
import { Mail } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import {
  FOOTER_BANGLADESH_LINKS,
  FOOTER_COMPANY_LINKS,
  FOOTER_COUNTRY_LINKS,
  FOOTER_LEGAL_LINKS,
  FOOTER_PROFESSIONALS_LINKS,
  MARKETING_ROUTES,
} from '@/lib/navigation';
import { countryFooterLinks } from '@/content/international';
import { activeSocialProfiles } from '@/lib/social/profiles';
import { BDoorLogo } from './logo';
import { LocaleSwitcher } from './locale-switcher';
import { IndependenceDisclosure } from './disclosure';
import { SITE } from '@/lib/site';
import { COMPANY } from '@/content/company';

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
  const locale = useLocale();
  const year = new Date().getFullYear();
  const socialProfiles = activeSocialProfiles();

  return (
    <footer className="bg-surface-inverse text-ink-inverse">
      <div className="container-page py-14 md:py-16">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-[1.2fr_1fr_1fr_1fr_1fr]">
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
          </div>

          <FooterColumn
            heading={t('footer.bangladeshHeading')}
            links={FOOTER_BANGLADESH_LINKS.map((l) => ({ href: l.href, label: t(l.labelKey) }))}
          />
          <FooterColumn
            heading={t('footer.countriesHeading')}
            links={[
              ...FOOTER_COUNTRY_LINKS.map((l) => ({ href: l.href, label: t(l.labelKey) })),
              // Derived from the catalog (ROADMAP P5): a new country appears
              // here without touching navigation.
              ...countryFooterLinks().map((l) => ({
                href: l.href,
                label: locale === 'bn' ? l.name.bn : l.name.en,
              })),
            ]}
          />
          <div className="flex flex-col gap-8">
            <FooterColumn
              heading={t('footer.companyHeading')}
              links={FOOTER_COMPANY_LINKS.map((l) => ({ href: l.href, label: t(l.labelKey) }))}
            />
            <FooterColumn
              heading={t('footer.professionalsHeading')}
              links={FOOTER_PROFESSIONALS_LINKS.map((l) => ({
                href: l.href,
                label: t(l.labelKey),
              }))}
            />
          </div>
          <div className="flex flex-col gap-8">
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
                className="hover:text-ink-inverse mt-4 inline-flex items-center gap-2 rounded text-sm text-[color:var(--bd-offwhite)]/85 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--bd-cobalt-200)]"
              >
                <Mail className="size-4" aria-hidden="true" />
                {SITE.contactEmail}
              </a>
              <p className="text-muted-inverse mt-2 text-xs leading-relaxed">
                {t('footer.supportNote')}
              </p>
              {socialProfiles.length > 0 ? (
                <div className="mt-4">
                  <h2 className="text-muted-inverse text-xs font-semibold tracking-[0.1em] uppercase">
                    {t('footer.socialHeading')}
                  </h2>
                  <ul className="mt-3 flex flex-wrap gap-3">
                    {socialProfiles.map((profile) => (
                      <li key={profile.network}>
                        <a
                          href={profile.url!}
                          rel="me noopener noreferrer"
                          target="_blank"
                          className="hover:text-ink-inverse text-sm text-[color:var(--bd-offwhite)]/85 capitalize"
                        >
                          {profile.network}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          </div>
        </div>

        <div className="mt-12">
          <IndependenceDisclosure variant="inverse" />
        </div>

        <p className="text-muted-inverse mt-8 text-xs">
          © {year} {COMPANY.legalName}. {t('footer.rights')}
        </p>
      </div>
    </footer>
  );
}
