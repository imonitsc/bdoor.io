/**
 * Errors that are safe to surface. `AuthorizationError` deliberately carries no
 * detail about *why* access failed — the correlation id is how support finds it.
 */
export class AuthorizationError extends Error {
  readonly correlationId: string;
  readonly capability: string | undefined;

  constructor(capability?: string, correlationId = crypto.randomUUID()) {
    super('Not authorized');
    this.name = 'AuthorizationError';
    this.capability = capability;
    this.correlationId = correlationId;
  }
}

/**
 * The caller holds the capability but has not presented a second factor on this
 * request. Distinct from AuthorizationError because the remedy is different:
 * there is something the user can do about it, and the UI should say so rather
 * than showing a flat refusal.
 */
export class StepUpRequiredError extends Error {
  readonly capability: string;

  constructor(capability: string) {
    super('Second factor required');
    this.name = 'StepUpRequiredError';
    this.capability = capability;
  }
}

export class AuthenticationError extends Error {
  constructor() {
    super('Not authenticated');
    this.name = 'AuthenticationError';
  }
}

export class ValidationError extends Error {
  readonly fieldErrors: Record<string, string[]>;

  constructor(fieldErrors: Record<string, string[]>, message = 'Validation failed') {
    super(message);
    this.name = 'ValidationError';
    this.fieldErrors = fieldErrors;
  }
}

export class RateLimitError extends Error {
  readonly retryAfterSeconds: number;

  constructor(retryAfterSeconds: number) {
    super('Rate limit exceeded');
    this.name = 'RateLimitError';
    this.retryAfterSeconds = retryAfterSeconds;
  }
}
