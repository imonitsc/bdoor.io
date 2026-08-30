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
  /** The date this version started to apply. A new version gets a new date. */
  effectiveFrom: string;
  lastUpdated: string;
  /**
   * When true the page renders the working-draft banner. The suite was
   * published as 1.0 on the owner's instruction (30 Aug 2026); the flag stays
   * so a future in-progress revision can honestly mark itself as a draft.
   */
  awaitingCounselReview: boolean;
  sections: LegalSection[];
};
