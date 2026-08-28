import type { Service, ServiceCategory } from '@/features/catalog/types';

type TaxonomyInput = {
  slug: string;
  categorySlug: string;
  name: { en: string; bn: string };
  summary: { en: string; bn: string };
  sortOrder: number;
  requiresPartner?: boolean;
  isRegulated?: boolean;
};

/**
 * Catalogue rows that are not yet operationally open. They exist so the
 * public taxonomy is complete without inventing fees, times or eligibility.
 * Existing published slugs in seed.sql are not repeated here.
 */
const ROWS: readonly TaxonomyInput[] = [
  // Formation
  {
    slug: 'one-person-company',
    categorySlug: 'company-formation',
    name: { en: 'One Person Company', bn: 'ওয়ান পার্সন কোম্পানি' },
    summary: {
      en: 'A limited company with a single shareholder, where that structure is available. Opened after review of current eligibility.',
      bn: 'একক শেয়ারহোল্ডারের সীমিতদায় কোম্পানি, যেখানে এই কাঠামো চালু আছে। বর্তমান যোগ্যতা যাচাইয়ের পর খোলা হবে।',
    },
    sortOrder: 20,
  },
  {
    slug: 'public-limited-company',
    categorySlug: 'company-formation',
    name: { en: 'Public limited company', bn: 'পাবলিক লিমিটেড কোম্পানি' },
    summary: {
      en: 'A public company structure. Requirements are confirmed after review; this route is not open for new cases yet.',
      bn: 'পাবলিক কোম্পানি কাঠামো। প্রয়োজনীয়তা যাচাইয়ের পর নিশ্চিত; এই পথ এখনো নতুন কেসের জন্য খোলা নয়।',
    },
    sortOrder: 30,
    requiresPartner: true,
  },
  {
    slug: 'sole-proprietorship',
    categorySlug: 'company-formation',
    name: { en: 'Sole proprietorship', bn: 'একক মালিকানা' },
    summary: {
      en: 'Trade as yourself, without a separate company. Suitable only in some cases; the assessment will say if it is not.',
      bn: 'আলাদা কোম্পানি ছাড়া নিজ নামে ব্যবসা। কিছু ক্ষেত্রেই মানানসই; না হলে প্রশ্নমালা তা বলে দেবে।',
    },
    sortOrder: 40,
  },
  {
    slug: 'partnership-registration',
    categorySlug: 'company-formation',
    name: { en: 'Partnership', bn: 'পার্টনারশিপ' },
    summary: {
      en: 'A partnership between two or more people. Partners are typically personally liable — confirmed on review.',
      bn: 'দুই বা তার বেশি জনের অংশীদারিত্ব। অংশীদাররা সাধারণত ব্যক্তিগতভাবে দায়ী — যাচাইয়ে নিশ্চিত।',
    },
    sortOrder: 50,
  },
  {
    slug: 'foreign-owned-company',
    categorySlug: 'company-formation',
    name: { en: 'Foreign-owned company', bn: 'বিদেশি মালিকানাধীন কোম্পানি' },
    summary: {
      en: 'Incorporation where one or more owners are not Bangladeshi residents. Starts with an eligibility review.',
      bn: 'এক বা একাধিক মালিক অনিবাসী হলে নিবন্ধন। শুরু হয় যোগ্যতা যাচাই দিয়ে।',
    },
    sortOrder: 60,
    requiresPartner: true,
  },
  {
    slug: 'joint-venture',
    categorySlug: 'company-formation',
    name: { en: 'Joint venture', bn: 'জয়েন্ট ভেঞ্চার' },
    summary: {
      en: 'A jointly owned vehicle. Structure and sector rules are confirmed after professional review.',
      bn: 'যৌথ মালিকানার কাঠামো। কাঠামো ও খাতের নিয়ম পেশাগত যাচাইয়ের পর নিশ্চিত।',
    },
    sortOrder: 70,
    requiresPartner: true,
  },
  {
    slug: 'branch-office',
    categorySlug: 'company-formation',
    name: { en: 'Branch office', bn: 'শাখা কার্যালয়' },
    summary: {
      en: 'A Bangladeshi branch of a foreign company. Permissions and capital rules are confirmed after review.',
      bn: 'বিদেশি কোম্পানির বাংলাদেশি শাখা। অনুমতি ও মূলধনের নিয়ম যাচাইয়ের পর নিশ্চিত।',
    },
    sortOrder: 80,
    requiresPartner: true,
    isRegulated: true,
  },
  {
    slug: 'liaison-office',
    categorySlug: 'company-formation',
    name: { en: 'Liaison or representative office', bn: 'যোগাযোগ বা প্রতিনিধি কার্যালয়' },
    summary: {
      en: 'A non-trading presence. Activity limits are strict; we confirm them before any filing.',
      bn: 'অবাণিজ্যিক উপস্থিতি। কার্যক্রমের সীমা কঠোর; দাখিলের আগে আমরা নিশ্চিত করি।',
    },
    sortOrder: 90,
    requiresPartner: true,
    isRegulated: true,
  },
  {
    slug: 'nonprofit-coordination',
    categorySlug: 'company-formation',
    name: {
      en: 'Non-profit / society / foundation coordination',
      bn: 'অলাভজনক / সমিতি / ফাউন্ডেশন সমন্বয়',
    },
    summary: {
      en: 'Coordination only where the structure is legally supported. Not open until eligibility is confirmed per matter.',
      bn: 'যেখানে কাঠামো আইনসম্মতভাবে সমর্থিত, শুধু সেখানে সমন্বয়। প্রতিটি বিষয়ে যোগ্যতা নিশ্চিত না হওয়া পর্যন্ত বন্ধ।',
    },
    sortOrder: 100,
    requiresPartner: true,
    isRegulated: true,
  },
  // Corporate changes
  {
    slug: 'name-clearance',
    categorySlug: 'corporate-changes',
    name: { en: 'Name clearance', bn: 'নাম ছাড়পত্র' },
    summary: {
      en: 'Reserve a proposed company name. Often the first filing inside incorporation rather than a standalone product.',
      bn: 'প্রস্তাবিত কোম্পানির নাম সংরক্ষণ। প্রায়ই আলাদা পণ্য নয়, নিবন্ধনের ভেতরের প্রথম দাখিল।',
    },
    sortOrder: 10,
  },
  {
    slug: 'certified-copies-company-search',
    categorySlug: 'corporate-changes',
    name: {
      en: 'Certified copies and company search',
      bn: 'সত্যায়িত অনুলিপি ও কোম্পানি অনুসন্ধান',
    },
    summary: {
      en: 'Obtain certified copies or a search of the company register. Quoted after we know which documents you need.',
      bn: 'সত্যায়িত অনুলিপি বা রেজিস্টার অনুসন্ধান। কোন দলিল লাগবে জানার পর কোটেশন।',
    },
    sortOrder: 20,
  },
  {
    slug: 'director-appointment-resignation',
    categorySlug: 'corporate-changes',
    name: { en: 'Director appointment or resignation', bn: 'পরিচালক নিয়োগ বা পদত্যাগ' },
    summary: {
      en: 'File a director change. Identity checks apply to incoming directors.',
      bn: 'পরিচালক পরিবর্তন দাখিল। নতুন পরিচালকের পরিচয় যাচাই হয়।',
    },
    sortOrder: 30,
  },
  {
    slug: 'shareholder-change',
    categorySlug: 'corporate-changes',
    name: { en: 'Shareholder change', bn: 'শেয়ারহোল্ডার পরিবর্তন' },
    summary: {
      en: 'Record a change of members. Foreign or corporate incoming shareholders are reviewed first.',
      bn: 'সদস্য পরিবর্তন নথিভুক্ত। বিদেশি বা কর্পোরেট নতুন শেয়ারহোল্ডার আগে যাচাই।',
    },
    sortOrder: 40,
    requiresPartner: true,
  },
  {
    slug: 'share-transfer',
    categorySlug: 'corporate-changes',
    name: { en: 'Share transfer', bn: 'শেয়ার হস্তান্তর' },
    summary: {
      en: 'Instrument and filing support for a share transfer. Tax and stamping are quoted separately after review.',
      bn: 'শেয়ার হস্তান্তরের দলিল ও দাখিল সহায়তা। কর ও স্ট্যাম্প যাচাইয়ের পর আলাদা কোটেশন।',
    },
    sortOrder: 50,
    requiresPartner: true,
  },
  {
    slug: 'registered-office-change',
    categorySlug: 'corporate-changes',
    name: { en: 'Registered-office change', bn: 'নিবন্ধিত কার্যালয় পরিবর্তন' },
    summary: {
      en: 'Update the registered office. Proof of the new address is required.',
      bn: 'নিবন্ধিত কার্যালয় হালনাগাদ। নতুন ঠিকানার প্রমাণ লাগে।',
    },
    sortOrder: 60,
  },
  {
    slug: 'capital-change',
    categorySlug: 'corporate-changes',
    name: { en: 'Authorised or paid-up capital change', bn: 'অনুমোদিত বা পরিশোধিত মূলধন পরিবর্তন' },
    summary: {
      en: 'Capital alterations. Government fees depend on the figures and are never guessed here.',
      bn: 'মূলধন পরিবর্তন। সরকারি ফি অঙ্কের ওপর নির্ভর করে, এখানে অনুমান করা হয় না।',
    },
    sortOrder: 70,
  },
  {
    slug: 'moa-aoa-amendment',
    categorySlug: 'corporate-changes',
    name: { en: 'MOA / AOA amendment', bn: 'সংঘস্মারক / সংঘবিধি সংশোধন' },
    summary: {
      en: 'Constitutional amendments. Drafting that needs legal authority is a separate partner engagement.',
      bn: 'গঠনতান্ত্রিক সংশোধন। আইনি কর্তৃত্ব লাগে এমন খসড়া আলাদা অংশীদার চুক্তি।',
    },
    sortOrder: 80,
    requiresPartner: true,
  },
  {
    slug: 'dormancy-closure',
    categorySlug: 'corporate-changes',
    name: {
      en: 'Dormancy, closure or winding-up coordination',
      bn: 'নিষ্ক্রিয়তা, বন্ধ বা অবসায়ন সমন্বয়',
    },
    summary: {
      en: 'Coordination of strike-off or winding-up steps. Outcomes stay with the registrar and the court where applicable.',
      bn: 'স্ট্রাইক-অফ বা অবসায়নের ধাপ সমন্বয়। ফলাফল রেজিস্ট্রার ও প্রযোজ্য ক্ষেত্রে আদালতের।',
    },
    sortOrder: 90,
    requiresPartner: true,
  },
  // Licences beyond the published trade licence
  {
    slug: 'trade-licence-renewal',
    categorySlug: 'licences',
    name: { en: 'Trade-licence renewal', bn: 'ট্রেড লাইসেন্স নবায়ন' },
    summary: {
      en: 'Renew the local permission to operate. The fee varies by location and category and is quoted after review.',
      bn: 'পরিচালনার স্থানীয় অনুমতি নবায়ন। ফি অবস্থান ও শ্রেণি অনুযায়ী বদলায়, যাচাইয়ের পর কোটেশন।',
    },
    sortOrder: 20,
  },
  {
    slug: 'etin-individual',
    categorySlug: 'tax-vat',
    name: { en: 'e-TIN for an individual', bn: 'ব্যক্তির ই-টিআইএন' },
    summary: {
      en: 'Taxpayer identification for a director or proprietor who needs their own e-TIN.',
      bn: 'যে পরিচালক বা মালিকের নিজস্ব ই-টিআইএন দরকার, তাঁর করদাতা শনাক্তকরণ।',
    },
    sortOrder: 15,
  },
  {
    slug: 'industrial-irc',
    categorySlug: 'import-export',
    name: { en: 'Industrial IRC', bn: 'শিল্প IRC' },
    summary: {
      en: 'Import registration for industrial use. Eligibility is confirmed after we know the activity and the plant.',
      bn: 'শিল্প ব্যবহারের আমদানি নিবন্ধন। কার্যক্রম ও স্থাপনা জানার পর যোগ্যতা নিশ্চিত।',
    },
    sortOrder: 20,
  },
  {
    slug: 'export-registration-certificate',
    categorySlug: 'import-export',
    name: { en: 'Export Registration Certificate (ERC)', bn: 'রপ্তানি নিবন্ধন সনদ (ERC)' },
    summary: {
      en: 'The registration needed before you can export commercially. Bank and association steps come first.',
      bn: 'বাণিজ্যিক রপ্তানির আগে যে নিবন্ধন লাগে। ব্যাংক ও অ্যাসোসিয়েশনের ধাপ আগে।',
    },
    sortOrder: 30,
  },
  {
    slug: 'bida-investment-registration',
    categorySlug: 'foreign-founders',
    name: { en: 'BIDA investment or project registration', bn: 'BIDA বিনিয়োগ বা প্রকল্প নিবন্ধন' },
    summary: {
      en: 'Investment registration coordination. bdoor is not BIDA and does not decide the application.',
      bn: 'বিনিয়োগ নিবন্ধনের সমন্বয়। bdoor BIDA নয় এবং আবেদনের সিদ্ধান্ত দেয় না।',
    },
    sortOrder: 20,
    requiresPartner: true,
    isRegulated: true,
  },
  {
    slug: 'fire-licence',
    categorySlug: 'licences',
    name: { en: 'Fire licence', bn: 'অগ্নি নির্বাপণ লাইসেন্স' },
    summary: {
      en: 'Premises fire permission where required. The issuing authority and fee depend on the site.',
      bn: 'প্রয়োজনে স্থাপনার অগ্নি অনুমতি। ইস্যুকারী ও ফি সাইটের ওপর নির্ভর করে।',
    },
    sortOrder: 30,
    isRegulated: true,
  },
  {
    slug: 'environmental-clearance',
    categorySlug: 'licences',
    name: { en: 'Environmental clearance', bn: 'পরিবেশগত ছাড়পত্র' },
    summary: {
      en: 'Clearance where the activity is scheduled. Category and documents are confirmed after review.',
      bn: 'কার্যক্রম তফসিলভুক্ত হলে ছাড়পত্র। শ্রেণি ও কাগজপত্র যাচাইয়ের পর নিশ্চিত।',
    },
    sortOrder: 40,
    isRegulated: true,
  },
  {
    slug: 'dife-factory-registration',
    categorySlug: 'licences',
    name: { en: 'DIFE / factory registration', bn: 'DIFE / কারখানা নিবন্ধন' },
    summary: {
      en: 'Factory or establishment registration. Not required for every business; confirmed after review.',
      bn: 'কারখানা বা প্রতিষ্ঠান নিবন্ধন। সব ব্যবসার জন্য নয়; যাচাইয়ের পর নিশ্চিত।',
    },
    sortOrder: 50,
    isRegulated: true,
  },
  {
    slug: 'bsti-coordination',
    categorySlug: 'licences',
    name: { en: 'BSTI coordination', bn: 'BSTI সমন্বয়' },
    summary: {
      en: 'Standards certification coordination for products that need it. Quoted after we know the product.',
      bn: 'যে পণ্যে মান সনদ লাগে তার সমন্বয়। পণ্য জানার পর কোটেশন।',
    },
    sortOrder: 60,
    isRegulated: true,
  },
  // Accounting (coming soon — professional work)
  {
    slug: 'corporate-tax-return',
    categorySlug: 'accounting-finance',
    name: { en: 'Corporate tax-return coordination', bn: 'কোম্পানি কর-রিটার্ন সমন্বয়' },
    summary: {
      en: 'Coordination of a corporate return through a qualified professional. Not tax advice from bdoor.',
      bn: 'যোগ্য পেশাজীবীর মাধ্যমে কোম্পানি রিটার্নের সমন্বয়। bdoor কর পরামর্শ দেয় না।',
    },
    sortOrder: 10,
    requiresPartner: true,
  },
  {
    slug: 'vat-return-coordination',
    categorySlug: 'accounting-finance',
    name: { en: 'VAT-return coordination', bn: 'ভ্যাট-রিটার্ন সমন্বয়' },
    summary: {
      en: 'Recurring VAT filing support through a qualified provider. Opens after that provider is contracted.',
      bn: 'যোগ্য সেবাদাতার মাধ্যমে নিয়মিত ভ্যাট দাখিল। সেই সেবাদাতা চুক্তিবদ্ধ হলে খুলবে।',
    },
    sortOrder: 20,
    requiresPartner: true,
  },
  {
    slug: 'bookkeeping',
    categorySlug: 'accounting-finance',
    name: { en: 'Bookkeeping', bn: 'বুককিপিং' },
    summary: {
      en: 'Bookkeeping by a qualified provider under a separate engagement. Not open for new cases yet.',
      bn: 'আলাদা চুক্তিতে যোগ্য সেবাদাতার বুককিপিং। এখনো নতুন কেসের জন্য খোলা নয়।',
    },
    sortOrder: 30,
    requiresPartner: true,
  },
  {
    slug: 'payroll',
    categorySlug: 'accounting-finance',
    name: { en: 'Payroll', bn: 'বেতন প্রক্রিয়া' },
    summary: {
      en: 'Payroll processing through a qualified provider. Quoted after we know headcount and frequency.',
      bn: 'যোগ্য সেবাদাতার মাধ্যমে বেতন প্রক্রিয়া। জনবল ও সময়সূচি জানার পর কোটেশন।',
    },
    sortOrder: 40,
    requiresPartner: true,
  },
  {
    slug: 'annual-compliance-subscription',
    categorySlug: 'compliance',
    name: { en: 'Annual compliance subscription', bn: 'বার্ষিক কমপ্লায়েন্স সাবস্ক্রিপশন' },
    summary: {
      en: 'A recurring engagement for filings and renewals. Pricing is not published until the package is approved.',
      bn: 'দাখিল ও নবায়নের নিয়মিত চুক্তি। প্যাকেজ অনুমোদিত না হওয়া পর্যন্ত মূল্য প্রকাশ করা হয় না।',
    },
    sortOrder: 20,
  },
  // Foreign extras
  {
    slug: 'work-permit-coordination',
    categorySlug: 'foreign-founders',
    name: { en: 'Work-permit coordination', bn: 'ওয়ার্ক পারমিট সমন্বয়' },
    summary: {
      en: 'Work-permit support through appropriate professionals. Incorporation does not grant a work permit.',
      bn: 'উপযুক্ত পেশাজীবীর মাধ্যমে ওয়ার্ক পারমিট সহায়তা। কোম্পানি গঠন ওয়ার্ক পারমিট দেয় না।',
    },
    sortOrder: 30,
    requiresPartner: true,
    isRegulated: true,
  },
  {
    slug: 'visa-coordination',
    categorySlug: 'foreign-founders',
    name: { en: 'Visa coordination', bn: 'ভিসা সমন্বয়' },
    summary: {
      en: 'Visa applications are decided by the authorities. We coordinate paperwork; we do not grant leave to remain.',
      bn: 'ভিসার সিদ্ধান্ত কর্তৃপক্ষের। আমরা কাগজপত্র সমন্বয় করি; অবস্থানের অনুমতি দিই না।',
    },
    sortOrder: 40,
    requiresPartner: true,
    isRegulated: true,
  },
  {
    slug: 'capital-remittance-coordination',
    categorySlug: 'foreign-founders',
    name: {
      en: 'Capital remittance and encashment-document coordination',
      bn: 'মূলধন রেমিট্যান্স ও নগদায়ন দলিল সমন্বয়',
    },
    summary: {
      en: 'Paperwork banks typically expect. Share capital is remitted to the company’s account, never to bdoor.',
      bn: 'ব্যাংক সাধারণত যে কাগজ চায়। শেয়ার মূলধন যায় কোম্পানির হিসাবে, কখনো bdoor-এ নয়।',
    },
    sortOrder: 50,
  },
  // Trade / procurement
  {
    slug: 'egp-registration-readiness',
    categorySlug: 'trade-procurement',
    name: { en: 'e-GP registration readiness', bn: 'ই-জিপি নিবন্ধন প্রস্তুতি' },
    summary: {
      en: 'Document readiness for government e-procurement registration. The portal decision is not bdoor’s.',
      bn: 'সরকারি ই-প্রকিউরমেন্ট নিবন্ধনের কাগজ প্রস্তুতি। পোর্টালের সিদ্ধান্ত bdoor-এর নয়।',
    },
    sortOrder: 10,
  },
  {
    slug: 'bangladesh-single-window',
    categorySlug: 'trade-procurement',
    name: { en: 'Bangladesh Single Window guidance', bn: 'বাংলাদেশ সিঙ্গেল উইন্ডো নির্দেশনা' },
    summary: {
      en: 'Guidance on using the Single Window. We are not the operator of that system.',
      bn: 'সিঙ্গেল উইন্ডো ব্যবহারের নির্দেশনা। আমরা সেই ব্যবস্থার পরিচালক নই।',
    },
    sortOrder: 20,
  },
  {
    slug: 'irc-erc-renewal',
    categorySlug: 'import-export',
    name: { en: 'IRC / ERC renewal', bn: 'IRC / ERC নবায়ন' },
    summary: {
      en: 'Renew an existing import or export registration. Association and bank documents are confirmed per case.',
      bn: 'চলতি আমদানি বা রপ্তানি নিবন্ধন নবায়ন। অ্যাসোসিয়েশন ও ব্যাংক কাগজ প্রতি কেসে নিশ্চিত।',
    },
    sortOrder: 40,
  },
  // IP
  {
    slug: 'trademark-search-application',
    categorySlug: 'intellectual-property',
    name: {
      en: 'Trademark search and application coordination',
      bn: 'ট্রেডমার্ক অনুসন্ধান ও আবেদন সমন্বয়',
    },
    summary: {
      en: 'Search and filing coordination. Registration is decided by the registry, not by bdoor.',
      bn: 'অনুসন্ধান ও দাখিল সমন্বয়। নিবন্ধনের সিদ্ধান্ত রেজিস্ট্রির, bdoor-এর নয়।',
    },
    sortOrder: 10,
    requiresPartner: true,
  },
  {
    slug: 'trademark-renewal',
    categorySlug: 'intellectual-property',
    name: { en: 'Trademark renewal coordination', bn: 'ট্রেডমার্ক নবায়ন সমন্বয়' },
    summary: {
      en: 'Renew an existing mark. Deadlines and fees are confirmed from the registry record, not guessed.',
      bn: 'চলতি মার্ক নবায়ন। সময়সীমা ও ফি রেজিস্ট্রি রেকর্ড থেকে নিশ্চিত, অনুমান নয়।',
    },
    sortOrder: 20,
    requiresPartner: true,
  },
  {
    slug: 'notarisation',
    categorySlug: 'intellectual-property',
    name: { en: 'Notarisation', bn: 'নোটারি' },
    summary: {
      en: 'Notarisation through a qualified notary. Charged at cost once the document set is known.',
      bn: 'যোগ্য নোটারির মাধ্যমে নোটারি। দলিল সেট জানার পর প্রকৃত খরচে।',
    },
    sortOrder: 30,
    requiresPartner: true,
  },
  {
    slug: 'certified-translation',
    categorySlug: 'intellectual-property',
    name: { en: 'Certified translation', bn: 'সত্যায়িত অনুবাদ' },
    summary: {
      en: 'Certified translation through a qualified provider. Quoted per language pair and length.',
      bn: 'যোগ্য সেবাদাতার সত্যায়িত অনুবাদ। ভাষা জোড়া ও দৈর্ঘ্য অনুযায়ী কোটেশন।',
    },
    sortOrder: 40,
    requiresPartner: true,
  },
];

