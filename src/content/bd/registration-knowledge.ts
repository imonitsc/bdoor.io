/**
 * Bangladesh company-registration knowledge, written for Ask bdoor AI.
 *
 * Every entry here is bdoor-authored text ABOUT an official source or process,
 * reviewed on the date below. Entries typed `government_reference` summarise
 * what the named authority publishes and link to it — the citation a customer
 * clicks is the official site, and the authority tier comes from the same
 * taxonomy the source registry uses. Entries typed `guide` are bdoor's own
 * walkthrough and cite bdoor pages.
 *
 * Discipline carried over from the rest of the knowledge base:
 *   - No taka figure, fee amount, tax rate or processing time appears here.
 *     Fees change by notification; the text says who sets the fee and where
 *     the current schedule is published, and bdoor quotes exact figures in an
 *     itemised quote after review.
 *   - Nothing implies affiliation with RJSC, NBR, BIDA, Bangladesh Bank, a
 *     city corporation or any other authority.
 *   - Bangla and English are separate sources: the retrieved chunk is the
 *     chunk the model reads, and a bilingual chunk halves its usable content.
 */

export const BD_KNOWLEDGE_REVIEWED = '2026-08-31';

export type BdKnowledgeEntry = {
  /** Base slug; the per-locale source becomes `${slug}-${locale}`. */
  slug: string;
  title: { en: string; bn: string };
  sourceType: 'guide' | 'government_reference';
  /** Registry authority tier for government references; omitted for guides. */
  authorityTier?: 1 | 2 | 3 | 4 | 5 | 6;
  issuingInstitution?: string;
  referenceNumber?: string;
  /** Official URL for references; bdoor path for guides. */
  sourceUrl: string;
  body: { en: string; bn: string };
};

