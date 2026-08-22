import type { LegalDocument } from './types';

/**
 * Draft legal documents.
 *
 * EVERY document in this file is a working draft written to support the
 * platform's controls. None has been reviewed or approved by qualified
 * Bangladesh counsel. `awaitingCounselReview` is true on all of them, which
 * renders a prominent banner, and it must stay true until a lawyer has signed
 * the text off. See docs/LAUNCH-CHECKLIST.md.
 */

const VERSION = 'draft-2026-01';
const LAST_UPDATED = '2026-01-15';

export const TERMS: LegalDocument = {
  slug: 'terms',
  titleKey: 'legal.terms',
  version: VERSION,
  lastUpdated: LAST_UPDATED,
  awaitingCounselReview: true,
  sections: [
    {
      id: 'who-we-are',
      heading: { en: 'Who you are contracting with', bn: 'আপনি কার সঙ্গে চুক্তি করছেন' },
      body: {
        en: `BDoor is an independent business setup and administrative-support platform operating at bdoor.io. These terms govern your use of the platform and the administrative services we provide.

BDoor is **not** a government authority. BDoor is **not** a law firm and does not provide legal advice or legal representation. Where a matter requires legal or specialist professional authority, that work is performed by an independent advocate or partner firm under a separate engagement between you and that professional.`,
        bn: `BDoor একটি স্বাধীন ব্যবসা-গঠন ও প্রশাসনিক সহায়তা প্ল্যাটফর্ম, যা bdoor.io ঠিকানায় পরিচালিত। এই শর্তাবলি প্ল্যাটফর্মের ব্যবহার এবং আমাদের দেওয়া প্রশাসনিক সেবার ক্ষেত্রে প্রযোজ্য।

BDoor কোনো সরকারি কর্তৃপক্ষ **নয়**। BDoor কোনো আইনি প্রতিষ্ঠান **নয়** এবং আইনি পরামর্শ বা আইনি প্রতিনিধিত্ব দেয় না। যেখানে বিষয়টিতে আইনি বা বিশেষায়িত পেশাগত কর্তৃত্ব প্রয়োজন, সেই কাজ করেন একজন স্বাধীন আইনজীবী বা অংশীদার প্রতিষ্ঠান — আপনার সঙ্গে তাঁদের আলাদা চুক্তির অধীনে।`,
      },
    },
    {
      id: 'what-we-do',
      heading: { en: 'What we do and do not do', bn: 'আমরা যা করি এবং যা করি না' },
      body: {
        en: `We do:
- Help you understand which registrations and licences are likely to apply to your intended business.
- Prepare, check and submit applications on your instruction.
- Hold your documents securely and give you a record of every application, fee and decision.
- Track deadlines and remind you before they fall due.

We do not:
- Guarantee that any application will be approved.
- Guarantee a completion date. Every timing we give is an estimate that assumes complete documents and a successful review.
- Provide legal advice, tax advice, or advice on the merits of your business.
- Influence, expedite or intervene in a decision made by any authority.`,
        bn: `আমরা করি:
- আপনার পরিকল্পিত ব্যবসার জন্য কোন নিবন্ধন ও লাইসেন্স সম্ভবত প্রযোজ্য, তা বুঝতে সাহায্য করি।
- আপনার নির্দেশে আবেদন প্রস্তুত, যাচাই ও দাখিল করি।
- আপনার কাগজপত্র নিরাপদে সংরক্ষণ করি এবং প্রতিটি আবেদন, ফি ও সিদ্ধান্তের রেকর্ড দিই।
- সময়সীমা অনুসরণ করি এবং শেষ তারিখের আগে মনে করিয়ে দিই।

আমরা করি না:
- কোনো আবেদন অনুমোদিত হবে তার নিশ্চয়তা দিই না।
- সমাপ্তির তারিখের নিশ্চয়তা দিই না। আমাদের দেওয়া প্রতিটি সময় একটি হিসাব, যা সম্পূর্ণ কাগজপত্র ও সফল যাচাই ধরে নিয়ে করা।
- আইনি পরামর্শ, কর পরামর্শ বা আপনার ব্যবসার যৌক্তিকতা নিয়ে পরামর্শ দিই না।
- কোনো কর্তৃপক্ষের সিদ্ধান্তে প্রভাব ফেলি না, তা দ্রুত করাই না বা হস্তক্ষেপ করি না।`,
      },
    },
    {
      id: 'your-obligations',
      heading: { en: 'Your obligations', bn: 'আপনার দায়িত্ব' },
      body: {
        en: `You agree to give us information and documents that are accurate, complete and current, and to tell us promptly when something changes. Applications are decided on what is submitted; incorrect information causes rejections, and in some cases it is an offence.

You confirm that you are entitled to provide any personal data you give us about other people — directors, shareholders, beneficial owners — and that you have told them their data will be processed as described in our Privacy Policy.

You must not use the platform to conceal ownership, to disguise the source of funds, or for any purpose that is unlawful.`,
        bn: `আপনি সম্মত হচ্ছেন যে আমাদের দেওয়া তথ্য ও কাগজপত্র সঠিক, সম্পূর্ণ ও হালনাগাদ থাকবে, এবং কিছু বদলালে দ্রুত জানাবেন। আবেদনের সিদ্ধান্ত হয় যা দাখিল করা হয়েছে তার ভিত্তিতে; ভুল তথ্য আবেদন প্রত্যাখ্যানের কারণ হয়, আর কোনো কোনো ক্ষেত্রে তা অপরাধ।

আপনি নিশ্চিত করছেন যে অন্য ব্যক্তিদের — পরিচালক, শেয়ারহোল্ডার, প্রকৃত মালিক — সম্পর্কিত যে ব্যক্তিগত তথ্য আপনি দিচ্ছেন তা দেওয়ার অধিকার আপনার আছে, এবং তাঁদের জানানো হয়েছে যে আমাদের গোপনীয়তা নীতিতে বর্ণিত উপায়ে তাঁদের তথ্য প্রক্রিয়া করা হবে।

মালিকানা গোপন করতে, তহবিলের উৎস আড়াল করতে, বা কোনো বেআইনি উদ্দেশ্যে এই প্ল্যাটফর্ম ব্যবহার করা যাবে না।`,
      },
    },
    {
      id: 'quotes-and-fees',
      heading: { en: 'Quotes, fees and payments', bn: 'কোটেশন, ফি ও পেমেন্ট' },
      body: {
        en: `Every quote is itemised and separates:
- the BDoor service fee,
- government fees or estimated government fees,
- partner professional fees, where applicable,
- third-party costs such as notarisation, translation or courier,
- taxes and payment charges.

A quote is valid until the date shown on it and may be reissued as a new version if scope changes. Accepting a quote creates a binding instruction for the work described in that version.

Government fees are estimates until the authority issues a receipt. Where you advance money for a government fee, that money is held for that purpose, the official receipt or challan is attached to your case, and any unused balance is returned to you.

**Investment and share capital is never paid to BDoor.** It is remitted to a bank account in the company's name through the proper banking channel.`,
        bn: `প্রতিটি কোটেশন আইটেম ধরে সাজানো এবং আলাদা করে দেখায়:
- BDoor সেবা ফি,
- সরকারি ফি বা আনুমানিক সরকারি ফি,
- প্রযোজ্য ক্ষেত্রে অংশীদার পেশাজীবীর ফি,
- নোটারি, অনুবাদ বা কুরিয়ারের মতো তৃতীয় পক্ষের খরচ,
- কর ও পেমেন্ট চার্জ।

কোটেশনে উল্লিখিত তারিখ পর্যন্ত তা বৈধ, এবং কাজের পরিধি বদলালে নতুন সংস্করণ ইস্যু করা হতে পারে। কোটেশন গ্রহণ করা মানে ওই সংস্করণে বর্ণিত কাজের জন্য বাধ্যতামূলক নির্দেশ দেওয়া।

কর্তৃপক্ষ রসিদ না দেওয়া পর্যন্ত সরকারি ফি আনুমানিক। আপনি সরকারি ফির জন্য অগ্রিম দিলে সেই অর্থ ওই উদ্দেশ্যেই রাখা হয়, সরকারি রসিদ বা চালান আপনার কেসে সংযুক্ত করা হয়, আর অব্যবহৃত অংশ ফেরত দেওয়া হয়।

**বিনিয়োগ ও শেয়ার মূলধন কখনোই BDoor-কে দেওয়া হয় না।** তা যথাযথ ব্যাংকিং চ্যানেলে কোম্পানির নামে খোলা হিসাবে পাঠানো হয়।`,
      },
    },
    {
      id: 'partners',
      heading: { en: 'Partner professionals', bn: 'অংশীদার পেশাজীবী' },
      body: {
        en: `Where a matter requires an advocate, a chartered accountant or another regulated professional, we identify a verified partner and tell you who they are, what they will receive and why, before anything is shared with them.

Your engagement with that professional is separate from your agreement with BDoor. Their fees are theirs, their professional obligations are theirs, and their advice is theirs. We coordinate; we do not supervise their professional judgement and we do not share in their professional fee in any way that would breach the rules that apply to them.

We share your documents with a partner only after you have authorised that specific sharing.`,
        bn: `যেখানে একজন আইনজীবী, চার্টার্ড অ্যাকাউন্ট্যান্ট বা অন্য নিয়ন্ত্রিত পেশাজীবী প্রয়োজন, সেখানে আমরা একজন যাচাইকৃত অংশীদার নির্ধারণ করি এবং কিছু শেয়ার করার আগেই আপনাকে জানাই তাঁরা কারা, কী পাবেন এবং কেন।

ওই পেশাজীবীর সঙ্গে আপনার চুক্তি BDoor-এর সঙ্গে আপনার চুক্তি থেকে আলাদা। তাঁদের ফি তাঁদের, পেশাগত দায়বদ্ধতা তাঁদের, পরামর্শও তাঁদের। আমরা সমন্বয় করি; তাঁদের পেশাগত বিচারবুদ্ধি তদারকি করি না, এবং তাঁদের ফির ভাগ এমনভাবে নিই না যা তাঁদের ক্ষেত্রে প্রযোজ্য বিধি লঙ্ঘন করে।

আপনি ওই নির্দিষ্ট শেয়ারিং অনুমোদন করার পরই আমরা কোনো অংশীদারের সঙ্গে আপনার কাগজপত্র শেয়ার করি।`,
      },
    },
    {
      id: 'kyc',
      heading: { en: 'Identity and source-of-funds checks', bn: 'পরিচয় ও তহবিলের উৎস যাচাই' },
      body: {
        en: `Because we assist with company formation and administration, we are required to identify our customers and the people who ultimately own or control them. We may ask for identity documents, address evidence, ownership structure and information about the source of funds, and we may decline or discontinue a case if we cannot complete those checks.

We may be legally prohibited from telling you why a case has been declined or reported. If that applies, we will say only that we are unable to proceed.`,
        bn: `যেহেতু আমরা কোম্পানি গঠন ও প্রশাসনে সহায়তা করি, আমাদের গ্রাহক এবং যাঁরা প্রকৃতপক্ষে তাঁদের মালিক বা নিয়ন্ত্রক, তাঁদের শনাক্ত করা আমাদের বাধ্যবাধকতা। আমরা পরিচয়পত্র, ঠিকানার প্রমাণ, মালিকানার কাঠামো এবং তহবিলের উৎস সম্পর্কে তথ্য চাইতে পারি, এবং এই যাচাই সম্পন্ন করা না গেলে কেস প্রত্যাখ্যান বা বন্ধ করতে পারি।

কোনো কেস কেন প্রত্যাখ্যাত বা রিপোর্ট করা হয়েছে তা আপনাকে জানানো আইনত নিষিদ্ধ হতে পারে। সে ক্ষেত্রে আমরা কেবল বলব যে আমরা এগোতে পারছি না।`,
      },
    },
    {
      id: 'liability',
      heading: { en: 'Liability', bn: 'দায়' },
      body: {
        en: `We are responsible for performing our administrative services with reasonable care and skill. We are not responsible for:
- a decision made by any authority, including a refusal or a delay,
- the advice or conduct of an independent partner professional,
- consequences of information you gave us that was inaccurate or incomplete,
- events outside our reasonable control.

*Placeholder: the limitation and cap on liability must be drafted and approved by counsel before launch. Nothing in these terms is intended to exclude liability that cannot lawfully be excluded.*`,
        bn: `আমরা আমাদের প্রশাসনিক সেবা যুক্তিসঙ্গত যত্ন ও দক্ষতার সঙ্গে সম্পাদনের জন্য দায়ী। আমরা দায়ী নই:
- কোনো কর্তৃপক্ষের সিদ্ধান্তের জন্য, প্রত্যাখ্যান বা বিলম্বসহ,
- কোনো স্বাধীন অংশীদার পেশাজীবীর পরামর্শ বা আচরণের জন্য,
- আপনার দেওয়া ভুল বা অসম্পূর্ণ তথ্যের পরিণতির জন্য,
- আমাদের যুক্তিসঙ্গত নিয়ন্ত্রণের বাইরের ঘটনার জন্য।

*স্থানধারক: দায়ের সীমা ও সর্বোচ্চ পরিমাণ চালুর আগে আইনজীবীর মাধ্যমে খসড়া ও অনুমোদন করাতে হবে। আইনত যে দায় বাদ দেওয়া যায় না, এই শর্তাবলির কিছুই তা বাদ দেওয়ার উদ্দেশ্যে নয়।*`,
      },
    },
    {
      id: 'termination',
      heading: { en: 'Ending the relationship', bn: 'সম্পর্ক শেষ করা' },
      body: {
        en: `You may stop instructing us at any time. Work already performed remains payable, and refundability is set out per line item on your quote and in the Refund Policy.

We may decline or discontinue a case where we cannot complete identity checks, where continuing would breach a legal or professional obligation, or where the instruction is outside what we can competently do.

Records we are required to keep are retained after the relationship ends, for the period set out in the Privacy Policy.`,
        bn: `আপনি যেকোনো সময় আমাদের নির্দেশ দেওয়া বন্ধ করতে পারেন। ইতিমধ্যে সম্পন্ন কাজের অর্থ প্রদেয় থাকে, আর কোন আইটেম ফেরতযোগ্য তা আপনার কোটেশনে ও ফেরত নীতিতে উল্লেখ থাকে।

পরিচয় যাচাই সম্পন্ন করা না গেলে, কাজ চালিয়ে গেলে কোনো আইনি বা পেশাগত বাধ্যবাধকতা লঙ্ঘিত হলে, অথবা নির্দেশটি আমাদের দক্ষতার পরিধির বাইরে হলে আমরা কেস প্রত্যাখ্যান বা বন্ধ করতে পারি।

যেসব রেকর্ড রাখা আমাদের বাধ্যবাধকতা, সম্পর্ক শেষ হওয়ার পরও গোপনীয়তা নীতিতে উল্লিখিত সময় পর্যন্ত সেগুলো সংরক্ষিত থাকে।`,
      },
    },
    {
      id: 'law',
      heading: { en: 'Governing law', bn: 'প্রযোজ্য আইন' },
      body: {
        en: `*Placeholder: governing law and dispute resolution must be settled by counsel before launch. The intended position is the law of Bangladesh, with disputes heard in Dhaka.*`,
        bn: `*স্থানধারক: প্রযোজ্য আইন ও বিরোধ নিষ্পত্তি চালুর আগে আইনজীবীর মাধ্যমে চূড়ান্ত করতে হবে। অভিপ্রেত অবস্থান হলো বাংলাদেশের আইন, বিরোধের শুনানি ঢাকায়।*`,
      },
    },
  ],
};

