export type LegalSection = {
  id: string;
  heading: { en: string; bn: string };
  /** Markdown subset: paragraphs, `-` lists, `**bold**`. */
  body: { en: string; bn: string };
};

export type LegalDocumentSlug =
  | 'terms'
  | 'privacy'
  | 'refund-policy'
  | 'aml-kyc-policy'
  | 'legal-disclaimer'
  | 'cookie-policy'
  | 'complaints'
  | 'acceptable-use'
  | 'provider-disclosure'
  | 'electronic-consent';

export type LegalDocument = {
  slug: LegalDocumentSlug;
  titleKey: string;
  /** Recorded against every acceptance, so we know which text a customer saw. */
  version: string;
  lastUpdated: string;
  /**
   * Every document here is a working draft. It must be reviewed and approved by
   * qualified Bangladesh counsel (and, for the privacy and AML documents, by a
   * privacy/compliance professional) before public launch. The banner rendered
   * on each page says so, and this flag is what turns it on.
   */
  awaitingCounselReview: boolean;
  sections: LegalSection[];
};
