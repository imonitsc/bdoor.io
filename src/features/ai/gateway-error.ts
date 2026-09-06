/**
 * Describing a gateway failure without logging its contents.
 *
 * The cost lookup has been failing on every answer since instrumentation
 * landed, and the log said only:
 *
 *     ai.generation_info.failed — "Invalid error response format: Gateway request failed"
 *
 * That message is produced in exactly one place in `@ai-sdk/gateway`
 * (`createGatewayErrorFromResponse`), and reading it settles two things. The
 * suffix is bare `Gateway request failed`, which is the `defaultMessage` used
 * only on the `APICallError` branch — so the request DID reach the gateway and
 * came back non-2xx, rather than failing to connect. And the "invalid error
 * response format" prefix means the body did not match the gateway's own error
 * schema, so it carried no `error.message` to report.
 *
 * What it cannot tell us is WHICH failure it is, and the difference decides who
 * fixes it:
 *
 *   - 401/403 — the gateway key has no access to the generation endpoint. An
 *     owner changes a key; no amount of code helps.
 *   - 404 — the generation is not retrievable under that id, most plausibly
 *     because the lookup runs the instant the stream ends and the gateway
 *     settles asynchronously. That is ours to fix, by deferring or retrying.
 *   - 5xx — transient, and worth a bounded retry rather than a redesign.
 *
 * The error already carries the status code; the previous log discarded it.
 * This extracts the fields that discriminate, and deliberately never the body:
 * response VALUES could carry prompt or completion text, which §17 forbids in
 * logs. Key names alone identify the shape, which is all the diagnosis needs.
 */

export type GatewayFailureShape = {
  message: string;
  /** The HTTP status the gateway replied with, when the error carries one. */
  statusCode: number | null;
  /**
   * Top-level key names of the response body — never their values. Null when
   * the body was absent or not a plain object.
   */
  responseKeys: string[] | null;
};

/** More keys than this says "unexpected shape" just as well as all of them. */
const MAX_KEYS = 12;

export function describeGatewayFailure(error: unknown): GatewayFailureShape {
  const message = error instanceof Error ? error.message : String(error);

  const record =
    typeof error === 'object' && error !== null ? (error as Record<string, unknown>) : null;

  const status = record?.statusCode;
  const statusCode = typeof status === 'number' ? status : null;

  const response = record?.response;
  const responseKeys =
    typeof response === 'object' && response !== null && !Array.isArray(response)
      ? Object.keys(response).slice(0, MAX_KEYS).sort()
      : null;

  return { message, statusCode, responseKeys };
}