export const PRIVACY: LegalDocument = {
  slug: 'privacy',
  titleKey: 'legal.privacy',
  version: VERSION,
  lastUpdated: LAST_UPDATED,
  awaitingCounselReview: true,
  sections: [
    {
      id: 'what-we-collect',
      heading: { en: 'What we collect and why', bn: 'আমরা কী সংগ্রহ করি এবং কেন' },
      body: {
        en: `We collect only what a specific purpose requires:
- **Account data** — name, email, phone, language. To create and secure your account.
- **Business data** — your intended activity, structure, ownership and location. To work out which registrations apply.
- **Identity data** — national ID or passport details, date of birth, nationality, address evidence. Because we are required to identify our customers and their beneficial owners.
- **Documents** — what you upload and what we receive back from an authority.
- **Financial data** — quotes, invoices, payment status. We do not receive or store your card or bank credentials; those go to the payment gateway.
- **Technical data** — IP address and device information, kept in hashed form in security and audit records.

Every question in the questionnaire that touches on identity, ownership or funding carries a "Why we ask" explanation on the page itself.`,
        bn: `একটি নির্দিষ্ট উদ্দেশ্যে যতটুকু প্রয়োজন, আমরা কেবল ততটুকুই সংগ্রহ করি:
- **অ্যাকাউন্ট তথ্য** — নাম, ইমেইল, ফোন, ভাষা। আপনার অ্যাকাউন্ট তৈরি ও সুরক্ষিত রাখতে।
- **ব্যবসার তথ্য** — আপনার পরিকল্পিত কার্যক্রম, কাঠামো, মালিকানা ও অবস্থান। কোন নিবন্ধন প্রযোজ্য তা নির্ধারণ করতে।
- **পরিচয় তথ্য** — জাতীয় পরিচয়পত্র বা পাসপোর্টের তথ্য, জন্মতারিখ, নাগরিকত্ব, ঠিকানার প্রমাণ। কারণ গ্রাহক ও তাঁদের প্রকৃত মালিকদের শনাক্ত করা আমাদের বাধ্যবাধকতা।
- **কাগজপত্র** — আপনি যা আপলোড করেন এবং কর্তৃপক্ষ থেকে যা ফেরত আসে।
- **আর্থিক তথ্য** — কোটেশন, চালান, পেমেন্টের অবস্থা। আপনার কার্ড বা ব্যাংক শনাক্তকরণ তথ্য আমরা পাই না বা রাখি না; সেগুলো যায় পেমেন্ট গেটওয়েতে।
- **কারিগরি তথ্য** — আইপি ঠিকানা ও ডিভাইসের তথ্য, নিরাপত্তা ও অডিট রেকর্ডে হ্যাশ আকারে রাখা।

প্রশ্নমালার যেসব প্রশ্ন পরিচয়, মালিকানা বা তহবিল সংক্রান্ত, প্রতিটির পাশেই “কেন জিজ্ঞাসা করছি” ব্যাখ্যা থাকে।`,
      },
    },
    {
      id: 'who-we-share-with',
      heading: { en: 'Who we share it with', bn: 'আমরা কাদের সঙ্গে শেয়ার করি' },
      body: {
        en: `- **Government authorities**, as part of an application you have instructed us to make.
- **Partner professionals**, only for a case they are assigned to, only the information that matter needs, and only after you have authorised that specific sharing. The product shows you which partner and for what purpose.
- **Processors** who host or operate the platform on our instruction: our cloud database and storage provider, our email provider, and our payment gateway.

We do not sell personal data, and we do not use it for advertising.`,
        bn: `- **সরকারি কর্তৃপক্ষ**, আপনার নির্দেশে করা কোনো আবেদনের অংশ হিসেবে।
- **অংশীদার পেশাজীবী**, কেবল যে কেসে তাঁরা নিযুক্ত সেটির জন্য, কেবল ওই বিষয়ে যতটুকু তথ্য দরকার, এবং কেবল আপনি ওই নির্দিষ্ট শেয়ারিং অনুমোদন করার পর। কোন অংশীদার ও কী উদ্দেশ্যে, তা প্রোডাক্টে দেখানো হয়।
- **প্রসেসর**, যাঁরা আমাদের নির্দেশে প্ল্যাটফর্ম হোস্ট বা পরিচালনা করেন: আমাদের ক্লাউড ডেটাবেস ও স্টোরেজ সরবরাহকারী, ইমেইল সরবরাহকারী এবং পেমেন্ট গেটওয়ে।

আমরা ব্যক্তিগত তথ্য বিক্রি করি না, এবং বিজ্ঞাপনের জন্য ব্যবহার করি না।`,
      },
    },
    {
      id: 'security',
      heading: { en: 'How we protect it', bn: 'আমরা কীভাবে সুরক্ষা দিই' },
      body: {
        en: `- Documents are held in private storage. There is no public link to any customer document, ever.
- Download links are short-lived and every upload, view, download and replacement is logged with who did it and when.
- Access is enforced in the database itself, not only in the interface: a customer's data is reachable only by their own organisation, their assigned case team, and an authorised partner.
- Staff accounts require two-factor authentication.
- Identity numbers are stored as a last-four fragment plus a one-way token, not as readable numbers.
- Data is encrypted in transit and encrypted at rest by our infrastructure provider.

We do not claim end-to-end encryption, because we do not implement it: our staff can read what they are authorised to read in order to do the work.`,
        bn: `- কাগজপত্র রাখা হয় ব্যক্তিগত স্টোরেজে। কোনো গ্রাহক নথির পাবলিক লিঙ্ক কখনোই থাকে না।
- ডাউনলোড লিঙ্ক স্বল্পস্থায়ী, আর প্রতিটি আপলোড, দেখা, ডাউনলোড ও প্রতিস্থাপন কে কখন করল তা নথিভুক্ত হয়।
- অ্যাক্সেস নিয়ন্ত্রণ কেবল ইন্টারফেসে নয়, ডেটাবেসেই প্রয়োগ করা: একজন গ্রাহকের তথ্যে পৌঁছাতে পারেন কেবল তাঁর নিজের প্রতিষ্ঠান, নিযুক্ত কেস টিম এবং অনুমোদিত অংশীদার।
- কর্মীদের অ্যাকাউন্টে দুই ধাপের নিরাপত্তা বাধ্যতামূলক।
- পরিচয় নম্বর সংরক্ষিত হয় শেষ চার অঙ্ক এবং একমুখী টোকেন আকারে — পাঠযোগ্য নম্বর হিসেবে নয়।
- তথ্য পরিবহনে এনক্রিপ্টেড, এবং আমাদের অবকাঠামো সরবরাহকারীর মাধ্যমে সংরক্ষণেও এনক্রিপ্টেড।

আমরা এন্ড-টু-এন্ড এনক্রিপশনের দাবি করি না, কারণ আমরা তা প্রয়োগ করি না: কাজ করার জন্য আমাদের কর্মীরা যা পড়ার অনুমতি রাখেন, তা পড়তে পারেন।`,
      },
    },
    {
      id: 'retention',
      heading: { en: 'How long we keep it', bn: 'আমরা কতদিন রাখি' },
      body: {
        en: `Retention is set per record category and shown in the product:
- **AML/KYC records** are retained for a statutory period after the relationship ends and cannot be deleted on request during that period.
- **Financial records** are retained for the accounting and tax retention period.
- **Standard case documents** are retained while the relationship is active plus a contractual limitation period.
- **Transient working copies** are deleted once superseded.

*Placeholder: the exact statutory periods must be confirmed by Bangladesh counsel and a chartered accountant before launch. The product stores them as configuration so they can be set correctly without a code change.*`,
        bn: `প্রতিটি রেকর্ড শ্রেণির জন্য সংরক্ষণকাল নির্ধারিত এবং প্রোডাক্টে দেখানো হয়:
- **AML/KYC রেকর্ড** সম্পর্ক শেষ হওয়ার পর বিধিবদ্ধ সময় পর্যন্ত রাখা হয় এবং ওই সময়ে অনুরোধে মুছে ফেলা যায় না।
- **আর্থিক রেকর্ড** হিসাব ও কর সংক্রান্ত সংরক্ষণকাল পর্যন্ত রাখা হয়।
- **সাধারণ কেস ডকুমেন্ট** সম্পর্ক চলাকালীন এবং চুক্তিগত তামাদি সময় পর্যন্ত রাখা হয়।
- **অস্থায়ী কার্যকরী কপি** প্রতিস্থাপিত হওয়ার সঙ্গে সঙ্গে মুছে ফেলা হয়।

*স্থানধারক: সঠিক বিধিবদ্ধ সময়কাল চালুর আগে বাংলাদেশি আইনজীবী ও একজন চার্টার্ড অ্যাকাউন্ট্যান্টের মাধ্যমে নিশ্চিত করতে হবে। প্রোডাক্ট সেগুলো কনফিগারেশন হিসেবে রাখে, যাতে কোড বদল ছাড়াই ঠিক করা যায়।*`,
      },
    },
    {
      id: 'your-rights',
      heading: { en: 'Your rights', bn: 'আপনার অধিকার' },
      body: {
        en: `You can ask us for a copy of your data, ask us to correct it, or ask us to delete it. Requests are made from Settings in your workspace and are recorded.

Where a legal retention obligation applies, we will hold the deletion for that record, tell you which records are held and why, and delete them when the obligation ends. That is a legal limit, not a refusal.`,
        bn: `আপনি আপনার তথ্যের অনুলিপি চাইতে পারেন, সংশোধনের অনুরোধ করতে পারেন, বা মুছে ফেলতে বলতে পারেন। অনুরোধ করা যায় আপনার ওয়ার্কস্পেসের সেটিংস থেকে, এবং তা নথিভুক্ত হয়।

যেখানে আইনি সংরক্ষণ বাধ্যবাধকতা প্রযোজ্য, সেখানে আমরা ওই রেকর্ডের মুছে ফেলা স্থগিত রাখব, কোন রেকর্ড কেন রাখা হচ্ছে তা জানাব, এবং বাধ্যবাধকতা শেষ হলে মুছে ফেলব। এটি একটি আইনি সীমা, প্রত্যাখ্যান নয়।`,
      },
    },
    {
      id: 'transfers',
      heading: { en: 'Where your data is processed', bn: 'আপনার তথ্য কোথায় প্রক্রিয়া হয়' },
      body: {
        en: `Our infrastructure providers may process data outside Bangladesh. The current list of processors, their role and their processing location is maintained in our internal processor register and is available on request.

*Placeholder: the processor register and any cross-border transfer safeguards must be completed and reviewed before launch.*`,
        bn: `আমাদের অবকাঠামো সরবরাহকারীরা বাংলাদেশের বাইরে তথ্য প্রক্রিয়া করতে পারেন। প্রসেসরদের বর্তমান তালিকা, তাঁদের ভূমিকা ও প্রক্রিয়াকরণের অবস্থান আমাদের অভ্যন্তরীণ প্রসেসর রেজিস্টারে রক্ষিত এবং অনুরোধে পাওয়া যায়।

*স্থানধারক: প্রসেসর রেজিস্টার এবং সীমান্ত-পারাপার তথ্য স্থানান্তরের সুরক্ষাব্যবস্থা চালুর আগে সম্পন্ন ও পর্যালোচনা করতে হবে।*`,
      },
    },
  ],
};

