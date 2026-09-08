import { describe, expect, it } from 'vitest';

import {
  appendTranscript,
  finalTranscript,
  voiceErrorKey,
  type SpeechResultEvent,
} from '@/features/ai/voice-input';

/**
 * The composer's microphone.
 *
 * It shipped with no tests, and with three defects that together make it look
 * like a dead button. Each case below pins one of them, so the failure mode is
 * described rather than merely fixed.
 */

function event(
  results: { transcript: string; isFinal: boolean }[],
  resultIndex = 0,
): SpeechResultEvent {
  return {
    resultIndex,
    results: results.map((r) =>
      Object.assign([{ transcript: r.transcript }], { isFinal: r.isFinal }),
    ),
  };
}

describe('finalTranscript', () => {
  it('reads the settled text of a single phrase', () => {
    expect(
      finalTranscript(event([{ transcript: 'how do I register a company', isFinal: true }])),
    ).toBe('how do I register a company');
  });

  it('takes only results the event says are new', () => {
    // `results` accumulates across the whole session. Reading it from zero on
    // every event — which the original did — re-appends everything already
    // written, so a three-phrase sentence arrives six times over.
    const all = event(
      [
        { transcript: 'first phrase', isFinal: true },
        { transcript: 'second phrase', isFinal: true },
      ],
      1,
    );

    expect(finalTranscript(all)).toBe('second phrase');
  });

  it('ignores interim results, which the recogniser is still revising', () => {
    expect(finalTranscript(event([{ transcript: 'how do I regis', isFinal: false }]))).toBe('');
  });

  it('keeps the final part of a mixed event and drops the interim one', () => {
    const mixed = event([
      { transcript: 'what is a trade licence', isFinal: true },
      { transcript: 'and how', isFinal: false },
    ]);

    expect(finalTranscript(mixed)).toBe('what is a trade licence');
  });

  it('returns nothing for an event carrying nothing', () => {
    expect(finalTranscript(event([]))).toBe('');
  });

  it('survives a result with no alternatives rather than throwing mid-dictation', () => {
    const empty: SpeechResultEvent = {
      resultIndex: 0,
      results: [Object.assign([] as { transcript: string }[], { isFinal: true })],
    };

    expect(finalTranscript(empty)).toBe('');
  });
});

describe('appendTranscript', () => {
  it('is the whole value when the box is empty', () => {
    expect(appendTranscript('', 'how do I register a company')).toBe('how do I register a company');
  });

  it('follows existing text instead of replacing it', () => {
    // The original captured `value` when the microphone opened, so the second
    // phrase of a sentence was appended to the text as it was BEFORE the
    // first phrase — silently discarding it.
    expect(appendTranscript('how do I register a company', 'in Dhaka')).toBe(
      'how do I register a company in Dhaka',
    );
  });

  it('does not double the space after text the customer left hanging', () => {
    expect(appendTranscript('what is a trade licence ', 'for a shop')).toBe(
      'what is a trade licence for a shop',
    );
  });

  it('treats a whitespace-only box as empty', () => {
    expect(appendTranscript('   ', 'hello')).toBe('hello');
  });

  it('leaves the value untouched when there is nothing to add', () => {
    expect(appendTranscript('existing question', '')).toBe('existing question');
  });
});

describe('voiceErrorKey', () => {
  it('says nothing when we stopped the recogniser ourselves', () => {
    // Pressing the button again, or leaving the page, aborts it. Showing an
    // error for the customer's own action would be a lie.
    expect(voiceErrorKey('aborted')).toBeNull();
  });

  it.each(['not-allowed', 'service-not-allowed'])('maps %s to a permission message', (code) => {
    expect(voiceErrorKey(code)).toBe('denied');
  });

  it('distinguishes a missing microphone from a refused one', () => {
    expect(voiceErrorKey('audio-capture')).toBe('noMicrophone');
  });

  it('names silence as silence', () => {
    expect(voiceErrorKey('no-speech')).toBe('noSpeech');
  });

  it('names the network, which Chrome needs because recognition is remote', () => {
    expect(voiceErrorKey('network')).toBe('network');
  });

  it('still says something for a code it does not know', () => {
    // The old handler swallowed every error into silence, which is the one
    // outcome that leaves the customer with no idea what happened.
    expect(voiceErrorKey('some-future-code')).toBe('unknown');
  });
});
