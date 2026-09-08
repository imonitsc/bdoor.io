/**
 * The decisions behind the composer's microphone.
 *
 * Voice input shipped with no tests and three defects that together make it
 * behave, from the customer's side, like a button that does nothing:
 *
 *  1. `onresult` closed over the `value` from the render that started
 *     listening. The second phrase in a session was appended to the FIRST
 *     render's text, so it replaced the first phrase instead of following it —
 *     and anything typed while the mic was open was silently discarded.
 *  2. `continuous` was never set, so it defaults to false and recognition ends
 *     at the first pause. A dictated sentence with a breath in it stops
 *     halfway and the button flips itself back off.
 *  3. Every error was swallowed into `setListening(false)`. A denied
 *     microphone permission, a muted device and a network failure were
 *     indistinguishable from "nothing happened" — no message, no state, just a
 *     button that un-pressed itself.
 *
 * Turning `continuous` on makes the third piece necessary: `event.results`
 * accumulates across the whole session, so re-reading it from index 0 on every
 * event — which the old code did — appends the entire transcript again each
 * time. Only results from `event.resultIndex` onward are new, and only final
 * ones are settled text.
 *
 * These are pure so they can be tested without a browser, a microphone or a
 * permission prompt. `SpeechRecognition` cannot be exercised in jsdom, so the
 * only alternative would be no coverage at all — which is how it got here.
 */

/** The parts of a `SpeechRecognitionEvent` this needs. */
export type SpeechResultEvent = {
  /** Index of the first result that is new since the previous event. */
  resultIndex: number;
  results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal: boolean }>;
};

/**
 * The settled text this event adds, and nothing it has already reported.
 *
 * Interim results are skipped: they change as the recogniser revises its
 * guess, and writing them into a textarea the customer may also be editing
 * turns their own edits into a race.
 */
export function finalTranscript(event: SpeechResultEvent): string {
  const parts: string[] = [];

  for (let i = Math.max(0, event.resultIndex); i < event.results.length; i += 1) {
    const result = event.results[i];
    if (!result?.isFinal) continue;
    const text = result[0]?.transcript?.trim();
    if (text) parts.push(text);
  }

  return parts.join(' ');
}

/**
 * Speech appended after what is already in the box.
 *
 * The caller must pass the CURRENT value — read through a ref, not captured
 * when listening began — or this restores defect 1 by another route.
 */
export function appendTranscript(current: string, transcript: string): string {
  if (!transcript) return current;
  if (!current.trim()) return transcript;
  return `${current.replace(/\s+$/, '')} ${transcript}`;
}

/**
 * Which message to show, or null when silence is right.
 *
 * `aborted` is the code the browser reports when we stop the recogniser
 * ourselves — on unmount, or when the customer presses the button again. That
 * is not a failure and must not be dressed as one.
 */
export type VoiceErrorKey = 'denied' | 'noMicrophone' | 'noSpeech' | 'network' | 'unknown';

export function voiceErrorKey(code: string): VoiceErrorKey | null {
  switch (code) {
    case 'aborted':
      return null;
    // Two distinct codes, one cause: the page may not use the microphone.
    case 'not-allowed':
    case 'service-not-allowed':
      return 'denied';
    case 'audio-capture':
      return 'noMicrophone';
    case 'no-speech':
      return 'noSpeech';
    // Chrome streams audio to a remote recogniser, so an offline device fails
    // here rather than at the microphone.
    case 'network':
      return 'network';
    default:
      return 'unknown';
  }
}