export const REFUND_POLICY: LegalDocument = {
  slug: 'refund-policy',
  titleKey: 'legal.refund',
  version: VERSION,
  lastUpdated: LAST_UPDATED,
  awaitingCounselReview: true,
  sections: [
    {
      id: 'principle',
      heading: { en: 'The principle', bn: 'মূলনীতি' },
      body: {
        en: `Refundability is decided per line item, and every quote states it per line **before** you pay. Nothing in this policy is a surprise you discover afterwards.`,
        bn: `ফেরতযোগ্যতা নির্ধারিত হয় প্রতিটি আইটেম ধরে, আর প্রতিটি কোটেশনে পরিশোধের **আগেই** প্রতিটি লাইনের জন্য তা লেখা থাকে। এই নীতির কিছুই পরে আবিষ্কার করার মতো চমক নয়।`,
      },
    },
    {
      id: 'service-fee',
      heading: { en: 'BDoor service fees', bn: 'BDoor সেবা ফি' },
      body: {
        en: `Our service fee covers work we perform. If you cancel before we have started, it is refunded in full. If you cancel part-way, we refund the portion for work not yet performed, and we tell you what that is before you decide.

Our fee is not refundable because an authority refused an application. We are paid for preparing and submitting the application correctly, not for the outcome, and we say so before you pay.`,
        bn: `আমাদের সেবা ফি আমাদের সম্পাদিত কাজের জন্য। কাজ শুরু হওয়ার আগেই বাতিল করলে পুরো ফি ফেরত দেওয়া হয়। মাঝপথে বাতিল করলে যে অংশের কাজ এখনো হয়নি তার ফি ফেরত দেওয়া হয়, এবং সিদ্ধান্ত নেওয়ার আগেই সেটি কত তা জানিয়ে দিই।

কর্তৃপক্ষ আবেদন প্রত্যাখ্যান করেছে বলে আমাদের ফি ফেরতযোগ্য নয়। আমাদের পারিশ্রমিক আবেদনটি সঠিকভাবে প্রস্তুত ও দাখিলের জন্য, ফলাফলের জন্য নয় — এবং পরিশোধের আগেই আমরা তা বলে দিই।`,
      },
    },
    {
      id: 'government-fees',
      heading: { en: 'Government fees', bn: 'সরকারি ফি' },
      body: {
        en: `Money you advance for a government fee is held for that purpose and tracked separately from our revenue.

- If the fee has not yet been paid to the authority, the full advance is returned.
- If it has been paid, refundability is whatever the authority allows — usually nothing. We attach the official receipt or challan so you can see exactly what was paid and to whom.
- Any unused balance is always returned to you.`,
        bn: `সরকারি ফির জন্য আপনার দেওয়া অগ্রিম ওই উদ্দেশ্যেই রাখা হয় এবং আমাদের আয় থেকে আলাদাভাবে হিসাব করা হয়।

- ফি এখনো কর্তৃপক্ষকে পরিশোধ করা না হলে পুরো অগ্রিম ফেরত দেওয়া হয়।
- পরিশোধ করা হয়ে গেলে ফেরত নির্ভর করে কর্তৃপক্ষ কী অনুমোদন করে তার ওপর — সাধারণত কিছুই নয়। আমরা সরকারি রসিদ বা চালান সংযুক্ত করি, যাতে আপনি ঠিক কত এবং কাকে পরিশোধ হয়েছে তা দেখতে পান।
- অব্যবহৃত ব্যালান্স সবসময় আপনাকে ফেরত দেওয়া হয়।`,
      },
    },
    {
      id: 'partner-fees',
      heading: { en: 'Partner professional fees', bn: 'অংশীদার পেশাজীবীর ফি' },
      body: {
        en: `Partner fees are governed by your separate engagement with that professional. We will tell you what their refund terms are before you accept, but we cannot refund on their behalf.`,
        bn: `অংশীদারের ফি ওই পেশাজীবীর সঙ্গে আপনার আলাদা চুক্তি দ্বারা নিয়ন্ত্রিত। গ্রহণ করার আগেই আমরা তাঁদের ফেরত সংক্রান্ত শর্ত জানিয়ে দেব, তবে তাঁদের পক্ষে ফেরত দিতে পারি না।`,
      },
    },
    {
      id: 'how',
      heading: { en: 'How a refund is made', bn: 'ফেরত কীভাবে দেওয়া হয়' },
      body: {
        en: `Refunds are returned to the original payment method wherever the gateway supports it. Request a refund from Billing in your workspace or by writing to us; we will respond with the amount, the line items it covers, and the expected timing.

*Placeholder: statutory refund and consumer-protection requirements must be confirmed by counsel before launch.*`,
        bn: `গেটওয়ে যেখানে সমর্থন করে, সেখানে মূল পেমেন্ট মাধ্যমেই ফেরত দেওয়া হয়। ওয়ার্কস্পেসের বিলিং থেকে বা আমাদের লিখে ফেরতের অনুরোধ করুন; আমরা পরিমাণ, কোন আইটেমগুলো এর আওতায় এবং প্রত্যাশিত সময় জানিয়ে উত্তর দেব।

*স্থানধারক: বিধিবদ্ধ ফেরত ও ভোক্তা-সুরক্ষা সংক্রান্ত শর্ত চালুর আগে আইনজীবীর মাধ্যমে নিশ্চিত করতে হবে।*`,
      },
    },
  ],
};