export const TAXONOMY_CATEGORIES: ServiceCategory[] = [
  {
    id: 'c0000000-0000-4000-8000-000000000007',
    slug: 'corporate-changes',
    name: { en: 'Corporate changes and filings', bn: 'কোম্পানি পরিবর্তন ও দাখিল' },
    summary: {
      en: 'Director, share, address and capital changes after you are incorporated.',
      bn: 'নিবন্ধনের পর পরিচালক, শেয়ার, ঠিকানা ও মূলধনের পরিবর্তন।',
    },
    icon: 'file-pen',
    sortOrder: 15,
  },
  {
    id: 'c0000000-0000-4000-8000-000000000008',
    slug: 'intellectual-property',
    name: { en: 'Brand and documents', bn: 'ব্র্যান্ড ও দলিল' },
    summary: {
      en: 'Trademark coordination, notarisation and certified translation.',
      bn: 'ট্রেডমার্ক সমন্বয়, নোটারি ও সত্যায়িত অনুবাদ।',
    },
    icon: 'stamp',
    sortOrder: 55,
  },
  {
    id: 'c0000000-0000-4000-8000-000000000009',
    slug: 'accounting-finance',
    name: { en: 'Tax filing and accounts', bn: 'কর দাখিল ও হিসাব' },
    summary: {
      en: 'Returns, bookkeeping and payroll through qualified professionals — coming soon.',
      bn: 'যোগ্য পেশাজীবীর মাধ্যমে রিটার্ন, বুককিপিং ও বেতন — শিগগির।',
    },
    icon: 'calculator',
    sortOrder: 45,
  },
  {
    id: 'c0000000-0000-4000-8000-00000000000a',
    slug: 'trade-procurement',
    name: { en: 'Trade systems and procurement', bn: 'বাণিজ্য ব্যবস্থা ও ক্রয়' },
    summary: {
      en: 'Single Window guidance and e-GP readiness. Not an authority portal.',
      bn: 'সিঙ্গেল উইন্ডো নির্দেশনা ও ই-জিপি প্রস্তুতি। কর্তৃপক্ষের পোর্টাল নয়।',
    },
    icon: 'landmark',
    sortOrder: 35,
  },
];