export const BD_REGISTRATION_KNOWLEDGE: readonly BdKnowledgeEntry[] = [
  {
    slug: 'bd-company-registration-guide',
    title: {
      en: 'Registering a company in Bangladesh: the process end to end',
      bn: 'বাংলাদেশে কোম্পানি নিবন্ধন: শুরু থেকে শেষ পর্যন্ত প্রক্রিয়া',
    },
    sourceType: 'guide',
    sourceUrl: '/countries/bangladesh',
    body: {
      en: `Choosing the right entity

A private limited company is the structure most new businesses in Bangladesh register. It needs at least two shareholders and two directors, its shareholders' liability is limited to their shares, and it is registered with the Registrar of Joint Stock Companies and Firms (RJSC) under the Companies Act 1994. Since the Companies (Second Amendment) Act 2020, a one person company (OPC) allows a single natural-person shareholder with one director. A public limited company needs at least seven shareholders and three directors and carries heavier disclosure duties. A sole proprietorship is not registered at RJSC at all — it operates on a trade licence in the owner's name — and a partnership operates under a partnership deed, with optional firm registration at RJSC. Foreign companies that do not want a local subsidiary can seek branch or liaison office permission through the Bangladesh Investment Development Authority (BIDA) instead.

Step 1 — Name clearance

Company registration starts with name clearance from RJSC, applied for on RJSC's online portal. The proposed name is checked against existing registrations; a cleared name is reserved for the limited period stated on the clearance itself, and the incorporation application must be filed within that window or the clearance renewed. Names that are identical or deceptively similar to an existing company, or that suggest state patronage without authority, are refused.

Step 2 — What you need before filing

The application needs: each shareholder's and director's full name, nationality and identification (national ID for Bangladeshis, passport for foreign nationals); a registered office address in Bangladesh; the authorised share capital and how it is divided; and each subscriber's shareholding. Directors must consent to act in writing.

Step 3 — Memorandum, Articles and the prescribed forms

The Memorandum of Association (MOA) states the company's name, registered office district, objects, authorised capital and subscribers. The Articles of Association (AOA) set the internal rules — share transfers, board procedure, meetings. Alongside them RJSC's prescribed forms are filed, including Form IX (consent of director to act) and Form XII (particulars of the directors, manager and managing agent). bdoor prepares these documents for signature; the subscribers sign the MOA and AOA themselves.

Step 4 — Filing and government fees

The incorporation application is submitted through RJSC's online system with the MOA, AOA, forms and the name-clearance reference, and the government fees are paid against it. The government charges are set by official schedule and depend mainly on the authorised capital: stamp duty on the constitutional documents plus RJSC registration fees. RJSC publishes the current schedule on its portal. bdoor does not publish those figures here because they change by notification — an itemised bdoor quote states the current government fees separately from bdoor's own professional fee before you pay anything.

Step 5 — The certificate

When RJSC is satisfied, it issues the Certificate of Incorporation bearing the company's registration number. The company exists from that certificate. Digital copies of the certified documents are retrievable through the portal.

After incorporation — the licences that make the company operational

Incorporation alone does not make the company operational. In practice a new company then needs: a trade licence from the city corporation, municipality or union parishad where it operates (renewed annually, fees set locally); an e-TIN (taxpayer identification) for the company from the National Board of Revenue; VAT registration (a Business Identification Number, BIN) where the VAT and Supplementary Duty Act 2012 requires it; and a company bank account, which banks typically open against the certificate, MOA/AOA, board resolution, e-TIN and trade licence. A company that will import or export also needs an IRC or ERC from the Office of the Chief Controller of Imports and Exports. Sector-specific approvals (factory, environment, fire, telecom and others) depend on the activity.

Foreign shareholders

Foreign investment is permitted in most sectors, in many cases up to 100 percent ownership, with a small number of reserved or controlled activities. Share money from abroad must arrive through banking channels and be encashed to taka — the bank's encashment certificate is the evidence RJSC and Bangladesh Bank rely on — and registration with BIDA is how a foreign-invested company accesses investor services such as work permits and remittance processing. Repatriation of dividends and capital follows Bangladesh Bank's foreign-exchange rules through an authorised dealer bank.

Where bdoor fits

bdoor coordinates the whole sequence — name clearance, drafting, RJSC filing, then trade licence, e-TIN, VAT/BIN and bank-account support — with the current package price and the government fees itemised separately on bdoor's live price list. The recommendation for your case is preliminary until a specialist reviews it.`,
      bn: `সঠিক কাঠামো বেছে নেওয়া

বাংলাদেশে নতুন ব্যবসার জন্য সবচেয়ে প্রচলিত কাঠামো প্রাইভেট লিমিটেড কোম্পানি। এর জন্য কমপক্ষে দুইজন শেয়ারহোল্ডার ও দুইজন পরিচালক লাগে, শেয়ারহোল্ডারদের দায় তাঁদের শেয়ারে সীমাবদ্ধ, এবং এটি কোম্পানি আইন ১৯৯৪-এর অধীনে যৌথ মূলধন কোম্পানি ও ফার্মসমূহের নিবন্ধকের কার্যালয়ে (RJSC) নিবন্ধিত হয়। কোম্পানি (দ্বিতীয় সংশোধন) আইন ২০২০-এর পর এক ব্যক্তি কোম্পানি (OPC) একজন স্বাভাবিক ব্যক্তি শেয়ারহোল্ডার ও একজন পরিচালক দিয়ে গঠন করা যায়। পাবলিক লিমিটেড কোম্পানির জন্য কমপক্ষে সাতজন শেয়ারহোল্ডার ও তিনজন পরিচালক লাগে এবং প্রকাশের বাধ্যবাধকতা বেশি। একক মালিকানা ব্যবসা RJSC-তে নিবন্ধিত হয় না — মালিকের নামে ট্রেড লাইসেন্স নিয়েই চলে — আর অংশীদারি ব্যবসা অংশীদারি দলিলের ভিত্তিতে চলে, RJSC-তে ফার্ম নিবন্ধন ঐচ্ছিক। স্থানীয় সাবসিডিয়ারি না চাইলে বিদেশি কোম্পানি বাংলাদেশ বিনিয়োগ উন্নয়ন কর্তৃপক্ষের (বিডা) মাধ্যমে ব্রাঞ্চ বা লিয়াজোঁ অফিসের অনুমতি নিতে পারে।

ধাপ ১ — নামের ছাড়পত্র

কোম্পানি নিবন্ধন শুরু হয় RJSC-এর নামের ছাড়পত্র (নেম ক্লিয়ারেন্স) দিয়ে, যা RJSC-এর অনলাইন পোর্টালে আবেদন করতে হয়। প্রস্তাবিত নাম বিদ্যমান নিবন্ধনের সঙ্গে মিলিয়ে দেখা হয়; ছাড়পত্র পাওয়া নাম ছাড়পত্রে উল্লেখিত সীমিত সময়ের জন্য সংরক্ষিত থাকে — সেই সময়ের মধ্যে নিবন্ধনের আবেদন করতে হয়, নয়তো ছাড়পত্র নবায়ন করতে হয়। বিদ্যমান কোনো কোম্পানির নামের সঙ্গে অভিন্ন বা বিভ্রান্তিকরভাবে সদৃশ নাম প্রত্যাখ্যাত হয়।

ধাপ ২ — আবেদনের আগে যা লাগবে

আবেদনের জন্য দরকার: প্রত্যেক শেয়ারহোল্ডার ও পরিচালকের পূর্ণ নাম, জাতীয়তা ও পরিচয়পত্র (বাংলাদেশির জন্য জাতীয় পরিচয়পত্র, বিদেশির জন্য পাসপোর্ট); বাংলাদেশে একটি নিবন্ধিত অফিস ঠিকানা; অনুমোদিত শেয়ার মূলধন ও তার বিভাজন; এবং প্রত্যেক সাবস্ক্রাইবারের শেয়ারসংখ্যা। পরিচালকদের লিখিত সম্মতি দিতে হয়।

ধাপ ৩ — সংঘস্মারক, সংঘবিধি ও নির্ধারিত ফরম

সংঘস্মারকে (MOA) থাকে কোম্পানির নাম, নিবন্ধিত অফিসের জেলা, উদ্দেশ্য, অনুমোদিত মূলধন ও সাবস্ক্রাইবারদের তথ্য। সংঘবিধি (AOA) কোম্পানির অভ্যন্তরীণ নিয়ম নির্ধারণ করে — শেয়ার হস্তান্তর, পরিচালনা পর্ষদের কার্যপদ্ধতি, সভা। এগুলোর সঙ্গে RJSC-এর নির্ধারিত ফরম দাখিল করতে হয়, যার মধ্যে ফরম IX (পরিচালকের দায়িত্ব গ্রহণের সম্মতি) ও ফরম XII (পরিচালক, ম্যানেজার ও ম্যানেজিং এজেন্টের বিবরণ) রয়েছে। bdoor এই দলিলগুলো স্বাক্ষরের জন্য প্রস্তুত করে; MOA ও AOA-তে সাবস্ক্রাইবাররা নিজে স্বাক্ষর করেন।

ধাপ ৪ — দাখিল ও সরকারি ফি

MOA, AOA, ফরম ও নামের ছাড়পত্রের রেফারেন্সসহ নিবন্ধনের আবেদন RJSC-এর অনলাইন সিস্টেমে জমা হয় এবং তার বিপরীতে সরকারি ফি পরিশোধ করতে হয়। সরকারি চার্জ অফিসিয়াল তফসিলে নির্ধারিত এবং মূলত অনুমোদিত মূলধনের ওপর নির্ভর করে: সাংবিধানিক দলিলের স্ট্যাম্প শুল্ক এবং RJSC-এর নিবন্ধন ফি। বর্তমান তফসিল RJSC তার পোর্টালে প্রকাশ করে। এই ফিগারগুলো এখানে লেখা হয় না, কারণ প্রজ্ঞাপনে সেগুলো বদলায় — bdoor-এর আইটেমাইজড কোটেশনে বর্তমান সরকারি ফি ও bdoor-এর নিজস্ব পেশাদার ফি আলাদাভাবে উল্লেখ থাকে, কোনো অর্থ পরিশোধের আগেই।

ধাপ ৫ — সার্টিফিকেট

RJSC সন্তুষ্ট হলে নিবন্ধন নম্বরসহ সার্টিফিকেট অব ইনকর্পোরেশন ইস্যু করে। সেই সার্টিফিকেট থেকেই কোম্পানির অস্তিত্ব শুরু। সত্যায়িত দলিলের ডিজিটাল কপি পোর্টাল থেকে সংগ্রহ করা যায়।

নিবন্ধনের পরে — যে লাইসেন্সগুলো কোম্পানিকে সচল করে

শুধু নিবন্ধনে কোম্পানি সচল হয় না। বাস্তবে নতুন কোম্পানির এরপর লাগে: ব্যবসা যেখানে চলবে সেই সিটি কর্পোরেশন, পৌরসভা বা ইউনিয়ন পরিষদ থেকে ট্রেড লাইসেন্স (প্রতি বছর নবায়নযোগ্য, ফি স্থানীয়ভাবে নির্ধারিত); জাতীয় রাজস্ব বোর্ড থেকে কোম্পানির ই-টিআইএন; মূল্য সংযোজন কর ও সম্পূরক শুল্ক আইন ২০১২ যেখানে প্রযোজ্য সেখানে ভ্যাট নিবন্ধন (বিজনেস আইডেন্টিফিকেশন নম্বর, BIN); এবং কোম্পানির ব্যাংক হিসাব — ব্যাংক সাধারণত সার্টিফিকেট, MOA/AOA, বোর্ড রেজল্যুশন, ই-টিআইএন ও ট্রেড লাইসেন্স দেখে হিসাব খোলে। আমদানি বা রপ্তানি করতে চাইলে আমদানি ও রপ্তানি প্রধান নিয়ন্ত্রকের দপ্তর থেকে IRC বা ERC লাগে। খাতভিত্তিক অনুমোদন (কারখানা, পরিবেশ, ফায়ার, টেলিকম ইত্যাদি) কার্যক্রমের ওপর নির্ভর করে।

বিদেশি শেয়ারহোল্ডার

বেশিরভাগ খাতে বিদেশি বিনিয়োগ অনুমোদিত, অনেক ক্ষেত্রে শতভাগ মালিকানাসহ; অল্প কিছু খাত সংরক্ষিত বা নিয়ন্ত্রিত। বিদেশ থেকে শেয়ারের অর্থ ব্যাংকিং চ্যানেলে এসে টাকায় নগদায়ন করতে হয় — ব্যাংকের এনক্যাশমেন্ট সার্টিফিকেটই RJSC ও বাংলাদেশ ব্যাংকের কাছে প্রমাণ — এবং বিডায় নিবন্ধনের মাধ্যমে বিদেশি বিনিয়োগের কোম্পানি ওয়ার্ক পারমিটসহ বিনিয়োগকারী সেবা পায়। লভ্যাংশ ও মূলধন প্রত্যাবাসন হয় বাংলাদেশ ব্যাংকের বৈদেশিক মুদ্রা নিয়ম অনুযায়ী, অনুমোদিত ডিলার ব্যাংকের মাধ্যমে।

bdoor-এর ভূমিকা

bdoor পুরো ধারাবাহিকতা সমন্বয় করে — নামের ছাড়পত্র, দলিল প্রস্তুতি, RJSC দাখিল, তারপর ট্রেড লাইসেন্স, ই-টিআইএন, ভ্যাট/BIN ও ব্যাংক হিসাবের সহায়তা — বর্তমান প্যাকেজ মূল্য ও সরকারি ফি bdoor-এর সক্রিয় মূল্যতালিকায় আলাদাভাবে দেখানো হয়। আপনার ক্ষেত্রে সুপারিশটি একজন বিশেষজ্ঞের পর্যালোচনার আগ পর্যন্ত প্রাথমিক।`,
    },
  },
  {
    slug: 'bd-companies-act-1994',
    title: {
      en: 'Companies Act 1994 — the law companies are registered under',
      bn: 'কোম্পানি আইন ১৯৯৪ — যে আইনের অধীনে কোম্পানি নিবন্ধিত হয়',
    },
    sourceType: 'government_reference',
    authorityTier: 2,
    issuingInstitution: 'Laws of Bangladesh (Ministry of Law)',
    referenceNumber: 'Act No. XVIII of 1994',
    sourceUrl: 'http://bdlaws.minlaw.gov.bd/',
    body: {
      en: `The Companies Act 1994 (Act No. XVIII of 1994) is the statute under which companies are incorporated and regulated in Bangladesh, administered through the Registrar of Joint Stock Companies and Firms (RJSC). It defines the company types — private limited (minimum two shareholders and two directors), public limited (minimum seven shareholders and three directors) and, since the Companies (Second Amendment) Act 2020, the one person company (OPC) with a single natural-person shareholder — and requires every company to have a Memorandum of Association and Articles of Association. It also imposes the continuing duties: maintaining a registered office, holding meetings, filing annual returns and notifying RJSC of changes in directors, address or capital. The consolidated text is maintained by the Ministry of Law's Laws of Bangladesh service; amendments take legal effect through the Bangladesh Gazette.`,
      bn: `কোম্পানি আইন ১৯৯৪ (১৯৯৪ সালের ১৮ নং আইন) হলো সেই আইন যার অধীনে বাংলাদেশে কোম্পানি গঠিত ও নিয়ন্ত্রিত হয়; এর প্রয়োগ হয় যৌথ মূলধন কোম্পানি ও ফার্মসমূহের নিবন্ধকের কার্যালয়ের (RJSC) মাধ্যমে। আইনটি কোম্পানির ধরন নির্ধারণ করে — প্রাইভেট লিমিটেড (ন্যূনতম দুইজন শেয়ারহোল্ডার ও দুইজন পরিচালক), পাবলিক লিমিটেড (ন্যূনতম সাতজন শেয়ারহোল্ডার ও তিনজন পরিচালক) এবং কোম্পানি (দ্বিতীয় সংশোধন) আইন ২০২০-এর পর এক ব্যক্তি কোম্পানি (OPC) — এবং প্রতিটি কোম্পানির জন্য সংঘস্মারক (MOA) ও সংঘবিধি (AOA) বাধ্যতামূলক করে। চলমান দায়িত্বও এই আইনেই: নিবন্ধিত অফিস রাখা, সভা করা, বার্ষিক রিটার্ন দাখিল এবং পরিচালক, ঠিকানা বা মূলধনের পরিবর্তন RJSC-কে জানানো। আইনের সমন্বিত পাঠ আইন মন্ত্রণালয়ের Laws of Bangladesh সেবায় রক্ষিত; সংশোধনী কার্যকর হয় বাংলাদেশ গেজেটের মাধ্যমে।`,
    },
  },
  {
    slug: 'bd-rjsc-name-clearance',
    title: {
      en: 'RJSC name clearance — reserving the company name',
      bn: 'RJSC নামের ছাড়পত্র — কোম্পানির নাম সংরক্ষণ',
    },
    sourceType: 'government_reference',
    authorityTier: 4,
    issuingInstitution: 'Registrar of Joint Stock Companies and Firms (RJSC)',
    sourceUrl: 'https://app.roc.gov.bd/',
    body: {
      en: `Name clearance is the first formal step of company registration and is applied for on RJSC's online services portal. The applicant proposes a name; RJSC checks it against existing registrations and refuses names that are identical or deceptively similar to a registered company, or otherwise objectionable under the Companies Act 1994. A granted clearance reserves the name for the limited period stated on the clearance certificate — the incorporation application must be submitted within that period, or the clearance renewed. The clearance fee is set by RJSC's published schedule on the same portal.`,
      bn: `নামের ছাড়পত্র কোম্পানি নিবন্ধনের প্রথম আনুষ্ঠানিক ধাপ, যা RJSC-এর অনলাইন সেবা পোর্টালে আবেদন করতে হয়। আবেদনকারী একটি নাম প্রস্তাব করেন; RJSC বিদ্যমান নিবন্ধনের সঙ্গে মিলিয়ে দেখে এবং নিবন্ধিত কোনো কোম্পানির সঙ্গে অভিন্ন বা বিভ্রান্তিকরভাবে সদৃশ, কিংবা কোম্পানি আইন ১৯৯৪-এর অধীনে আপত্তিকর নাম প্রত্যাখ্যান করে। মঞ্জুর হওয়া ছাড়পত্র সার্টিফিকেটে উল্লেখিত সীমিত সময়ের জন্য নামটি সংরক্ষণ করে — সেই সময়ের মধ্যে নিবন্ধনের আবেদন জমা দিতে হয়, নয়তো ছাড়পত্র নবায়ন করতে হয়। ছাড়পত্রের ফি একই পোর্টালে RJSC-এর প্রকাশিত তফসিলে নির্ধারিত।`,
    },
  },
  {
    slug: 'bd-rjsc-incorporation',
    title: {
      en: 'RJSC incorporation filing — documents, sequence and the certificate',
      bn: 'RJSC নিবন্ধন দাখিল — দলিল, ধারাবাহিকতা ও সার্টিফিকেট',
    },
    sourceType: 'government_reference',
    authorityTier: 3,
    issuingInstitution: 'Registrar of Joint Stock Companies and Firms (RJSC)',
    sourceUrl: 'https://roc.gov.bd/',
    body: {
      en: `RJSC is the authority that incorporates companies, partnership firms, societies and trade organisations in Bangladesh. For a company, the incorporation application is submitted through RJSC's online system after name clearance, with the Memorandum of Association, Articles of Association, the prescribed forms (including Form IX, consent of director to act, and Form XII, particulars of directors, manager and managing agent), the subscribers' and directors' identification, and the registered office address. Government fees — stamp duty on the constitutional documents and RJSC's registration fees, which scale mainly with authorised capital — are paid against the application under RJSC's published fee schedule. On approval RJSC issues the Certificate of Incorporation with the company's registration number; the company exists in law from that certificate. After incorporation, RJSC remains the registry for annual returns and for notifying changes in directors, registered office or capital.`,
      bn: `RJSC বাংলাদেশে কোম্পানি, অংশীদারি ফার্ম, সোসাইটি ও ট্রেড অর্গানাইজেশন নিবন্ধনের কর্তৃপক্ষ। কোম্পানির ক্ষেত্রে নামের ছাড়পত্রের পর RJSC-এর অনলাইন সিস্টেমে নিবন্ধনের আবেদন জমা দিতে হয় — সঙ্গে থাকে সংঘস্মারক (MOA), সংঘবিধি (AOA), নির্ধারিত ফরম (যার মধ্যে ফরম IX: পরিচালকের দায়িত্ব গ্রহণের সম্মতি, এবং ফরম XII: পরিচালক, ম্যানেজার ও ম্যানেজিং এজেন্টের বিবরণ), সাবস্ক্রাইবার ও পরিচালকদের পরিচয়পত্র এবং নিবন্ধিত অফিসের ঠিকানা। আবেদনের বিপরীতে সরকারি ফি — সাংবিধানিক দলিলের স্ট্যাম্প শুল্ক ও RJSC-এর নিবন্ধন ফি, যা মূলত অনুমোদিত মূলধনের সঙ্গে বাড়ে — RJSC-এর প্রকাশিত তফসিল অনুযায়ী পরিশোধ করতে হয়। অনুমোদনে RJSC নিবন্ধন নম্বরসহ সার্টিফিকেট অব ইনকর্পোরেশন ইস্যু করে; আইনগতভাবে কোম্পানির অস্তিত্ব সেই সার্টিফিকেট থেকে। নিবন্ধনের পরও বার্ষিক রিটার্ন এবং পরিচালক, নিবন্ধিত অফিস বা মূলধনের পরিবর্তনের নোটিশের রেজিস্ট্রি RJSC-ই।`,
    },
  },
  {
    slug: 'bd-rjsc-fees',
    title: {
      en: 'RJSC fee schedule — how registration fees are determined',
      bn: 'RJSC ফি তফসিল — নিবন্ধন ফি কীভাবে নির্ধারিত হয়',
    },
    sourceType: 'government_reference',
    authorityTier: 4,
    issuingInstitution: 'Registrar of Joint Stock Companies and Firms (RJSC)',
    sourceUrl: 'https://app.roc.gov.bd/',
    body: {
      en: `The government cost of incorporating a company has two main parts: stamp duty on the Memorandum and Articles of Association, and RJSC's registration fees. Both are set by official schedule and depend mainly on the company's authorised share capital — a higher authorised capital sits in a higher fee band. Name clearance and certified copies carry their own scheduled fees. RJSC publishes the current schedule and a fee calculator on its online services portal; that published schedule is the authoritative figure at any given time, because the amounts change by government notification. bdoor states the exact current government fees, separately from bdoor's own professional fee, in an itemised quote before any payment.`,
      bn: `কোম্পানি নিবন্ধনের সরকারি খরচের দুটি প্রধান অংশ: সংঘস্মারক ও সংঘবিধির স্ট্যাম্প শুল্ক, এবং RJSC-এর নিবন্ধন ফি। দুটোই অফিসিয়াল তফসিলে নির্ধারিত এবং মূলত কোম্পানির অনুমোদিত শেয়ার মূলধনের ওপর নির্ভর করে — অনুমোদিত মূলধন বেশি হলে ফির ধাপও বেশি। নামের ছাড়পত্র ও সত্যায়িত কপির জন্য আলাদা তফসিলভুক্ত ফি আছে। RJSC তার অনলাইন সেবা পোর্টালে বর্তমান তফসিল ও ফি ক্যালকুলেটর প্রকাশ করে; যেকোনো সময়ের প্রামাণিক অঙ্ক সেই প্রকাশিত তফসিলই, কারণ সরকারি প্রজ্ঞাপনে অঙ্কগুলো বদলায়। bdoor কোনো অর্থ পরিশোধের আগে আইটেমাইজড কোটেশনে বর্তমান সরকারি ফি এবং bdoor-এর নিজস্ব পেশাদার ফি আলাদাভাবে জানায়।`,
    },
  },
  {
    slug: 'bd-nbr-etin',
    title: {
      en: 'Company e-TIN from the National Board of Revenue',
      bn: 'জাতীয় রাজস্ব বোর্ড থেকে কোম্পানির ই-টিআইএন',
    },
    sourceType: 'government_reference',
    authorityTier: 3,
    issuingInstitution: 'National Board of Revenue (NBR)',
    sourceUrl: 'https://nbr.gov.bd/',
    body: {
      en: `Every company needs its own taxpayer identification number (e-TIN) from the National Board of Revenue, obtained through NBR's online income-tax registration service using the company's incorporation details. The e-TIN identifies the company for income-tax purposes and is asked for in practice by banks when opening the company account, by city corporations for trade-licence processing, and in government tendering. The company's income-tax obligations — return filing and any advance or withholding tax duties — run against this TIN under the income-tax law administered by NBR.`,
      bn: `প্রতিটি কোম্পানির নিজস্ব করদাতা শনাক্তকরণ নম্বর (ই-টিআইএন) লাগে, যা জাতীয় রাজস্ব বোর্ডের অনলাইন আয়কর নিবন্ধন সেবার মাধ্যমে কোম্পানির নিবন্ধনের তথ্য দিয়ে নেওয়া হয়। ই-টিআইএন আয়কর সংক্রান্ত কাজে কোম্পানিকে শনাক্ত করে এবং বাস্তবে কোম্পানির ব্যাংক হিসাব খোলায়, সিটি কর্পোরেশনের ট্রেড লাইসেন্স প্রক্রিয়ায় ও সরকারি দরপত্রে এটি চাওয়া হয়। কোম্পানির আয়কর দায়িত্ব — রিটার্ন দাখিল এবং প্রযোজ্য অগ্রিম বা উৎসে কর — NBR প্রশাসিত আয়কর আইনের অধীনে এই টিআইএনের বিপরীতেই চলে।`,
    },
  },
  {
    slug: 'bd-nbr-vat-bin',
    title: {
      en: 'VAT registration (BIN) under the VAT and Supplementary Duty Act 2012',
      bn: 'মূল্য সংযোজন কর ও সম্পূরক শুল্ক আইন ২০১২-এর অধীনে ভ্যাট নিবন্ধন (BIN)',
    },
    sourceType: 'government_reference',
    authorityTier: 3,
    issuingInstitution: 'National Board of Revenue (NBR)',
    referenceNumber: 'VAT and Supplementary Duty Act 2012',
    sourceUrl: 'https://nbr.gov.bd/',
    body: {
      en: `VAT registration gives a business its Business Identification Number (BIN), issued by the National Board of Revenue through the VAT online system under the VAT and Supplementary Duty Act 2012. Whether registration (or enlistment for turnover tax) is required depends on the business's taxable activity and turnover against thresholds set by the Act and NBR's current notifications — the thresholds and rates are figures NBR publishes and updates, so bdoor confirms the position for a specific business after review rather than quoting numbers here. A BIN is needed in practice to issue VAT invoices, to import, to supply VAT-registered customers and to participate in most tenders. Registered businesses file VAT returns for each tax period.`,
      bn: `ভ্যাট নিবন্ধনে ব্যবসা পায় বিজনেস আইডেন্টিফিকেশন নম্বর (BIN), যা মূল্য সংযোজন কর ও সম্পূরক শুল্ক আইন ২০১২-এর অধীনে জাতীয় রাজস্ব বোর্ড ভ্যাট অনলাইন সিস্টেমের মাধ্যমে ইস্যু করে। নিবন্ধন (বা টার্নওভার করের তালিকাভুক্তি) লাগবে কি না তা নির্ভর করে ব্যবসার করযোগ্য কার্যক্রম ও টার্নওভারের ওপর — সীমা ও হার আইন এবং NBR-এর চলতি প্রজ্ঞাপনে নির্ধারিত; এই অঙ্কগুলো NBR প্রকাশ ও হালনাগাদ করে বলে bdoor এখানে সংখ্যা না লিখে নির্দিষ্ট ব্যবসার অবস্থান পর্যালোচনার পর নিশ্চিত করে। বাস্তবে ভ্যাট চালান ইস্যু, আমদানি, ভ্যাট-নিবন্ধিত ক্রেতাকে সরবরাহ ও অধিকাংশ দরপত্রে অংশগ্রহণে BIN লাগে। নিবন্ধিত ব্যবসাকে প্রতি কর মেয়াদে ভ্যাট রিটার্ন দাখিল করতে হয়।`,
    },
  },
  {
    slug: 'bd-trade-licence',
    title: {
      en: 'Trade licence from the local authority',
      bn: 'স্থানীয় কর্তৃপক্ষ থেকে ট্রেড লাইসেন্স',
    },
    sourceType: 'government_reference',
    authorityTier: 3,
    issuingInstitution:
      'City corporations and local authorities (e.g. Dhaka North City Corporation)',
    sourceUrl: 'https://dncc.gov.bd/',
    body: {
      en: `A trade licence authorises a business to operate at a specific location and is issued by the local authority for that location — a city corporation (such as Dhaka North, Dhaka South or Chattogram), a municipality (pourashava) or a union parishad. It is a local requirement, separate from RJSC incorporation: a company operating from more than one location needs a licence for each. The application is made to the relevant authority with the premises details (ownership papers or rental agreement), the business category, and for companies the incorporation certificate; fees vary by business category and by authority under each authority's own schedule, and the licence is renewed annually. Because the issuing authority, fee and category list differ by city, the exact requirement is confirmed against the specific location during review.`,
      bn: `ট্রেড লাইসেন্স একটি নির্দিষ্ট ঠিকানায় ব্যবসা চালানোর অনুমতি দেয় এবং সেই ঠিকানার স্থানীয় কর্তৃপক্ষ — সিটি কর্পোরেশন (যেমন ঢাকা উত্তর, ঢাকা দক্ষিণ বা চট্টগ্রাম), পৌরসভা বা ইউনিয়ন পরিষদ — এটি ইস্যু করে। এটি স্থানীয় বাধ্যবাধকতা, RJSC নিবন্ধন থেকে আলাদা: একাধিক ঠিকানায় ব্যবসা চালালে প্রতিটির জন্য আলাদা লাইসেন্স লাগে। আবেদন করতে হয় সংশ্লিষ্ট কর্তৃপক্ষের কাছে — প্রাঙ্গণের তথ্য (মালিকানার কাগজ বা ভাড়ার চুক্তি), ব্যবসার শ্রেণি, এবং কোম্পানির ক্ষেত্রে নিবন্ধন সার্টিফিকেটসহ; ফি ব্যবসার শ্রেণি ও কর্তৃপক্ষভেদে প্রতিটি কর্তৃপক্ষের নিজস্ব তফসিলে নির্ধারিত, এবং লাইসেন্স প্রতি বছর নবায়ন করতে হয়। ইস্যুকারী কর্তৃপক্ষ, ফি ও শ্রেণিতালিকা শহরভেদে আলাদা বলে নির্দিষ্ট ঠিকানার বিপরীতে সঠিক চাহিদা পর্যালোচনার সময় নিশ্চিত করা হয়।`,
    },
  },
  {
    slug: 'bd-bida-registration',
    title: {
      en: 'BIDA registration for foreign and industrial investment',
      bn: 'বিদেশি ও শিল্প বিনিয়োগের জন্য বিডা নিবন্ধন',
    },
    sourceType: 'government_reference',
    authorityTier: 3,
    issuingInstitution: 'Bangladesh Investment Development Authority (BIDA)',
    sourceUrl: 'https://investbangladesh.gov.bd/',
    body: {
      en: `The Bangladesh Investment Development Authority (BIDA) is the investment-promotion and facilitation agency for industrial enterprises outside the special economic and export-processing zones. Foreign investment is permitted in most sectors, in many cases up to 100 percent foreign ownership, with a small list of reserved and controlled activities. A foreign-invested or industrial company registers with BIDA through its online one-stop service to access investor services: work permits and visa recommendations for foreign staff, remittance-related approvals, and utility and other facilitation. Branch and liaison offices of foreign companies also take their permission through BIDA. BIDA registration complements — it does not replace — RJSC incorporation, tax registration and the trade licence.`,
      bn: `বাংলাদেশ বিনিয়োগ উন্নয়ন কর্তৃপক্ষ (বিডা) বিশেষ অর্থনৈতিক অঞ্চল ও রপ্তানি প্রক্রিয়াকরণ অঞ্চলের বাইরের শিল্প উদ্যোগের বিনিয়োগ-প্রসার ও সহায়তা সংস্থা। বেশিরভাগ খাতে বিদেশি বিনিয়োগ অনুমোদিত, অনেক ক্ষেত্রে শতভাগ বিদেশি মালিকানাসহ; সংরক্ষিত ও নিয়ন্ত্রিত খাতের তালিকা ছোট। বিদেশি বিনিয়োগের বা শিল্প কোম্পানি বিডার অনলাইন ওয়ান-স্টপ সার্ভিসে নিবন্ধন করে বিনিয়োগকারী সেবা পায়: বিদেশি কর্মীর ওয়ার্ক পারমিট ও ভিসা সুপারিশ, রেমিট্যান্স-সংক্রান্ত অনুমোদন এবং ইউটিলিটিসহ অন্যান্য সহায়তা। বিদেশি কোম্পানির ব্রাঞ্চ ও লিয়াজোঁ অফিসের অনুমতিও বিডার মাধ্যমে হয়। বিডা নিবন্ধন RJSC নিবন্ধন, কর নিবন্ধন ও ট্রেড লাইসেন্সের পরিপূরক — বিকল্প নয়।`,
    },
  },
  {
    slug: 'bd-bb-foreign-exchange',
    title: {
      en: 'Bangladesh Bank foreign-exchange rules for share capital and repatriation',
      bn: 'শেয়ার মূলধন ও প্রত্যাবাসনে বাংলাদেশ ব্যাংকের বৈদেশিক মুদ্রা নিয়ম',
    },
    sourceType: 'government_reference',
    authorityTier: 3,
    issuingInstitution: 'Bangladesh Bank',
    sourceUrl: 'https://www.bb.org.bd/',
    body: {
      en: `Bangladesh Bank, the central bank, regulates how foreign investment money enters and leaves Bangladesh through its Guidelines for Foreign Exchange Transactions and FE circulars. Share money from a foreign shareholder must arrive through banking channels and be encashed into taka; the authorised dealer bank's encashment certificate is the standard evidence relied on for issuing shares to the foreign investor and for later remittances. Reporting of the issued shares to Bangladesh Bank is handled through the authorised dealer. Dividends and, on exit, sale or liquidation proceeds are repatriable through the authorised dealer subject to the applicable FE circulars and tax compliance. Banks also apply know-your-customer requirements set by the Bangladesh Financial Intelligence Unit (BFIU) when opening and operating company accounts. bdoor never receives or routes share capital — the money moves between the investor, the bank and the company.`,
      bn: `কেন্দ্রীয় ব্যাংক হিসেবে বাংলাদেশ ব্যাংক তার Guidelines for Foreign Exchange Transactions ও এফই সার্কুলারের মাধ্যমে নিয়ন্ত্রণ করে বিদেশি বিনিয়োগের অর্থ কীভাবে বাংলাদেশে আসবে ও যাবে। বিদেশি শেয়ারহোল্ডারের শেয়ারের অর্থ ব্যাংকিং চ্যানেলে এসে টাকায় নগদায়ন করতে হয়; অনুমোদিত ডিলার ব্যাংকের এনক্যাশমেন্ট সার্টিফিকেটই বিদেশি বিনিয়োগকারীকে শেয়ার ইস্যু ও পরবর্তী রেমিট্যান্সের প্রামাণিক দলিল। ইস্যু করা শেয়ারের প্রতিবেদন অনুমোদিত ডিলারের মাধ্যমে বাংলাদেশ ব্যাংকে যায়। লভ্যাংশ এবং প্রস্থানে বিক্রয় বা অবসায়নের অর্থ প্রযোজ্য এফই সার্কুলার ও কর পরিপালন সাপেক্ষে অনুমোদিত ডিলারের মাধ্যমে প্রত্যাবাসনযোগ্য। কোম্পানির হিসাব খোলা ও পরিচালনায় ব্যাংকগুলো বাংলাদেশ ফাইন্যান্সিয়াল ইন্টেলিজেন্স ইউনিটের (BFIU) নির্ধারিত গ্রাহক-পরিচিতি (KYC) নিয়মও প্রয়োগ করে। bdoor কখনো শেয়ার মূলধন গ্রহণ বা স্থানান্তর করে না — অর্থ চলে বিনিয়োগকারী, ব্যাংক ও কোম্পানির মধ্যে।`,
    },
  },
  {
    slug: 'bd-ccie-irc-erc',
    title: {
      en: 'Import and export registration (IRC / ERC) from CCI&E',
      bn: 'আমদানি ও রপ্তানি নিবন্ধন (IRC / ERC) — CCI&E',
    },
    sourceType: 'government_reference',
    authorityTier: 3,
    issuingInstitution: 'Office of the Chief Controller of Imports and Exports (CCI&E)',
    sourceUrl: 'https://ccie.gov.bd/',
    body: {
      en: `A business that imports goods needs an Import Registration Certificate (IRC), and one that exports needs an Export Registration Certificate (ERC), both issued by the Office of the Chief Controller of Imports and Exports under the Ministry of Commerce. The application is made after the company is otherwise operational — in practice it relies on the trade licence, TIN and bank account, with membership of the relevant chamber or trade association. IRCs are banded by import ceiling, and both certificates carry scheduled government fees and annual renewal under CCI&E's published schedule. Customs formalities at import remain separate, under the National Board of Revenue.`,
      bn: `পণ্য আমদানি করতে চাইলে লাগে আমদানি নিবন্ধন সনদ (IRC), রপ্তানি করতে চাইলে রপ্তানি নিবন্ধন সনদ (ERC) — দুটোই বাণিজ্য মন্ত্রণালয়ের অধীন আমদানি ও রপ্তানি প্রধান নিয়ন্ত্রকের দপ্তর (CCI&E) ইস্যু করে। কোম্পানি অন্যভাবে সচল হওয়ার পর আবেদন করতে হয় — বাস্তবে এতে লাগে ট্রেড লাইসেন্স, টিআইএন ও ব্যাংক হিসাব, সঙ্গে সংশ্লিষ্ট চেম্বার বা ট্রেড অ্যাসোসিয়েশনের সদস্যপদ। IRC আমদানি সিলিং অনুযায়ী ধাপে ভাগ করা, এবং দুটি সনদেই CCI&E-এর প্রকাশিত তফসিল অনুযায়ী সরকারি ফি ও বার্ষিক নবায়ন প্রযোজ্য। আমদানিতে কাস্টমস আনুষ্ঠানিকতা আলাদা, জাতীয় রাজস্ব বোর্ডের অধীনে।`,
    },
  },
  {
    slug: 'bd-official-texts',
    title: {
      en: 'Where the authoritative legal texts are published',
      bn: 'প্রামাণিক আইনি পাঠ কোথায় প্রকাশিত হয়',
    },
    sourceType: 'government_reference',
    authorityTier: 1,
    issuingInstitution: 'Bangladesh Government Press (Bangladesh Gazette)',
    sourceUrl: 'https://www.dpp.gov.bd/bgpress/',
    body: {
      en: `New laws, amendments, statutory rules and orders (SROs) and official fee notifications take legal effect through publication in the Bangladesh Gazette, printed by the Bangladesh Government Press — the weekly and extraordinary gazettes are the highest-authority record of what changed and when. The Ministry of Law's Laws of Bangladesh service maintains the consolidated text of the Acts, including the Companies Act 1994, the VAT and Supplementary Duty Act 2012 and the income-tax law. When guidance on a regulator's website and a gazette notification differ, the gazette controls. Ask bdoor AI cites the issuing authority for regulatory claims, and where a current figure or notification has not been verified against these sources, it says so rather than guessing.`,
      bn: `নতুন আইন, সংশোধনী, বিধিবদ্ধ বিধি ও আদেশ (এসআরও) এবং অফিসিয়াল ফি প্রজ্ঞাপন আইনগতভাবে কার্যকর হয় বাংলাদেশ গেজেটে প্রকাশের মাধ্যমে, যা বাংলাদেশ সরকারি মুদ্রণালয় ছাপে — সাপ্তাহিক ও অতিরিক্ত গেজেটই কী বদলাল, কবে বদলাল তার সর্বোচ্চ-কর্তৃত্বের নথি। আইন মন্ত্রণালয়ের Laws of Bangladesh সেবা আইনগুলোর সমন্বিত পাঠ রক্ষণ করে — কোম্পানি আইন ১৯৯৪, মূল্য সংযোজন কর ও সম্পূরক শুল্ক আইন ২০১২ ও আয়কর আইনসহ। কোনো নিয়ন্ত্রকের ওয়েবসাইটের নির্দেশনা ও গেজেট প্রজ্ঞাপনে অমিল হলে গেজেটই প্রামাণ্য। Ask bdoor AI নিয়ন্ত্রক দাবির ক্ষেত্রে ইস্যুকারী কর্তৃপক্ষ উদ্ধৃত করে, এবং কোনো চলতি অঙ্ক বা প্রজ্ঞাপন এই উৎসের বিপরীতে যাচাই না হয়ে থাকলে অনুমান না করে তা-ই বলে।`,
    },
  },
] as const;
