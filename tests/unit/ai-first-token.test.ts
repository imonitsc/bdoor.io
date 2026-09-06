import { describe, expect, it } from 'vitest';

import { marksFirstToken } from '@/features/ai/timings';

/**
 * What counts as "first token" for the §7.3 gate.
 *
 * `streamText`'s `onChunk` fires for every `TextStreamPart`. Several of those
 * arrive before any text does, and marking on one of them measures when the
 * request reached the model rather than when the customer saw a word — which
 * is what the gate is about. The names below are taken from the installed
 * `ai` package's `TextStreamPart` union, not from memory.
 */

describe('marksFirstToken', () => {
  it('counts a text delta, which is the only part that carries text', () => {
    expect(marksFirstToken('text-delta')).toBe(true);
  });

  it.each([
    // Emitted when the stream opens, before the model has produced anything.
    'start',
    'start-step',
    // Announces that a text block is coming — the text itself is not here yet.
    'text-start',
  ])('does not count %s, which arrives before any text', (type) => {
    expect(marksFirstToken(type)).toBe(false);
  });

  it.each(['reasoning-start', 'reasoning-delta', 'tool-input-start', 'source', 'raw'])(
    'does not count %s, which is not text the customer is reading',
    (type) => {
      expect(marksFirstToken(type)).toBe(false);
    },
  );

  it.each(['text-end', 'finish-step', 'finish'])(
    'does not count %s, which comes after the text it closes',
    (type) => {
      expect(marksFirstToken(type)).toBe(false);
    },
  );
});