export const AML_KYC_POLICY: LegalDocument = {
  slug: 'aml-kyc-policy',
  titleKey: 'legal.amlKyc',
  version: VERSION,
  lastUpdated: LAST_UPDATED,
  awaitingCounselReview: true,
  sections: [
    {
      id: 'why',
      heading: { en: 'Why we run these checks', bn: 'কেন আমরা এই যাচাই করি' },
      body: {
        en: `Company formation and administrative services can be misused to hide who really owns a business. Because of that, we identify our customers and the people who ultimately own or control them before we act, and we keep those records.

This is not optional and it is not a formality. If we cannot establish who is behind a business, we do not act for it.`,
        bn: `কোম্পানি গঠন ও প্রশাসনিক সেবা অপব্যবহার করে কে আসলে ব্যবসার মালিক তা আড়াল করা সম্ভব। সে কারণে কাজ শুরুর আগে আমরা আমাদের গ্রাহক এবং যাঁরা প্রকৃতপক্ষে তাঁদের মালিক বা নিয়ন্ত্রক তাঁদের শনাক্ত করি, এবং সেই রেকর্ড সংরক্ষণ করি।

এটি ঐচ্ছিক নয়, আনুষ্ঠানিকতাও নয়। ব্যবসার পেছনে কারা আছেন তা নিশ্চিত করা না গেলে আমরা তার পক্ষে কাজ করি না।`,
      },
    },
    {
      id: 'what-we-check',
      heading: { en: 'What we check', bn: 'আমরা কী যাচাই করি' },
      body: {
        en: `- Identity of each director, shareholder, partner and authorised signatory.
- Address, with supporting evidence.
- Beneficial ownership: the natural people who ultimately own or control the business, including through a corporate or trust shareholder.
- Politically exposed person status.
- Sanctions and adverse-media screening.
- Source of funds and, where the risk requires it, source of wealth.
- The intended business activity and the purpose of the arrangement.

Each of these is tracked as its own status in the case, so you can see what is outstanding.`,
        bn: `- প্রতিটি পরিচালক, শেয়ারহোল্ডার, অংশীদার ও অনুমোদিত স্বাক্ষরকারীর পরিচয়।
- ঠিকানা, সহায়ক প্রমাণসহ।
- প্রকৃত মালিকানা: যাঁরা শেষ পর্যন্ত ব্যবসার মালিক বা নিয়ন্ত্রক, কর্পোরেট বা ট্রাস্ট শেয়ারহোল্ডারের মাধ্যমে হলেও।
- রাজনৈতিকভাবে প্রভাবশালী ব্যক্তির অবস্থা।
- নিষেধাজ্ঞা ও প্রতিকূল সংবাদ স্ক্রিনিং।
- তহবিলের উৎস এবং ঝুঁকি অনুযায়ী প্রয়োজন হলে সম্পদের উৎস।
- পরিকল্পিত ব্যবসায়িক কার্যক্রম এবং ব্যবস্থাটির উদ্দেশ্য।

এগুলোর প্রতিটি কেসে আলাদা অবস্থা হিসেবে অনুসরণ করা হয়, যাতে কোনটি বাকি আছে তা আপনি দেখতে পান।`,
      },
    },
    {
      id: 'risk',
      heading: { en: 'Risk-based approach', bn: 'ঝুঁকিভিত্তিক পদ্ধতি' },
      body: {
        en: `Cases are rated for risk and the depth of the checks follows the rating. Enhanced review applies where there is foreign ownership, a corporate or trust shareholder, a nominee arrangement, a regulated sector, a politically exposed person, or funding we cannot explain from the information given.

A risk rating is recorded with the reason for it and who decided it.`,
        bn: `কেসগুলোর ঝুঁকি নির্ধারণ করা হয় এবং যাচাইয়ের গভীরতা সেই মাত্রা অনুযায়ী হয়। বিদেশি মালিকানা, কর্পোরেট বা ট্রাস্ট শেয়ারহোল্ডার, নমিনি ব্যবস্থা, নিয়ন্ত্রিত খাত, রাজনৈতিকভাবে প্রভাবশালী ব্যক্তি, অথবা প্রদত্ত তথ্য থেকে ব্যাখ্যা করা যায় না এমন তহবিল থাকলে বর্ধিত যাচাই প্রযোজ্য হয়।

ঝুঁকির মাত্রা তার কারণ এবং কে সিদ্ধান্ত নিয়েছেন তা সহ নথিভুক্ত করা হয়।`,
      },
    },
    {
      id: 'decisions',
      heading: { en: 'Decisions and reporting', bn: 'সিদ্ধান্ত ও রিপোর্টিং' },
      body: {
        en: `Every compliance decision is made by a named person, with a recorded reason, and it is not something the software decides on its own. Screening tools assist a reviewer; they never approve or reject a case automatically.

Where we are required to make a report, we do so. We may be legally prohibited from telling you that a report has been made or is being considered. If that applies, we will say only that we are unable to proceed.`,
        bn: `প্রতিটি কমপ্লায়েন্স সিদ্ধান্ত নেন নাম-উল্লিখিত একজন ব্যক্তি, নথিভুক্ত কারণসহ — সফটওয়্যার নিজে থেকে এই সিদ্ধান্ত নেয় না। স্ক্রিনিং টুল পর্যালোচকের সহায়ক; তারা কখনো স্বয়ংক্রিয়ভাবে কোনো কেস অনুমোদন বা প্রত্যাখ্যান করে না।

যেখানে রিপোর্ট করা আমাদের বাধ্যবাধকতা, সেখানে আমরা তা করি। রিপোর্ট করা হয়েছে বা বিবেচনাধীন আছে তা আপনাকে জানানো আইনত নিষিদ্ধ হতে পারে। সে ক্ষেত্রে আমরা কেবল বলব যে আমরা এগোতে পারছি না।`,
      },
    },
    {
      id: 'review',
      heading: { en: 'Status of this policy', bn: 'এই নীতির অবস্থা' },
      body: {
        en: `*This document describes the controls the platform is built to support. It is a draft and must be reviewed, completed and approved by a qualified Bangladesh AML compliance professional before launch, including the appointment of a compliance officer, the reporting thresholds, the record-retention period and the internal escalation procedure. Software alone does not make an organisation compliant.*`,
        bn: `*এই নথিটি বর্ণনা করে প্ল্যাটফর্মটি কোন নিয়ন্ত্রণব্যবস্থাগুলোকে সহায়তা করার জন্য তৈরি। এটি একটি খসড়া এবং চালুর আগে একজন যোগ্য বাংলাদেশি AML কমপ্লায়েন্স পেশাজীবীর মাধ্যমে পর্যালোচনা, সম্পূর্ণ ও অনুমোদন করাতে হবে — যার মধ্যে থাকবে কমপ্লায়েন্স কর্মকর্তা নিয়োগ, রিপোর্টিং সীমা, রেকর্ড সংরক্ষণকাল ও অভ্যন্তরীণ এসকেলেশন পদ্ধতি। কেবল সফটওয়্যার কোনো প্রতিষ্ঠানকে কমপ্লায়েন্ট করে না।*`,
      },
    },
  ],
};

