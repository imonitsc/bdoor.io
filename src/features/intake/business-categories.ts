/**
 * Business categories offered on the questionnaire's "what will the business do"
 * step.
 *
 * The step used to be a required free-text box, which asked every applicant to
 * compose a sentence before they could continue — the single highest-friction
 * question in the flow, and the one that produced the least comparable data.
 * A picked category is comparable across applications; the box survives only
 * behind `other`, for the genuinely unlisted case.
 *
 * Grouped rather than flat: the list is long enough that scanning it needs
 * headings, and the group name is searchable too, so "garment" finds the
 * textiles group as well as the categories whose own name contains it.
 *
 * Slugs are stable identifiers stored in the application record. Renaming a
 * label is safe; changing a slug is not, because it orphans stored answers.
 */

export type BusinessCategory = {
  slug: string;
  en: string;
  bn: string;
  /** Slug of the group the category belongs to. */
  group: string;
};

export type BusinessCategoryGroup = {
  slug: string;
  en: string;
  bn: string;
  categories: readonly BusinessCategory[];
};

type Row = readonly [slug: string, en: string, bn: string];

const GROUPS: readonly (readonly [slug: string, en: string, bn: string, rows: readonly Row[]])[] = [
  [
    'retail',
    'Retail and consumer',
    'খুচরা ও ভোক্তা',
    [
      [
        'grocery-store',
        'Grocery, superstore or convenience store',
        'মুদি, সুপারস্টোর বা কনভিনিয়েন্স স্টোর',
      ],
      [
        'clothing-store',
        'Clothing, footwear or fashion retail',
        'পোশাক, জুতা বা ফ্যাশন খুচরা বিক্রয়',
      ],
      [
        'electronics-store',
        'Electronics, mobile or computer retail',
        'ইলেকট্রনিক্স, মোবাইল বা কম্পিউটার বিক্রয়',
      ],
      ['furniture-store', 'Furniture and home furnishing retail', 'আসবাবপত্র ও গৃহসজ্জা বিক্রয়'],
      [
        'hardware-store',
        'Hardware, paint and building-materials shop',
        'হার্ডওয়্যার, রং ও নির্মাণসামগ্রীর দোকান',
      ],
      ['pharmacy-retail', 'Pharmacy or medicine shop', 'ফার্মেসি বা ওষুধের দোকান'],
      [
        'cosmetics-retail',
        'Cosmetics, beauty and personal-care retail',
        'প্রসাধনী, বিউটি ও পার্সোনাল কেয়ার বিক্রয়',
      ],
      ['jewellery-retail', 'Jewellery and precious-metal retail', 'গহনা ও মূল্যবান ধাতু বিক্রয়'],
      [
        'bookstore-stationery',
        'Books, stationery and office supplies',
        'বই, স্টেশনারি ও অফিস সরঞ্জাম',
      ],
      [
        'sports-toys-retail',
        'Sports goods, toys and hobby retail',
        'ক্রীড়াসামগ্রী, খেলনা ও শখের পণ্য বিক্রয়',
      ],
      ['ecommerce-store', 'Online store or e-commerce', 'অনলাইন স্টোর বা ই-কমার্স'],
      [
        'marketplace-platform',
        'Online marketplace or aggregator',
        'অনলাইন মার্কেটপ্লেস বা অ্যাগ্রিগেটর',
      ],
    ],
  ],
  [
    'food',
    'Food and beverage',
    'খাদ্য ও পানীয়',
    [
      ['restaurant', 'Restaurant or dining', 'রেস্তোরাঁ বা ডাইনিং'],
      ['cafe-bakery', 'Cafe, bakery or confectionery', 'ক্যাফে, বেকারি বা মিষ্টান্ন'],
      ['fast-food', 'Fast food or takeaway', 'ফাস্ট ফুড বা টেকঅ্যাওয়ে'],
      [
        'cloud-kitchen',
        'Cloud kitchen or online food delivery',
        'ক্লাউড কিচেন বা অনলাইন খাবার ডেলিভারি',
      ],
      ['catering', 'Catering and event food service', 'ক্যাটারিং ও ইভেন্ট খাদ্য সেবা'],
      ['food-processing', 'Food processing and packaging', 'খাদ্য প্রক্রিয়াজাতকরণ ও প্যাকেজিং'],
      [
        'beverage-production',
        'Beverage or bottled-water production',
        'পানীয় বা বোতলজাত পানি উৎপাদন',
      ],
      ['food-wholesale', 'Food and grocery wholesale', 'খাদ্য ও মুদি পাইকারি'],
    ],
  ],
  [
    'trade',
    'Wholesale, trading and import-export',
    'পাইকারি, ট্রেডিং ও আমদানি-রপ্তানি',
    [
      ['general-trading', 'General trading company', 'সাধারণ ট্রেডিং কোম্পানি'],
      ['import-business', 'Import business', 'আমদানি ব্যবসা'],
      ['export-business', 'Export business', 'রপ্তানি ব্যবসা'],
      ['indenting-agency', 'Indenting or buying agency', 'ইনডেন্টিং বা বায়িং এজেন্সি'],
      ['distribution-dealership', 'Distribution or dealership', 'পরিবেশক বা ডিলারশিপ'],
      ['commodity-trading', 'Commodity and agricultural trading', 'কমোডিটি ও কৃষিপণ্য ট্রেডিং'],
      ['industrial-supplies', 'Industrial and machinery supplies', 'শিল্প ও যন্ত্রপাতি সরবরাহ'],
      ['chemical-trading', 'Chemical and raw-material trading', 'রাসায়নিক ও কাঁচামাল ট্রেডিং'],
    ],
  ],
  [
    'textiles',
    'Textiles, garments and leather',
    'বস্ত্র, পোশাক ও চামড়া',
    [
      ['garments-manufacturing', 'Readymade garments manufacturing', 'তৈরি পোশাক উৎপাদন'],
      [
        'textile-mill',
        'Textile, spinning, weaving or dyeing mill',
        'টেক্সটাইল, স্পিনিং, বুনন বা ডাইং মিল',
      ],
      ['knitwear', 'Knitwear and hosiery', 'নিটওয়্যার ও হোসিয়ারি'],
      [
        'garment-accessories',
        'Garment accessories and packaging',
        'গার্মেন্টস অ্যাকসেসরিজ ও প্যাকেজিং',
      ],
      ['buying-house', 'Garments buying house', 'গার্মেন্টস বায়িং হাউস'],
      ['leather-goods', 'Leather goods and footwear manufacturing', 'চামড়াজাত পণ্য ও জুতা উৎপাদন'],
      ['tannery', 'Tannery and leather processing', 'ট্যানারি ও চামড়া প্রক্রিয়াজাতকরণ'],
      ['handicrafts', 'Handicrafts, jute and cottage products', 'হস্তশিল্প, পাট ও কুটির পণ্য'],
    ],
  ],
  [
    'manufacturing',
    'Manufacturing and production',
    'উৎপাদন ও শিল্প',
    [
      [
        'light-engineering',
        'Light engineering and metal fabrication',
        'লাইট ইঞ্জিনিয়ারিং ও ধাতব নির্মাণ',
      ],
      ['plastics-manufacturing', 'Plastics and rubber products', 'প্লাস্টিক ও রাবার পণ্য'],
      ['chemicals-manufacturing', 'Chemicals and industrial products', 'রাসায়নিক ও শিল্পপণ্য'],
      ['pharma-manufacturing', 'Pharmaceutical manufacturing', 'ঔষধ উৎপাদন'],
      [
        'cosmetics-manufacturing',
        'Cosmetics and toiletries manufacturing',
        'প্রসাধনী ও টয়লেট্রিজ উৎপাদন',
      ],
      ['furniture-manufacturing', 'Furniture and wood products', 'আসবাবপত্র ও কাঠজাত পণ্য'],
      ['paper-printing', 'Paper, printing and packaging', 'কাগজ, মুদ্রণ ও প্যাকেজিং'],
      ['cement-ceramics', 'Cement, ceramics and glass', 'সিমেন্ট, সিরামিক ও কাচ'],
      ['steel-rerolling', 'Steel, re-rolling and metals', 'ইস্পাত, রি-রোলিং ও ধাতু'],
      [
        'electronics-assembly',
        'Electronics and appliance assembly',
        'ইলেকট্রনিক্স ও যন্ত্রপাতি সংযোজন',
      ],
      ['automotive-assembly', 'Vehicle assembly and auto parts', 'যানবাহন সংযোজন ও যন্ত্রাংশ'],
      ['agro-processing', 'Agro-processing and feed mills', 'কৃষি প্রক্রিয়াজাতকরণ ও ফিড মিল'],
    ],
  ],
  [
    'agriculture',
    'Agriculture, fisheries and livestock',
    'কৃষি, মৎস্য ও প্রাণিসম্পদ',
    [
      ['crop-farming', 'Crop farming and horticulture', 'শস্য চাষ ও উদ্যানপালন'],
      ['poultry-farming', 'Poultry farming and hatchery', 'পোল্ট্রি খামার ও হ্যাচারি'],
      ['livestock-dairy', 'Livestock and dairy farming', 'প্রাণিসম্পদ ও দুগ্ধ খামার'],
      ['fisheries-aquaculture', 'Fisheries and aquaculture', 'মৎস্য ও মৎস্যচাষ'],
      [
        'shrimp-processing',
        'Shrimp and seafood processing',
        'চিংড়ি ও সামুদ্রিক খাদ্য প্রক্রিয়াজাতকরণ',
      ],
      ['agri-inputs', 'Seeds, fertiliser and agri inputs', 'বীজ, সার ও কৃষি উপকরণ'],
      [
        'nursery-landscaping',
        'Nursery, plants and landscaping',
        'নার্সারি, গাছপালা ও ল্যান্ডস্কেপিং',
      ],
    ],
  ],
  [
    'construction',
    'Construction, real estate and engineering',
    'নির্মাণ, আবাসন ও প্রকৌশল',
    [
      ['construction-contractor', 'Construction contractor', 'নির্মাণ ঠিকাদার'],
      ['real-estate-developer', 'Real-estate development', 'আবাসন উন্নয়ন'],
      [
        'real-estate-agency',
        'Property sales, rental or brokerage',
        'সম্পত্তি বিক্রয়, ভাড়া বা দালালি',
      ],
      ['architecture-design', 'Architecture and interior design', 'স্থাপত্য ও অভ্যন্তরীণ নকশা'],
      [
        'civil-engineering',
        'Civil and structural engineering services',
        'পুরকৌশল ও কাঠামোগত প্রকৌশল সেবা',
      ],
      [
        'electrical-plumbing',
        'Electrical, plumbing and MEP works',
        'বৈদ্যুতিক, প্লাম্বিং ও এমইপি কাজ',
      ],
      ['equipment-rental', 'Construction equipment rental', 'নির্মাণ যন্ত্রপাতি ভাড়া'],
      [
        'facility-management',
        'Facility management and maintenance',
        'ফ্যাসিলিটি ব্যবস্থাপনা ও রক্ষণাবেক্ষণ',
      ],
    ],
  ],
  [
    'logistics',
    'Transport and logistics',
    'পরিবহন ও লজিস্টিক্স',
    [
      ['freight-forwarding', 'Freight forwarding', 'ফ্রেইট ফরওয়ার্ডিং'],
      [
        'clearing-forwarding',
        'Clearing and forwarding (C&F) agency',
        'ক্লিয়ারিং ও ফরওয়ার্ডিং (সিঅ্যান্ডএফ) এজেন্সি',
      ],
      ['courier-delivery', 'Courier and last-mile delivery', 'কুরিয়ার ও লাস্ট-মাইল ডেলিভারি'],
      ['road-transport', 'Road transport and trucking', 'সড়ক পরিবহন ও ট্রাকিং'],
      ['warehousing', 'Warehousing and cold storage', 'গুদামজাতকরণ ও কোল্ড স্টোরেজ'],
      ['shipping-agency', 'Shipping and port agency', 'শিপিং ও বন্দর এজেন্সি'],
      ['ride-sharing', 'Ride sharing or vehicle rental', 'রাইড শেয়ারিং বা যানবাহন ভাড়া'],
      ['air-cargo', 'Air cargo and logistics services', 'এয়ার কার্গো ও লজিস্টিক্স সেবা'],
    ],
  ],
  [
    'technology',
    'Technology and software',
    'প্রযুক্তি ও সফটওয়্যার',
    [
      ['software-development', 'Software development', 'সফটওয়্যার উন্নয়ন'],
      ['saas-product', 'SaaS or online product', 'SaaS বা অনলাইন প্রোডাক্ট'],
      ['mobile-app', 'Mobile app development', 'মোবাইল অ্যাপ উন্নয়ন'],
      ['it-services', 'IT services and support', 'আইটি সেবা ও সহায়তা'],
      ['web-design', 'Web design and development', 'ওয়েব ডিজাইন ও উন্নয়ন'],
      ['data-ai', 'Data, analytics and AI services', 'ডেটা, অ্যানালিটিক্স ও এআই সেবা'],
      ['cybersecurity', 'Cybersecurity services', 'সাইবার নিরাপত্তা সেবা'],
      [
        'hardware-networking',
        'Hardware, networking and infrastructure',
        'হার্ডওয়্যার, নেটওয়ার্কিং ও অবকাঠামো',
      ],
      ['bpo-callcentre', 'BPO, call centre or outsourcing', 'বিপিও, কল সেন্টার বা আউটসোর্সিং'],
      ['gaming-studio', 'Game development studio', 'গেম ডেভেলপমেন্ট স্টুডিও'],
      ['telecom-services', 'Telecom and internet services', 'টেলিকম ও ইন্টারনেট সেবা'],
    ],
  ],
  [
    'media',
    'Media, creative and events',
    'মিডিয়া, সৃজনশীল ও ইভেন্ট',
    [
      ['advertising-agency', 'Advertising or marketing agency', 'বিজ্ঞাপন বা বিপণন এজেন্সি'],
      [
        'digital-marketing',
        'Digital marketing and social media',
        'ডিজিটাল মার্কেটিং ও সোশ্যাল মিডিয়া',
      ],
      ['graphic-design', 'Graphic design and branding', 'গ্রাফিক ডিজাইন ও ব্র্যান্ডিং'],
      [
        'film-production',
        'Film, video and animation production',
        'চলচ্চিত্র, ভিডিও ও অ্যানিমেশন নির্মাণ',
      ],
      ['photography', 'Photography and videography', 'ফটোগ্রাফি ও ভিডিওগ্রাফি'],
      ['publishing', 'Publishing, news and content', 'প্রকাশনা, সংবাদ ও কনটেন্ট'],
      [
        'event-management',
        'Event management and wedding planning',
        'ইভেন্ট ব্যবস্থাপনা ও বিবাহ পরিকল্পনা',
      ],
      ['printing-press', 'Printing press and signage', 'ছাপাখানা ও সাইনেজ'],
    ],
  ],
  [
    'professional',
    'Professional and business services',
    'পেশাদার ও ব্যবসায়িক সেবা',
    [
      [
        'management-consulting',
        'Management or business consulting',
        'ব্যবস্থাপনা বা ব্যবসায়িক পরামর্শ',
      ],
      [
        'accounting-bookkeeping',
        'Accounting, audit and bookkeeping',
        'হিসাবরক্ষণ, নিরীক্ষা ও বুককিপিং',
      ],
      ['legal-services', 'Legal services', 'আইনি সেবা'],
      ['hr-recruitment', 'HR, staffing and recruitment', 'এইচআর, স্টাফিং ও নিয়োগ'],
      [
        'manpower-export',
        'Manpower export and overseas recruitment',
        'জনশক্তি রপ্তানি ও বিদেশে নিয়োগ',
      ],
      ['market-research', 'Market research and surveys', 'বাজার গবেষণা ও জরিপ'],
      ['translation-services', 'Translation and language services', 'অনুবাদ ও ভাষা সেবা'],
      ['security-services', 'Security and manpower services', 'নিরাপত্তা ও জনবল সেবা'],
      ['cleaning-services', 'Cleaning and janitorial services', 'পরিচ্ছন্নতা ও জেনিটোরিয়াল সেবা'],
      [
        'trading-representation',
        'Liaison or representative office work',
        'লিয়াজোঁ বা প্রতিনিধি অফিসের কাজ',
      ],
    ],
  ],
  [
    'education',
    'Education and training',
    'শিক্ষা ও প্রশিক্ষণ',
    [
      ['school-college', 'School or college', 'স্কুল বা কলেজ'],
      ['coaching-centre', 'Coaching or tutoring centre', 'কোচিং বা টিউটরিং সেন্টার'],
      ['vocational-training', 'Vocational and skills training', 'কারিগরি ও দক্ষতা প্রশিক্ষণ'],
      ['online-education', 'Online courses and e-learning', 'অনলাইন কোর্স ও ই-লার্নিং'],
      ['study-abroad', 'Study-abroad and admission consultancy', 'বিদেশে পড়াশোনা ও ভর্তি পরামর্শ'],
      ['training-institute', 'Corporate and professional training', 'কর্পোরেট ও পেশাদার প্রশিক্ষণ'],
    ],
  ],
  [
    'health',
    'Health and wellness',
    'স্বাস্থ্য ও সুস্থতা',
    [
      [
        'clinic-hospital',
        'Clinic, hospital or medical centre',
        'ক্লিনিক, হাসপাতাল বা মেডিকেল সেন্টার',
      ],
      [
        'diagnostic-centre',
        'Diagnostic centre or laboratory',
        'ডায়াগনস্টিক সেন্টার বা ল্যাবরেটরি',
      ],
      ['dental-clinic', 'Dental clinic', 'ডেন্টাল ক্লিনিক'],
      ['telemedicine', 'Telemedicine and health technology', 'টেলিমেডিসিন ও স্বাস্থ্য প্রযুক্তি'],
      ['medical-devices', 'Medical devices and equipment supply', 'চিকিৎসা যন্ত্রপাতি সরবরাহ'],
      ['fitness-gym', 'Gym, fitness or sports centre', 'জিম, ফিটনেস বা ক্রীড়া কেন্দ্র'],
      ['salon-spa', 'Salon, spa and beauty services', 'সেলুন, স্পা ও বিউটি সেবা'],
      ['veterinary', 'Veterinary services', 'পশুচিকিৎসা সেবা'],
    ],
  ],
  [
    'financial',
    'Financial services',
    'আর্থিক সেবা',
    [
      ['fintech', 'Fintech or payment technology', 'ফিনটেক বা পেমেন্ট প্রযুক্তি'],
      ['mfs-agent', 'Mobile financial services agent', 'মোবাইল ফিন্যান্সিয়াল সার্ভিসেস এজেন্ট'],
      ['insurance-agency', 'Insurance agency or brokerage', 'বিমা এজেন্সি বা ব্রোকারেজ'],
      ['microfinance', 'Microfinance or lending', 'ক্ষুদ্রঋণ বা ঋণদান'],
      ['investment-advisory', 'Investment and financial advisory', 'বিনিয়োগ ও আর্থিক পরামর্শ'],
      ['money-exchange', 'Money exchange or remittance', 'মানি এক্সচেঞ্জ বা রেমিট্যান্স'],
      ['leasing-finance', 'Leasing and asset finance', 'লিজিং ও সম্পদ অর্থায়ন'],
    ],
  ],
  [
    'tourism',
    'Travel, tourism and hospitality',
    'ভ্রমণ, পর্যটন ও আতিথেয়তা',
    [
      ['travel-agency', 'Travel agency or tour operator', 'ট্রাভেল এজেন্সি বা ট্যুর অপারেটর'],
      ['hotel-resort', 'Hotel, resort or guest house', 'হোটেল, রিসোর্ট বা গেস্ট হাউস'],
      ['air-ticketing', 'Air ticketing and visa processing', 'এয়ার টিকেটিং ও ভিসা প্রসেসিং'],
      ['hajj-umrah', 'Hajj and Umrah services', 'হজ ও ওমরাহ সেবা'],
      ['event-venue', 'Community centre or event venue', 'কমিউনিটি সেন্টার বা ইভেন্ট ভেন্যু'],
    ],
  ],
  [
    'energy',
    'Energy, environment and utilities',
    'জ্বালানি, পরিবেশ ও ইউটিলিটি',
    [
      ['solar-renewable', 'Solar and renewable energy', 'সৌর ও নবায়নযোগ্য জ্বালানি'],
      ['power-generation', 'Power generation and distribution', 'বিদ্যুৎ উৎপাদন ও বিতরণ'],
      ['oil-gas-services', 'Oil, gas and fuel services', 'তেল, গ্যাস ও জ্বালানি সেবা'],
      ['water-treatment', 'Water treatment and supply', 'পানি পরিশোধন ও সরবরাহ'],
      ['waste-recycling', 'Waste management and recycling', 'বর্জ্য ব্যবস্থাপনা ও পুনর্ব্যবহার'],
      [
        'environmental-consulting',
        'Environmental consulting and testing',
        'পরিবেশ পরামর্শ ও পরীক্ষা',
      ],
    ],
  ],
  [
    'personal',
    'Personal and household services',
    'ব্যক্তিগত ও গৃহস্থালি সেবা',
    [
      ['repair-services', 'Repair and maintenance services', 'মেরামত ও রক্ষণাবেক্ষণ সেবা'],
      ['laundry', 'Laundry and dry cleaning', 'লন্ড্রি ও ড্রাই ক্লিনিং'],
      ['tailoring', 'Tailoring and alterations', 'দর্জি ও পোশাক পরিবর্তন'],
      [
        'photocopy-cyber',
        'Photocopy, cyber cafe and small services',
        'ফটোকপি, সাইবার ক্যাফে ও ছোট সেবা',
      ],
      ['home-services', 'Home services and handyman work', 'গৃহসেবা ও হ্যান্ডিম্যান কাজ'],
    ],
  ],
  [
    'other',
    'Something else',
    'অন্য কিছু',
    [
      ['holding-company', 'Holding or investment company', 'হোল্ডিং বা বিনিয়োগ কোম্পানি'],
      ['nonprofit-ngo', 'Non-profit, NGO or foundation', 'অলাভজনক, এনজিও বা ফাউন্ডেশন'],
      ['research-organisation', 'Research or development organisation', 'গবেষণা বা উন্নয়ন সংস্থা'],
      ['other', 'Other — not listed here', 'অন্যান্য — এখানে তালিকাভুক্ত নয়'],
    ],
  ],
];

