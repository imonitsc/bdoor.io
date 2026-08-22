import { redact } from '@/lib/audit/redact';

type Level = 'debug' | 'info' | 'warn' | 'error';

const LEVEL_ORDER: Record<Level, number> = { debug: 10, info: 20, warn: 30, error: 40 };
const MIN_LEVEL: Level = process.env.NODE_ENV === 'production' ? 'info' : 'debug';

/**
 * Structured logger. Every payload passes through the same redaction the audit
 * service uses, so a stray `{ password }` in a log call cannot leak.
 */
function emit(level: Level, event: string, data?: Record<string, unknown>) {
  if (LEVEL_ORDER[level] < LEVEL_ORDER[MIN_LEVEL]) return;

  const line = {
    level,
    event,
    time: new Date().toISOString(),
    ...(data ? (redact(data) as Record<string, unknown>) : {}),
  };

  const serialized = JSON.stringify(line);
  if (level === 'error') console.error(serialized);
  else if (level === 'warn') console.warn(serialized);
  else console.warn(serialized);
}

export const logger = {
  debug: (event: string, data?: Record<string, unknown>) => emit('debug', event, data),
  info: (event: string, data?: Record<string, unknown>) => emit('info', event, data),
  warn: (event: string, data?: Record<string, unknown>) => emit('warn', event, data),
  error: (event: string, data?: Record<string, unknown>) => emit('error', event, data),
};