export const LEGAL_DISCLAIMER: LegalDocument = {
  slug: 'legal-disclaimer',
  titleKey: 'legal.disclaimer',
  version: VERSION,
  lastUpdated: LAST_UPDATED,
  awaitingCounselReview: true,
  sections: [
    {
      id: 'not-a-law-firm',
      heading: { en: 'BDoor is not a law firm', bn: 'BDoor কোনো আইনি প্রতিষ্ঠান নয়' },
      body: {
        en: `Nothing on this website, in the questionnaire, in a recommendation, or in any message from BDoor is legal advice. We are an administrative-support platform. If you need advice on your rights, obligations or exposure, you need a lawyer, and we will introduce you to a verified partner advocate under a separate engagement.`,
        bn: `এই ওয়েবসাইটে, প্রশ্নমালায়, কোনো সুপারিশে বা BDoor থেকে আসা কোনো বার্তায় থাকা কিছুই আইনি পরামর্শ নয়। আমরা একটি প্রশাসনিক সহায়তা প্ল্যাটফর্ম। আপনার অধিকার, দায়িত্ব বা ঝুঁকি নিয়ে পরামর্শ দরকার হলে আপনার আইনজীবী প্রয়োজন, এবং আমরা আলাদা চুক্তির অধীনে একজন যাচাইকৃত অংশীদার আইনজীবীর সঙ্গে পরিচয় করিয়ে দেব।`,
      },
    },
    {
      id: 'no-affiliation',
      heading: { en: 'No affiliation with any authority', bn: 'কোনো কর্তৃপক্ষের সঙ্গে সংযুক্তি নেই' },
      body: {
        en: `BDoor is not affiliated with, endorsed by, or acting on behalf of RJSC, BIDA, NBR, CCI&E, any city corporation, any ministry or any other authority. Where we name an authority it is to tell you who decides your application, nothing more.`,
        bn: `BDoor RJSC, BIDA, NBR, CCI&E, কোনো সিটি কর্পোরেশন, কোনো মন্ত্রণালয় বা অন্য কোনো কর্তৃপক্ষের সঙ্গে সংযুক্ত নয়, তাদের অনুমোদনপ্রাপ্ত নয়, এবং তাদের পক্ষে কাজ করে না। আমরা যেখানে কোনো কর্তৃপক্ষের নাম উল্লেখ করি, তা কেবল আপনার আবেদনের সিদ্ধান্ত কে নেয় সেটি জানাতে — এর বেশি কিছু নয়।`,
      },
    },
    {
      id: 'no-guarantees',
      heading: { en: 'No guarantees', bn: 'কোনো নিশ্চয়তা নেই' },
      body: {
        en: `We do not guarantee approval of any application, a visa, residency, work authorisation, a bank account, or a completion date. Timings shown anywhere on this platform are estimates that assume complete documents and a successful review, and they pause while we are waiting on you, a partner or an authority.`,
        bn: `আমরা কোনো আবেদনের অনুমোদন, ভিসা, বসবাসের অনুমতি, কাজের অনুমতি, ব্যাংক হিসাব বা সমাপ্তির তারিখের নিশ্চয়তা দিই না। এই প্ল্যাটফর্মের যেকোনো জায়গায় দেখানো সময় একটি হিসাব, যা সম্পূর্ণ কাগজপত্র ও সফল যাচাই ধরে নিয়ে করা — আর আপনার, অংশীদারের বা কর্তৃপক্ষের অপেক্ষায় থাকলে তা থেমে থাকে।`,
      },
    },
    {
      id: 'content-accuracy',
      heading: { en: 'Accuracy of published information', bn: 'প্রকাশিত তথ্যের নির্ভুলতা' },
      body: {
        en: `Rules, fees and processing times change. Compliance-sensitive pages carry the date they were last reviewed, and we do not publish a government fee unless a verified figure with a source has been recorded. Even so, treat published information as a starting point and confirm what applies to your case with your case team.`,
        bn: `নিয়ম, ফি ও প্রক্রিয়াকরণের সময় বদলায়। কমপ্লায়েন্স-সংবেদনশীল পাতাগুলোতে সর্বশেষ পর্যালোচনার তারিখ থাকে, এবং সূত্রসহ যাচাইকৃত পরিমাণ নথিভুক্ত না হলে আমরা কোনো সরকারি ফি প্রকাশ করি না। তবুও প্রকাশিত তথ্যকে শুরুর বিন্দু হিসেবে দেখুন এবং আপনার কেসে কী প্রযোজ্য তা কেস টিমের সঙ্গে নিশ্চিত করে নিন।`,
      },
    },
  ],
};