export const BUSINESS_CATEGORY_GROUPS: readonly BusinessCategoryGroup[] = GROUPS.map(
  ([slug, en, bn, rows]) => ({
    slug,
    en,
    bn,
    categories: rows.map(([s, cen, cbn]) => ({ slug: s, en: cen, bn: cbn, group: slug })),
  }),
);

export const BUSINESS_CATEGORIES: readonly BusinessCategory[] = BUSINESS_CATEGORY_GROUPS.flatMap(
  (group) => group.categories,
);

/**
 * The Zod enum needs a non-empty tuple of literals, and the list is derived
 * rather than repeated so the two can never drift apart.
 */
export const BUSINESS_CATEGORY_SLUGS = BUSINESS_CATEGORIES.map((c) => c.slug) as [
  string,
  ...string[],
];

/** The escape hatch that keeps the free-text box reachable. */
export const OTHER_BUSINESS_CATEGORY = 'other';

const BY_SLUG = new Map(BUSINESS_CATEGORIES.map((c) => [c.slug, c]));

export function findBusinessCategory(slug: string | undefined): BusinessCategory | undefined {
  return slug === undefined ? undefined : BY_SLUG.get(slug);
}

/** Localised label for a stored slug, for the review screen and staff views. */
export function businessCategoryLabel(slug: string | undefined, locale: 'en' | 'bn'): string {
  const category = findBusinessCategory(slug);
  return category ? category[locale] : '';
}
