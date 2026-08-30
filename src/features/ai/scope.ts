/**
 * Scope guard.
 *
 * The system prompt already tells Claude to decline unrelated requests, and it
 * does. This runs first anyway, for two reasons that have nothing to do with
 * trusting the model: an out-of-scope question costs a full model call to
 * refuse, and a refusal written here is bilingual, consistent, and testable.
 *
 * It is intentionally narrow. Anything it is not confident about goes to the
 * model, because a false refusal on a real business question is far more
 * damaging than paying for one model call to decline a joke.
 */

const OUT_OF_SCOPE = [
  // Entertainment and general-purpose assistant requests.
  /\b(write|compose|generate)\b.{0,20}\b(poem|song|story|joke|essay|rap|script)\b/i,
  /\b(tell|say)\b.{0,12}\bjoke\b/i,
  /\bwho (won|will win)\b.{0,30}\b(match|cup|election|game)\b/i,
  /\b(movie|film|drama|song|lyrics|recipe|horoscope)\b.{0,20}\b(recommend|suggest|best)\b/i,
  // Coding-assistant requests: this is a business assistant, not a coding one.
  /\b(write|debug|fix|refactor)\b.{0,20}\b(code|python|javascript|sql query|function)\b/i,
  // Medical and personal.
  /\b(symptom|diagnos\w+|prescription|medicine for|treatment for)\b/i,
  /\b(my (wife|husband|girlfriend|boyfriend|relationship))\b/i,
  // Party politics. Government process is in scope; who to vote for is not.
  /\bwho should i vote\b/i,
  /\b(awami|bnp|jamaat)\b.{0,30}\b(better|support|vote)\b/i,
];

/** Signals that keep a borderline question in scope. */
const IN_SCOPE = [
  /\b(compan(y|ies)|business|firm|entity|proprietor|partnership|rjsc|incorporat\w+)\b/i,
  /\b(licen[cs]e|trade licence|trade license|permit|registration|register)\b/i,
  /\b(tin|bin|vat|tax|nbr|customs|bond|duty)\b/i,
  /\b(bank account|capital|shareholder|director|share|remit\w*)\b/i,
  /\b(import|export|erc|irc)\b/i,
  /\b(compliance|annual return|audit|bookkeeping|accounts?)\b/i,
  /\b(package|price|pricing|fee|cost|charge|how much|timeline|how long)\b/i,
  /\b(bangladesh|dhaka|chattogram|usa|uk|uae|dubai|singapore|saudi|qatar)\b/i,
  /\b(bdoor|specialist|application|apply)\b/i,
  // Bangla keywords for the same territory.
  /(কোম্পানি|ব্যবসা|লাইসেন্স|নিবন্ধন|ট্রেড|ভ্যাট|কর|শেয়ার|পরিচালক|আমদানি|রপ্তানি|খরচ|মূল্য|প্যাকেজ)/,
];

export type ScopeDecision = { inScope: true } | { inScope: false; reason: 'out_of_scope' };

export function classifyScope(question: string): ScopeDecision {
  const text = question.trim();
  if (!text) return { inScope: false, reason: 'out_of_scope' };

  const looksOut = OUT_OF_SCOPE.some((pattern) => pattern.test(text));
  if (!looksOut) return { inScope: true };

  // A question can be both: "how much does a company registration cost, and
  // tell me a joke" is a business question with noise attached. Business
  // signals win, because answering the real part is the helpful behaviour.
  const looksIn = IN_SCOPE.some((pattern) => pattern.test(text));
  return looksIn ? { inScope: true } : { inScope: false, reason: 'out_of_scope' };
}

/**
 * The decline. Written here rather than generated so it is identical every
 * time, translated properly, and points somewhere useful.
 */
export function outOfScopeReply(locale: 'en' | 'bn'): string {
  return locale === 'bn'
    ? 'আমি Ask bdoor AI — আমি শুধু বাংলাদেশ ও সমর্থিত দেশগুলোতে ব্যবসা শুরু, পরিচালনা ও কমপ্লায়েন্স সংক্রান্ত প্রশ্নের উত্তর দিই। এই বিষয়ে কিছু জিজ্ঞাসা করলে সাহায্য করতে পারব — যেমন কোম্পানি নিবন্ধন, ট্রেড লাইসেন্স, ভ্যাট ও কর, বা প্যাকেজের মূল্য।'
    : 'I am Ask bdoor AI, so I only cover starting, running and expanding a business in Bangladesh and the countries bdoor supports. Ask me about company registration, licences, TIN, VAT and BIN, annual compliance or package pricing and I can help.';
}
