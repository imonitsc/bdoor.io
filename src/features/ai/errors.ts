/**
 * Failure modes the customer is allowed to see, and the copy for each.
 *
 * The assistant never silently degrades: if Claude cannot be reached, the
 * customer is told so and offered a human, rather than being handed a worse
 * answer from a different model that they have no way of recognising as such.
 */

export type AiFailure =
  | 'rate_limited'
  | 'budget_exceeded'
  | 'upstream_unavailable'
  | 'timeout'
  | 'disabled'
  | 'too_long'
  | 'unknown';

const COPY: Record<AiFailure, { en: string; bn: string }> = {
  rate_limited: {
    en: 'You have asked a lot of questions in a short time. Please wait a minute and try again, or speak with a specialist.',
    bn: 'অল্প সময়ে অনেকগুলো প্রশ্ন করা হয়েছে। এক মিনিট পরে আবার চেষ্টা করুন, অথবা একজন বিশেষজ্ঞের সঙ্গে কথা বলুন।',
  },
  budget_exceeded: {
    en: 'Ask bdoor AI has reached its usage limit for today. Please try again tomorrow, or speak with a specialist now.',
    bn: 'Ask bdoor AI আজকের ব্যবহারসীমায় পৌঁছেছে। আগামীকাল আবার চেষ্টা করুন, অথবা এখনই একজন বিশেষজ্ঞের সঙ্গে কথা বলুন।',
  },
  upstream_unavailable: {
    en: 'Ask bdoor AI is temporarily unavailable. Nothing is wrong with your question — please try again shortly, or speak with a specialist.',
    bn: 'Ask bdoor AI সাময়িকভাবে অনুপলব্ধ। আপনার প্রশ্নে কোনো সমস্যা নেই — কিছুক্ষণ পরে আবার চেষ্টা করুন, অথবা একজন বিশেষজ্ঞের সঙ্গে কথা বলুন।',
  },
  timeout: {
    en: 'That answer took too long to arrive. Please try again with a narrower question, or speak with a specialist.',
    bn: 'উত্তর আসতে অনেক সময় লেগেছে। আরও নির্দিষ্ট প্রশ্ন করে আবার চেষ্টা করুন, অথবা একজন বিশেষজ্ঞের সঙ্গে কথা বলুন।',
  },
  disabled: {
    en: 'Ask bdoor AI is not switched on yet. A specialist can answer your question in the meantime.',
    bn: 'Ask bdoor AI এখনো চালু হয়নি। ইতিমধ্যে একজন বিশেষজ্ঞ আপনার প্রশ্নের উত্তর দিতে পারবেন।',
  },
  too_long: {
    en: 'That question is longer than the assistant accepts. Please shorten it and try again.',
    bn: 'প্রশ্নটি অনুমোদিত দৈর্ঘ্যের চেয়ে বড়। সংক্ষিপ্ত করে আবার চেষ্টা করুন।',
  },
  unknown: {
    en: 'Something went wrong answering that. Please try again, or speak with a specialist.',
    bn: 'উত্তর দিতে সমস্যা হয়েছে। আবার চেষ্টা করুন, অথবা একজন বিশেষজ্ঞের সঙ্গে কথা বলুন।',
  },
};

/**
 * The decline when retrieval found nothing to stand on.
 *
 * Deliberately NOT an `AiFailure`, for the same reason `out_of_scope` is not:
 * nothing went wrong. The assistant was asked something it has no approved
 * source for, and saying so is the correct, complete answer — §7.1 step 10 and
 * §23.2. Treating it as an error would tell the customer to retry, which
 * cannot help, and would hide a coverage gap behind what looks like an outage.
 */
export function noEvidenceReply(locale: 'en' | 'bn'): string {
  return locale === 'bn'
    ? 'এই প্রশ্নের উত্তর দেওয়ার মতো অনুমোদিত সরকারি বা যাচাই করা উৎস আমার কাছে এখনো নেই, তাই অনুমান করে বলব না। একজন বিশেষজ্ঞ এটি দেখে দিতে পারবেন, এবং প্রশ্নটি আমাদের কভারেজ তালিকায় যুক্ত হলো।'
    : 'I do not have an approved official source that answers this, so I will not guess at it. A specialist can review the question for you, and I have added it to our coverage backlog.';
}

export function failureMessage(failure: AiFailure, locale: 'en' | 'bn'): string {
  return COPY[failure][locale];
}

export function failureStatus(failure: AiFailure): number {
  switch (failure) {
    case 'rate_limited':
      return 429;
    case 'budget_exceeded':
      return 402;
    case 'too_long':
      return 413;
    case 'disabled':
      return 503;
    case 'upstream_unavailable':
    case 'timeout':
      return 503;
    default:
      return 500;
  }
}

/**
 * Map a gateway or network failure onto a customer-visible failure. AI Gateway
 * answers a budget rejection with 402 and `quota_for_entity_exceeded`, which is
 * a different situation from an outage and gets different copy.
 */
export function classifyUpstreamError(error: unknown): AiFailure {
  const message = error instanceof Error ? error.message : String(error ?? '');
  if (/quota_for_entity_exceeded|budget/i.test(message)) return 'budget_exceeded';
  if (/abort|timed? ?out/i.test(message)) return 'timeout';
  if (/429|rate.?limit/i.test(message)) return 'rate_limited';
  if (/5\d\d|unavailable|ECONNRESET|fetch failed|network/i.test(message)) {
    return 'upstream_unavailable';
  }
  return 'unknown';
}