function toService(row: TaxonomyInput, index: number): Service {
  const id = `d0000000-0000-4000-8100-${String(index + 1).padStart(12, '0')}`;
  return {
    id,
    slug: row.slug,
    categorySlug: row.categorySlug,
    name: row.name,
    summary: row.summary,
    whoFor: null,
    included: { en: [], bn: [] },
    notIncluded: { en: [], bn: [] },
    eligibility: {
      en: 'This service is not open for new cases yet. Eligibility, documents and fees are confirmed after review.',
      bn: 'এই সেবা এখনো নতুন কেসের জন্য খোলা নয়। যোগ্যতা, কাগজপত্র ও ফি যাচাইয়ের পর নিশ্চিত করা হয়।',
    },
    authorityName: null,
    startingFeeBdt: null,
    estimatedDaysMin: null,
    estimatedDaysMax: null,
    timeReviewedAt: null,
    requiresPartner: row.requiresPartner ?? false,
    isRegulated: row.isRegulated ?? false,
    status: 'coming_soon',
    sortOrder: row.sortOrder,
    requirements: [],
    milestones: [],
    feeComponents: [],
  };
}

export const TAXONOMY_SERVICES: Service[] = ROWS.map(toService);

export function mergeCategories(base: ServiceCategory[]): ServiceCategory[] {
  const slugs = new Set(base.map((c) => c.slug));
  return [...base, ...TAXONOMY_CATEGORIES.filter((c) => !slugs.has(c.slug))].sort(
    (a, b) => a.sortOrder - b.sortOrder,
  );
}

export function mergeServices(base: Service[]): Service[] {
  const slugs = new Set(base.map((s) => s.slug));
  return [...base, ...TAXONOMY_SERVICES.filter((s) => !slugs.has(s.slug))];
}
