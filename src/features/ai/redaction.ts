/**
 * Redaction applied before anything is written to the database or a log line.
 *
 * The assistant never asks for an identity number, but customers volunteer
 * them anyway — a passport number pasted into "can a foreigner with passport
 * X4123... start a company" is the normal case, not the exotic one. Redacting
 * on the way in means the transcript store never becomes a store of
 * identifiers, so a later leak of it is a leak of questions rather than of
 * people.
 *
 * Deliberately conservative: it over-redacts a long invoice number rather than
 * under-redacting a national ID. The redacted copy is what is persisted; the
 * live model call sees the original text, because refusing to read the
 * question the customer actually asked would make the feature useless.
 */

type Rule = { name: string; pattern: RegExp; replacement: string };

const RULES: Rule[] = [
  { name: 'email', pattern: /[\w.+-]+@[\w-]+\.[\w.-]+/g, replacement: '[email removed]' },
  // Bangladesh NID: exactly 10, 13 or 17 digits with no separators. Checked
  // BEFORE the card rule, whose 13-19 digit range overlaps it — in a Bangladesh
  // business context an unformatted 13-digit number is an NID, and a card is
  // almost always pasted with spaces or dashes. Both are redacted either way;
  // this only decides which label the telemetry records, and a label that is
  // usually wrong makes the telemetry useless for spotting what people paste.
  {
    name: 'nid',
    pattern: /\b(?:\d{17}|\d{13}|\d{10})\b/g,
    replacement: '[ID number removed]',
  },
  // Card-like runs: 13-19 digits, however the customer grouped them. Anything
  // that was an NID has already been replaced above, so this cannot claim one.
  {
    name: 'card',
    pattern: /\b\d(?:[ -]?\d){12,18}\b/g,
    replacement: '[card number removed]',
  },
  { name: 'passport', pattern: /\b[A-Z]{1,2}\d{7,8}\b/g, replacement: '[passport number removed]' },
  // Phone numbers, international or local Bangladeshi.
  {
    name: 'phone',
    pattern: /(?:\+?88)?01\d[ -]?\d{4}[ -]?\d{4}\b/g,
    replacement: '[phone number removed]',
  },
  {
    name: 'tin',
    pattern: /\b(?:TIN|BIN|e-?TIN)[:\s-]*\d[\d-]{7,}\b/gi,
    replacement: '[tax number removed]',
  },
];

export type RedactionResult = { text: string; redacted: string[] };

export function redactSensitive(input: string): RedactionResult {
  let text = input;
  const redacted: string[] = [];

  for (const rule of RULES) {
    // `test` advances lastIndex on a global regex, so each rule gets a fresh
    // one rather than sharing state across calls.
    const probe = new RegExp(rule.pattern.source, rule.pattern.flags);
    if (probe.test(text)) {
      redacted.push(rule.name);
      text = text.replace(new RegExp(rule.pattern.source, rule.pattern.flags), rule.replacement);
    }
  }

  return { text, redacted };
}

/**
 * Log-safe summary of a message: length and which rules fired, never the text.
 * Prompts are never logged in full — a question can carry personal information
 * even after redaction, in prose the rules above cannot see.
 */
export function messageTelemetry(input: string): { chars: number; redacted: string[] } {
  const { redacted } = redactSensitive(input);
  return { chars: input.length, redacted };
}
