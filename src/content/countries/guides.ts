/**
 * Educational country guides for the six international routes.
 *
 * Everything here is register-interest-safe: structural requirements,
 * customer document checklists, ongoing obligations and honest FAQs — and
 * deliberately NOT fees, timelines or availability promises. Statutory
 * figures live only in the catalog's internal fee components and in
 * docs/COUNTRY_SOURCES.md until a route's price sheet is approved; a
 * currency figure in this file would be rendered on a page whose tests
 * forbid one. Time estimates are omitted entirely until a contracted
 * partner validates them ("typically" wording needs evidence too).
 *
 * Content derives from the seven-country research (29 Aug 2026); the
 * authority sources behind each statement are in docs/COUNTRY_SOURCES.md,
 * and `reviewedAt` below is the research date.
 */

type Text = { en: string; bn: string };

export type CountryGuide = {
  countrySlug: string;
  reviewedAt: string;
  /** Structural and eligibility requirements of the route. */
  requirements: Text[];
  /** What the customer should expect to provide. */
  documents: Text[];
  /** Recurring obligations after formation. */
  obligations: Text[];
  faq: Array<{ q: Text; a: Text }>;
};

export const COUNTRY_GUIDES: readonly CountryGuide[] = [
  {
    countrySlug: 'usa',
    reviewedAt: '2026-08-29',
    requirements: [
      {
        en: 'A Wyoming LLC and a Delaware C-Corp are different products with different recurring obligations — the route is chosen for your situation, never sold as a generic "USA company".',
        bn: 'ওয়াইমিং LLC এবং ডেলাওয়্যার C-Corp ভিন্ন পণ্য, যাদের চলমান বাধ্যবাধকতাও ভিন্ন — রুটটি আপনার পরিস্থিতি অনুযায়ী বাছাই হয়, কখনোই সাধারণ "USA কোম্পানি" হিসেবে বিক্রি হয় না।',
      },
      {
        en: 'Every US company needs a registered agent in its state of formation.',
        bn: 'প্রতিটি মার্কিন কোম্পানির গঠনের রাজ্যে একজন নিবন্ধিত এজেন্ট প্রয়োজন।',
      },
      {
        en: 'The IRS issues EINs without a fee; a founder without a US principal place of business cannot use the standard online route and may need to apply by phone, fax or mail.',
        bn: 'IRS বিনা ফিতে EIN দেয়; যুক্তরাষ্ট্রে প্রধান ব্যবসাস্থল না থাকলে সাধারণ অনলাইন পথ ব্যবহার করা যায় না — ফোন, ফ্যাক্স বা ডাকযোগে আবেদন লাগতে পারে।',
      },
    ],
    documents: [
      { en: 'Passport for every owner and manager', bn: 'প্রত্যেক মালিক ও ম্যানেজারের পাসপোর্ট' },
      { en: 'Recent proof of address', bn: 'সাম্প্রতিক ঠিকানার প্রমাণ' },
      {
        en: 'Ownership details and beneficial-owner information',
        bn: 'মালিকানার বিবরণ ও প্রকৃত সুবিধাভোগীর তথ্য',
      },
      {
        en: 'Business purpose and responsible-party details for the EIN application',
        bn: 'EIN আবেদনের জন্য ব্যবসার উদ্দেশ্য ও দায়িত্বপ্রাপ্ত ব্যক্তির বিবরণ',
      },
    ],
    obligations: [
      {
        en: 'An annual state report (Wyoming assesses its fee on in-state assets) and registered-agent renewal',
        bn: 'বার্ষিক রাজ্য প্রতিবেদন (ওয়াইমিং রাজ্যস্থিত সম্পদের ভিত্তিতে ফি নির্ধারণ করে) ও নিবন্ধিত-এজেন্ট নবায়ন',
      },
      {
        en: 'Federal tax filings for foreign-owned companies, and state obligations where activity creates them',
        bn: 'বিদেশি-মালিকানাধীন কোম্পানির ফেডারেল কর দাখিল, এবং কার্যক্রম অনুযায়ী রাজ্য বাধ্যবাধকতা',
      },
    ],
    faq: [
      {
        q: { en: 'Is a US bank account included?', bn: 'মার্কিন ব্যাংক হিসাব কি অন্তর্ভুক্ত?' },
        a: {
          en: 'No. Banking application support can be part of a route, but every account decision belongs to the bank.',
          bn: 'না। ব্যাংক আবেদনে সহায়তা রুটের অংশ হতে পারে, কিন্তু হিসাব খোলার সিদ্ধান্ত সবসময় ব্যাংকের।',
        },
      },
      {
        q: { en: 'Which state should I choose?', bn: 'কোন রাজ্য বেছে নেব?' },
        a: {
          en: 'It depends on what the company is for: a lean online business points one way, a startup planning to raise investment another. The assessment asks exactly this before any recommendation.',
          bn: 'কোম্পানির উদ্দেশ্যের উপর নির্ভর করে: ছোট অনলাইন ব্যবসা এক দিকে, বিনিয়োগ তুলতে চাওয়া স্টার্টআপ আরেক দিকে। সুপারিশের আগে মূল্যায়নে ঠিক এটিই জিজ্ঞাসা করা হয়।',
        },
      },
    ],
  },
  {
    countrySlug: 'uk',
    reviewedAt: '2026-08-29',
    requirements: [
      {
        en: 'A private limited company needs at least one director and one shareholder, a registered office address and a SIC activity code.',
        bn: 'একটি প্রাইভেট লিমিটেড কোম্পানির অন্তত একজন পরিচালক ও একজন শেয়ারহোল্ডার, নিবন্ধিত অফিস ঠিকানা এবং SIC কার্যক্রম কোড প্রয়োজন।',
      },
      {
        en: 'People with significant control (PSCs) are identified on the public register.',
        bn: 'উল্লেখযোগ্য নিয়ন্ত্রণধারী ব্যক্তিরা (PSC) পাবলিক রেজিস্টারে চিহ্নিত হন।',
      },
      {
        en: 'Companies House identity verification applies to directors and PSCs; an authorised agent (ACSP) may verify identity.',
        bn: 'পরিচালক ও PSC-দের জন্য কোম্পানিজ হাউস পরিচয় যাচাই প্রযোজ্য; একটি অনুমোদিত এজেন্ট (ACSP) পরিচয় যাচাই করতে পারে।',
      },
    ],
    documents: [
      { en: 'Passport or accepted photo ID', bn: 'পাসপোর্ট বা গ্রহণযোগ্য ফটো আইডি' },
      { en: 'Recent address evidence', bn: 'সাম্প্রতিক ঠিকানার প্রমাণ' },
      {
        en: 'Director, shareholder and PSC details with share capital',
        bn: 'পরিচালক, শেয়ারহোল্ডার ও PSC বিবরণ এবং শেয়ার মূলধন',
      },
      {
        en: 'Identity-verification data and personal codes as the regime requires',
        bn: 'নিয়ম অনুযায়ী পরিচয়-যাচাই তথ্য ও ব্যক্তিগত কোড',
      },
    ],
    obligations: [
      {
        en: 'An annual confirmation statement and annual accounts',
        bn: 'বার্ষিক কনফার্মেশন স্টেটমেন্ট ও বার্ষিক হিসাব',
      },
      {
        en: 'A corporation-tax return, plus VAT and payroll duties where the company registers for them',
        bn: 'কর্পোরেশন-কর রিটার্ন, এবং নিবন্ধিত হলে ভ্যাট ও বেতন-সংক্রান্ত দায়িত্ব',
      },
    ],
    faq: [
      {
        q: {
          en: 'Can a non-resident own a UK company?',
          bn: 'একজন অনাবাসী কি যুক্তরাজ্যের কোম্পানির মালিক হতে পারেন?',
        },
        a: {
          en: 'Yes — but identity verification, a registered office and ongoing filings still apply, and banking is a separate application the bank decides.',
          bn: 'হ্যাঁ — তবে পরিচয় যাচাই, নিবন্ধিত অফিস ও চলমান দাখিল প্রযোজ্য থাকে, এবং ব্যাংকিং আলাদা আবেদন যার সিদ্ধান্ত ব্যাংক নেয়।',
        },
      },
      {
        q: {
          en: 'Is incorporation the same as tax registration?',
          bn: 'কোম্পানি গঠন কি কর নিবন্ধনের সমান?',
        },
        a: {
          en: 'No. Incorporation, registered-office service, accounting and tax registrations are distinct services and are scoped separately.',
          bn: 'না। গঠন, নিবন্ধিত-অফিস সেবা, হিসাবরক্ষণ ও কর নিবন্ধন আলাদা সেবা এবং আলাদাভাবে নির্ধারিত হয়।',
        },
      },
    ],
  },
  {
    countrySlug: 'uae',
    reviewedAt: '2026-08-29',
    requirements: [
      {
        en: 'The first decision is free zone or mainland, together with the activity list and how many visas are needed — these determine the licence, the costs and the renewals.',
        bn: 'প্রথম সিদ্ধান্ত ফ্রি জোন না মেইনল্যান্ড, সঙ্গে কার্যক্রমের তালিকা ও কতটি ভিসা লাগবে — এগুলিই লাইসেন্স, খরচ ও নবায়ন নির্ধারণ করে।',
      },
      {
        en: 'Not every route is in Dubai; the emirate and zone are named before anything is scoped.',
        bn: 'সব রুট দুবাইয়ে নয়; পরিধি নির্ধারণের আগে আমিরাত ও জোনের নাম জানানো হয়।',
      },
      {
        en: 'Regulated activities need separate approvals and are always reviewed individually.',
        bn: 'নিয়ন্ত্রিত কার্যক্রমের জন্য আলাদা অনুমোদন লাগে এবং সবসময় পৃথকভাবে পর্যালোচনা হয়।',
      },
    ],
    documents: [
      {
        en: 'Passport with the validity the zone requires, and a photo',
        bn: 'জোনের চাহিদা অনুযায়ী মেয়াদসহ পাসপোর্ট এবং ছবি',
      },
      { en: 'Proof of address and source of funds', bn: 'ঠিকানার প্রমাণ ও অর্থের উৎস' },
      {
        en: 'Proposed trade names and business activities',
        bn: 'প্রস্তাবিত ট্রেড নাম ও ব্যবসায়িক কার্যক্রম',
      },
      {
        en: 'UAE visa, Emirates ID or entry-stamp copies where they already exist',
        bn: 'ইতিমধ্যে থাকলে ইউএই ভিসা, এমিরেটস আইডি বা প্রবেশ-সিলের কপি',
      },
    ],
    obligations: [
      {
        en: 'Annual licence renewal and establishment-card upkeep',
        bn: 'বার্ষিক লাইসেন্স নবায়ন ও এস্টাবলিশমেন্ট কার্ড রক্ষণাবেক্ষণ',
      },
      {
        en: 'Corporate-tax and VAT obligations where thresholds and activities create them',
        bn: 'সীমা ও কার্যক্রম অনুযায়ী কর্পোরেট কর ও ভ্যাট বাধ্যবাধকতা',
      },
    ],
    faq: [
      {
        q: { en: 'Is a visa included?', bn: 'ভিসা কি অন্তর্ভুক্ত?' },
        a: {
          en: 'Visa coordination can be part of a route, but entry decisions, medicals and approvals always belong to the authorities — bdoor cannot promise them.',
          bn: 'ভিসা সমন্বয় রুটের অংশ হতে পারে, কিন্তু প্রবেশের সিদ্ধান্ত, মেডিক্যাল ও অনুমোদন কর্তৃপক্ষের এখতিয়ার — কখনোই নিশ্চয়তা দেওয়া হয় না।',
        },
      },
      {
        q: {
          en: 'Why does the final cost need a review?',
          bn: 'চূড়ান্ত খরচের জন্য পর্যালোচনা কেন প্রয়োজন?',
        },
        a: {
          en: 'Activity, zone, facility and visa count each move the licence cost. A figure quoted before those are fixed would be a guess.',
          bn: 'কার্যক্রম, জোন, সুবিধা ও ভিসার সংখ্যা — প্রতিটিই লাইসেন্স খরচ বদলায়। এগুলো নির্দিষ্ট হওয়ার আগে দেওয়া অঙ্ক অনুমানমাত্র হত।',
        },
      },
    ],
  },
  {
    countrySlug: 'saudi-arabia',
    reviewedAt: '2026-08-29',
    requirements: [
      {
        en: 'Foreign investment runs through MISA investment registration; a corporate applicant provides its commercial register and its last fiscal year’s financial statements.',
        bn: 'বিদেশি বিনিয়োগ MISA বিনিয়োগ নিবন্ধনের মাধ্যমে হয়; কর্পোরেট আবেদনকারীকে বাণিজ্যিক রেজিস্টার ও সর্বশেষ অর্থবছরের আর্থিক বিবরণী দিতে হয়।',
      },
      {
        en: 'Authority fees for investment registration and annual updates are determined after approval — which is why no headline total is published.',
        bn: 'বিনিয়োগ নিবন্ধন ও বার্ষিক হালনাগাদের কর্তৃপক্ষ-ফি অনুমোদনের পরে নির্ধারিত হয় — সে কারণেই কোনো শিরোনাম-অঙ্ক প্রকাশ করা হয় না।',
      },
      {
        en: 'Sector approvals, office, national address and Saudisation planning are all part of the review.',
        bn: 'খাতভিত্তিক অনুমোদন, অফিস, ন্যাশনাল অ্যাড্রেস ও সৌদিকরণ পরিকল্পনা — সবই পর্যালোচনার অংশ।',
      },
    ],
    documents: [
      {
        en: 'Passports, CVs, address and source-of-funds evidence for the individuals',
        bn: 'ব্যক্তিদের পাসপোর্ট, সিভি, ঠিকানা ও অর্থের উৎসের প্রমাণ',
      },
      {
        en: 'Corporate commercial register, constitutional documents, board resolution and a UBO chart',
        bn: 'কর্পোরেট বাণিজ্যিক রেজিস্টার, গঠনতান্ত্রিক দলিল, বোর্ড রেজোলিউশন ও UBO চার্ট',
      },
      {
        en: 'Last-year financial statements; apostille, legalisation and Arabic translation at the stage the partner directs',
        bn: 'সর্বশেষ বছরের আর্থিক বিবরণী; অংশীদারের নির্দেশিত ধাপে অ্যাপোস্টিল, বৈধকরণ ও আরবি অনুবাদ',
      },
    ],
    obligations: [
      {
        en: 'Annual investment-registration updates and commercial-register upkeep',
        bn: 'বার্ষিক বিনিয়োগ-নিবন্ধন হালনাগাদ ও বাণিজ্যিক রেজিস্টার রক্ষণাবেক্ষণ',
      },
      {
        en: 'ZATCA tax registration and filings, labour-file and Saudisation obligations as headcount grows',
        bn: 'ZATCA কর নিবন্ধন ও দাখিল, এবং জনবল বাড়ার সঙ্গে শ্রম-ফাইল ও সৌদিকরণ বাধ্যবাধকতা',
      },
    ],
    faq: [
      {
        q: {
          en: 'Why is there no instant checkout for Saudi Arabia?',
          bn: 'সৌদি আরবের জন্য তাৎক্ষণিক চেকআউট নেই কেন?',
        },
        a: {
          en: 'Because eligibility comes first. The honest sequence is assessment, then a partner-approved quotation — a fixed price before either would mislead.',
          bn: 'কারণ আগে যোগ্যতা। সৎ ক্রম হলো মূল্যায়ন, তারপর অংশীদার-অনুমোদিত মূল্য উদ্ধৃতি — তার আগে নির্দিষ্ট দাম বিভ্রান্তিকর হত।',
        },
      },
      {
        q: {
          en: 'Can bdoor promise MISA approval?',
          bn: 'bdoor কি MISA অনুমোদনের প্রতিশ্রুতি দিতে পারে?',
        },
        a: {
          en: 'No. Approvals belong to the authority. The route prepares a complete, accurate file — the decision is always MISA’s.',
          bn: 'না। অনুমোদন কর্তৃপক্ষের এখতিয়ার। রুটটি একটি পূর্ণাঙ্গ, নির্ভুল ফাইল প্রস্তুত করে — সিদ্ধান্ত সবসময় MISA-র।',
        },
      },
    ],
  },
  {
    countrySlug: 'qatar',
    reviewedAt: '2026-08-29',
    requirements: [
      {
        en: 'The first route is the Qatar Financial Centre for a non-regulated activity; mainland, free-zone and regulated activities each need their own eligibility review.',
        bn: 'প্রথম রুট কাতার ফাইন্যান্সিয়াল সেন্টার, অনিয়ন্ত্রিত কার্যক্রমের জন্য; মেইনল্যান্ড, ফ্রি-জোন ও নিয়ন্ত্রিত কার্যক্রমের জন্য আলাদা যোগ্যতা পর্যালোচনা লাগে।',
      },
      {
        en: 'QFC applications name the proposed activities, business model, principal office, directors and senior executive, and beneficial owners.',
        bn: 'QFC আবেদনে প্রস্তাবিত কার্যক্রম, ব্যবসার মডেল, প্রধান অফিস, পরিচালক ও জ্যেষ্ঠ নির্বাহী এবং প্রকৃত সুবিধাভোগীদের নাম দিতে হয়।',
      },
      {
        en: 'Application and annual licence fees apply in addition to professional fees, and approved premises are required.',
        bn: 'পেশাদার ফির পাশাপাশি আবেদন ও বার্ষিক লাইসেন্স ফি প্রযোজ্য, এবং অনুমোদিত অফিস প্রয়োজন।',
      },
    ],
    documents: [
      {
        en: 'Passports or IDs, proof of address and CVs for the people involved',
        bn: 'সংশ্লিষ্ট ব্যক্তিদের পাসপোর্ট বা আইডি, ঠিকানার প্রমাণ ও সিভি',
      },
      { en: 'Source-of-funds evidence', bn: 'অর্থের উৎসের প্রমাণ' },
      {
        en: 'Corporate documents where a company is a shareholder',
        bn: 'কোনো কোম্পানি শেয়ারহোল্ডার হলে কর্পোরেট দলিল',
      },
    ],
    obligations: [
      {
        en: 'Annual QFC licence renewal and approved-premises upkeep',
        bn: 'বার্ষিক QFC লাইসেন্স নবায়ন ও অনুমোদিত-অফিস রক্ষণাবেক্ষণ',
      },
      {
        en: 'Tax registration and filings, plus immigration and computer-card obligations once staff arrive',
        bn: 'কর নিবন্ধন ও দাখিল, এবং কর্মী এলে ইমিগ্রেশন ও কম্পিউটার-কার্ড বাধ্যবাধকতা',
      },
    ],
    faq: [
      {
        q: {
          en: 'Why is the first year quoted only after review?',
          bn: 'প্রথম বছরের খরচ কেবল পর্যালোচনার পরে কেন জানানো হয়?',
        },
        a: {
          en: 'The application fee is only part of the picture: the annual licence, office allowance and any regulated surcharge depend on the activity, so a complete first-year figure needs the review first.',
          bn: 'আবেদন ফি চিত্রের একটি অংশমাত্র: বার্ষিক লাইসেন্স, অফিস বরাদ্দ ও নিয়ন্ত্রিত কার্যক্রমের সারচার্জ কার্যক্রমের উপর নির্ভর করে, তাই পূর্ণাঙ্গ প্রথম-বছরের অঙ্কের জন্য আগে পর্যালোচনা প্রয়োজন।',
        },
      },
      {
        q: {
          en: 'Does bdoor handle regulated activities?',
          bn: 'bdoor কি নিয়ন্ত্রিত কার্যক্রম করে?',
        },
        a: {
          en: 'Regulated and DNFBP activities always go to a specialist review before any commitment; they are never sold as a standard route.',
          bn: 'নিয়ন্ত্রিত ও DNFBP কার্যক্রম কোনো প্রতিশ্রুতির আগে সবসময় বিশেষজ্ঞ পর্যালোচনায় যায়; এগুলো কখনো সাধারণ রুট হিসেবে বিক্রি হয় না।',
        },
      },
    ],
  },
  {
    countrySlug: 'singapore',
    reviewedAt: '2026-08-29',
    requirements: [
      {
        en: 'Every Singapore company needs at least one locally resident director, and foreign founders must engage a registered Corporate Service Provider to file.',
        bn: 'প্রতিটি সিঙ্গাপুর কোম্পানির অন্তত একজন স্থানীয়ভাবে আবাসিক পরিচালক প্রয়োজন, এবং বিদেশি প্রতিষ্ঠাতাদের ফাইলিংয়ের জন্য নিবন্ধিত কর্পোরেট সার্ভিস প্রোভাইডার নিতে হয়।',
      },
      {
        en: 'A nominee-director service is subject to the provider’s own KYC and may require a refundable security deposit — a deposit is never a service fee.',
        bn: 'নমিনি-ডিরেক্টর সেবা প্রোভাইডারের নিজস্ব KYC সাপেক্ষ এবং ফেরতযোগ্য নিরাপত্তা জমা লাগতে পারে — জমা কখনো সেবা ফি নয়।',
      },
      {
        en: 'A company secretary and a registered address are required from the start.',
        bn: 'শুরু থেকেই একজন কোম্পানি সচিব ও একটি নিবন্ধিত ঠিকানা প্রয়োজন।',
      },
    ],
    documents: [
      { en: 'Passport and recent proof of address', bn: 'পাসপোর্ট ও সাম্প্রতিক ঠিকানার প্রমাণ' },
      {
        en: 'Selfie/KYC checks, beneficial-owner and source-of-funds information',
        bn: 'সেলফি/KYC যাচাই, প্রকৃত সুবিধাভোগী ও অর্থের উৎসের তথ্য',
      },
      {
        en: 'Business profile and ownership documents where a company is a shareholder',
        bn: 'কোনো কোম্পানি শেয়ারহোল্ডার হলে বিজনেস প্রোফাইল ও মালিকানার দলিল',
      },
    ],
    obligations: [
      {
        en: 'The annual return, ongoing secretary and registered-address service',
        bn: 'বার্ষিক রিটার্ন, চলমান সচিব ও নিবন্ধিত-ঠিকানা সেবা',
      },
      {
        en: 'Financial statements and the corporate-tax filing, with GST and payroll where applicable',
        bn: 'আর্থিক বিবরণী ও কর্পোরেট-কর দাখিল, প্রযোজ্য ক্ষেত্রে GST ও বেতন-সংক্রান্ত দায়িত্ব',
      },
    ],
    faq: [
      {
        q: {
          en: 'Can I form a company without moving to Singapore?',
          bn: 'সিঙ্গাপুরে না গিয়েও কি কোম্পানি গঠন করা যায়?',
        },
        a: {
          en: 'Yes, through a CSP with a resident-director arrangement — subject to the provider’s acceptance and KYC — acceptance is the provider’s decision, never promised in advance.',
          bn: 'হ্যাঁ, রেসিডেন্ট-ডিরেক্টর ব্যবস্থাসহ CSP-র মাধ্যমে — প্রোভাইডারের সম্মতি ও KYC সাপেক্ষে, আগাম নিশ্চয়তা ছাড়া।',
        },
      },
      {
        q: {
          en: 'Does formation include a work pass?',
          bn: 'গঠনের সঙ্গে কি ওয়ার্ক পাস অন্তর্ভুক্ত?',
        },
        a: {
          en: 'No. Employment passes are separate applications decided by the authorities; coordination can be scoped, approval cannot be promised.',
          bn: 'না। এমপ্লয়মেন্ট পাস আলাদা আবেদন, যার সিদ্ধান্ত কর্তৃপক্ষের; সমন্বয় করা যায়, অনুমোদনের প্রতিশ্রুতি নয়।',
        },
      },
    ],
  },
];

export function countryGuideBySlug(slug: string): CountryGuide | undefined {
  return COUNTRY_GUIDES.find((guide) => guide.countrySlug === slug);
}
