import 'server-only';

import { describeGatewayFailure, type GatewayFailureShape } from './gateway-error';

/**
 * Retrying the gateway's cost lookup.
 *
 * `estimated_cost_usd` has been zero on every answer ever served, and #92
 * traced the reason to a status code rather than guessing at it again. The
 * answer served at 18:25 UTC on 6 September — the first to carry that code —
 * came back:
 *
 *     ai.generation_info.failed  statusCode 404  responseKeys ["error","id","message"]
 *
 * 404, not 401 or 403. The key has access; the generation simply is not
 * retrievable under that id at the moment we ask. We ask the instant the
 * stream ends, and the gateway settles asynchronously, so the lookup is
 * racing a write that has not landed. That makes it ours to fix, and the fix
 * is to ask again shortly rather than to redesign anything.
 *
 * Which failures deserve a second ask is the part worth being careful about.
 * A 401 or 403 is a permission decision, and asking again cannot change a
 * permission decision — it just spends a second of a live function to receive
 * the same refusal. Those give up immediately and stay an owner blocker.
 *
 * The lookup runs after the answer has streamed, so the customer is not
 * waiting on this; what the delay costs is function time and a later
 * `persisted` mark. That is why the schedule is short and finite rather than
 * a general-purpose backoff.
 */

/**
 * Waits before each retry, in order. Two entries means at most three attempts
 * and at most 1.2s added — enough for an asynchronous settle, not enough to
 * matter against a lookup that is never going to succeed.
 */
export const GENERATION_INFO_RETRY_DELAYS_MS: readonly number[] = [300, 900];

/**
 * Whether asking again could plausibly give a different answer.
 *
 * 404 is the settle race this exists for. 5xx is the gateway having a bad
 * moment. Everything else — a permission refusal above all — is a decision,
 * and a decision does not change because it was questioned twice. An absent
 * status code means the error never reached the point of having one, and
 * retrying an unrecognised failure shape is how a quiet bug becomes a loud
 * one.
 */
export function retryableGatewayFailure(statusCode: number | null): boolean {
  if (statusCode === null) return false;
  if (statusCode === 404) return true;
  return statusCode >= 500;
}

export type LookupOutcome<T> =
  | { ok: true; value: T; attempts: number }
  | { ok: false; failure: GatewayFailureShape; attempts: number };

/**
 * Run `lookup`, retrying only the failures worth retrying.
 *
 * `sleep` is injected so the schedule can be asserted in a test without
 * spending the wall time it describes. `attempts` is reported either way: an
 * answer that needed three tries and one that needed none are both successes,
 * and only the count distinguishes a healthy gateway from one that is
 * consistently late.
 */
export async function lookupWithRetry<T>(
  lookup: () => Promise<T>,
  sleep: (ms: number) => Promise<void>,
  delaysMs: readonly number[] = GENERATION_INFO_RETRY_DELAYS_MS,
): Promise<LookupOutcome<T>> {
  for (let attempt = 0; ; attempt += 1) {
    try {
      return { ok: true, value: await lookup(), attempts: attempt + 1 };
    } catch (error) {
      const failure = describeGatewayFailure(error);
      const delay = delaysMs[attempt];

      if (delay === undefined || !retryableGatewayFailure(failure.statusCode)) {
        return { ok: false, failure, attempts: attempt + 1 };
      }

      await sleep(delay);
    }
  }
}
