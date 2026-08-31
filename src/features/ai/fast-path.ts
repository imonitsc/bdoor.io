/**
 * The greeting fast path.
 *
 * "hi" does not deserve a database round-trip to Singapore, an embedding call
 * and a model invocation. A message that is *only* a greeting or a thanks gets
 * an instant canned reply that invites a real question. Deliberately narrow:
 * "hi, how do I register a company?" carries a question and must take the
 * full pipeline — a false fast-path is a swallowed question.
 *
 * Pure and unit-tested.
 */

const GREETING_PATTERNS = [
  /^(hi+|hey+|hello+|yo|hiya|howdy)[\s!.,]*$/i,
  /^good (morning|afternoon|evening|day)[\s!.,]*$/i,
  /^(as-?salamu?[\s-]?alaikum|assalamualaikum|salam|salaam)[\s!.,]*$/i,
  /^(হাই|হ্যালো|হেলো|সালাম|আসসালামু\s?আলাইকুম|শুভ সকাল|শুভ সন্ধ্যা)[\s!।.,]*$/,
  /^(thanks|thank you|thx|ok(ay)?|great|nice)[\s!.,]*$/i,
  /^(ধন্যবাদ|আচ্ছা|ঠিক আছে)[\s!।.,]*$/,
] as const;

export function isGreeting(message: string): boolean {
  const text = message.trim();
  if (text.length === 0 || text.length > 60) return false;
  return GREETING_PATTERNS.some((pattern) => pattern.test(text));
}

const REPLIES = {
  en: 'Hello! Ask me about starting, running, taxing or growing a business in Bangladesh — for example company registration, trade licences, TIN and VAT, or annual filings. What would you like to know?',
  bn: 'হ্যালো! বাংলাদেশে ব্যবসা শুরু, পরিচালনা, কর বা সম্প্রসারণ নিয়ে আমাকে জিজ্ঞাসা করুন — যেমন কোম্পানি নিবন্ধন, ট্রেড লাইসেন্স, টিআইএন ও ভ্যাট, বা বার্ষিক রিটার্ন। আপনি কী জানতে চান?',
} as const;

export function greetingReply(locale: 'en' | 'bn'): string {
  return REPLIES[locale];
}

/**
 * Recorded as the "model" on fast-path rows so the ledger and admin screens
 * can tell a canned reply from a paid answer. Not a model slug on any
 * provider; the boundaries test tolerates it because it names no vendor.
 */
export const FAST_PATH_MODEL = 'bdoor/greeting-fast-path';