export const COOKIE_POLICY: LegalDocument = {
  slug: 'cookie-policy',
  titleKey: 'legal.cookies',
  version: VERSION,
  lastUpdated: LAST_UPDATED,
  awaitingCounselReview: true,
  sections: [
    {
      id: 'what-we-use',
      heading: { en: 'What we store in your browser', bn: 'আপনার ব্রাউজারে আমরা কী রাখি' },
      body: {
        en: `We use a small number of strictly necessary cookies and nothing else by default:
- **Session cookies** set by our authentication provider, so you stay signed in. Without these, the workspace cannot work.
- **A language cookie** remembering whether you chose English or Bangla.
- **A questionnaire draft key**, if you start the questionnaire before creating an account, so your answers survive a page reload. It is removed once your account is created.

We do not load advertising trackers, and we do not use third-party analytics unless it has been configured and, where required, consented to. At the time of writing, analytics is disabled.`,
        bn: `আমরা অল্প কয়েকটি একান্ত প্রয়োজনীয় কুকি ব্যবহার করি, ডিফল্টভাবে আর কিছুই নয়:
- **সেশন কুকি**, যা আমাদের প্রমাণীকরণ সরবরাহকারী সেট করে, যাতে আপনি সাইন ইন থাকেন। এগুলো ছাড়া ওয়ার্কস্পেস কাজ করতে পারে না।
- **ভাষার কুকি**, যা মনে রাখে আপনি ইংরেজি না বাংলা বেছেছেন।
- **প্রশ্নমালার খসড়া কী**, অ্যাকাউন্ট খোলার আগে প্রশ্নমালা শুরু করলে, যাতে পাতা রিলোড হলেও উত্তর থেকে যায়। অ্যাকাউন্ট তৈরি হলে এটি মুছে ফেলা হয়।

আমরা বিজ্ঞাপনী ট্র্যাকার লোড করি না, এবং কনফিগার করা ও প্রয়োজনে সম্মতি নেওয়া না হলে তৃতীয় পক্ষের অ্যানালিটিক্স ব্যবহার করি না। এই লেখার সময় অ্যানালিটিক্স নিষ্ক্রিয়।`,
      },
    },
    {
      id: 'control',
      heading: { en: 'Your control', bn: 'আপনার নিয়ন্ত্রণ' },
      body: {
        en: `You can clear cookies in your browser at any time. Clearing the session cookie signs you out; clearing the questionnaire key loses an unsaved draft. Neither deletes anything already saved to your account.`,
        bn: `আপনি যেকোনো সময় ব্রাউজারের কুকি মুছে ফেলতে পারেন। সেশন কুকি মুছলে আপনি সাইন আউট হয়ে যাবেন; প্রশ্নমালার কী মুছলে অসংরক্ষিত খসড়া হারিয়ে যাবে। এর কোনোটিই আপনার অ্যাকাউন্টে ইতিমধ্যে সংরক্ষিত কিছু মোছে না।`,
      },
    },
  ],
};

export const LEGAL_DOCUMENTS: Record<LegalDocument['slug'], LegalDocument> = {
  terms: TERMS,
  privacy: PRIVACY,
  'refund-policy': REFUND_POLICY,
  'aml-kyc-policy': AML_KYC_POLICY,
  'legal-disclaimer': LEGAL_DISCLAIMER,
  'cookie-policy': COOKIE_POLICY,
};

/** Version stamps recorded against every acceptance. */
export const POLICY_VERSIONS = {
  terms: TERMS.version,
  privacy: PRIVACY.version,
  refund: REFUND_POLICY.version,
  amlKyc: AML_KYC_POLICY.version,
  disclaimer: LEGAL_DISCLAIMER.version,
} as const;
