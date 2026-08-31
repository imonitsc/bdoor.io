/**
 * Version comparison for official documents.
 *
 * When a source re-fetch produces different bytes, the interesting question
 * is not "did it change" (the checksum already answered that) but "did
 * something a customer relies on change" — a fee, a deadline, a form. Those
 * lines produce targeted review alerts; everything else is a plain
 * new-version alert.
 *
 * This is a change *detector*, not a change *interpreter*: it flags lines for
 * a human reviewer and never edits published knowledge by itself.
 *
 * Pure logic, unit-tested directly.
 */

export type ChangeSignal = {
  type: 'fee_change' | 'deadline_change' | 'form_change' | 'withdrawn_notice';
  /** The changed line, trimmed for the alert. */
  line: string;
  direction: 'added' | 'removed';
};

const FEE_PATTERN =
  /(৳|tk\.?|taka|টাকা|bdt)\s*[0-9০-৯,]+|[0-9০-৯,]+\s*(৳|tk\.?|taka|টাকা)|\bfee(s)?\b.{0,40}[0-9০-৯]|ফি.{0,30}[0-9০-৯]/i;

const DEADLINE_PATTERN =
  /\bwithin\s+[0-9০-৯]+\s+(day|week|month|year)s?\b|\bdeadline\b|\b(by|before|not later than)\s+[0-9০-৯]{1,2}\s+(january|february|march|april|may|june|july|august|september|october|november|december)|[0-9০-৯]+\s*(দিন|মাস|বছর)ের মধ্যে|সময়সীমা/i;

const FORM_PATTERN = /\b(form|ফরম)\s+[A-Za-z0-9০-৯-]+|\bannexure\b|\bসংযোজনী\b/i;

const WITHDRAWN_PATTERN =
  /\b(repeal(ed)?|rescind(ed)?|withdraw(n)?|superseded|hereby cancelled|বাতিল|রহিত)\b/i;

function significantLines(text: string): Set<string> {
  return new Set(
    text
      .split('\n')
      .map((line) => line.replace(/\s+/g, ' ').trim())
      .filter((line) => line.length > 0),
  );
}

function classify(line: string): ChangeSignal['type'] | null {
  // Withdrawal outranks the others: a rescinded instrument matters more than
  // the fee printed inside it.
  if (WITHDRAWN_PATTERN.test(line)) return 'withdrawn_notice';
  if (FEE_PATTERN.test(line)) return 'fee_change';
  if (DEADLINE_PATTERN.test(line)) return 'deadline_change';
  if (FORM_PATTERN.test(line)) return 'form_change';
  return null;
}

const MAX_SIGNALS = 40;

/**
 * Compare two extracted texts and return the customer-relevant changes.
 * Line-set difference rather than a positional diff: official republications
 * reorder and repaginate freely, and a moved line is not a change.
 */
export function detectChanges(previousText: string, nextText: string): ChangeSignal[] {
  const before = significantLines(previousText);
  const after = significantLines(nextText);
  const signals: ChangeSignal[] = [];

  for (const line of after) {
    if (signals.length >= MAX_SIGNALS) break;
    if (before.has(line)) continue;
    const type = classify(line);
    if (type) signals.push({ type, line: line.slice(0, 300), direction: 'added' });
  }
  for (const line of before) {
    if (signals.length >= MAX_SIGNALS) break;
    if (after.has(line)) continue;
    const type = classify(line);
    if (type) signals.push({ type, line: line.slice(0, 300), direction: 'removed' });
  }

  return signals;
}
