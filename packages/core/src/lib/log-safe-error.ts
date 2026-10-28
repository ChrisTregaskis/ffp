import { DrizzleQueryError } from 'drizzle-orm';

import { describeDriverError } from './database-errors.js';

import type { LogContext } from './logger.js';

/** What a log line or a stored message may say about a caught error. */
export interface LogSafeError extends LogContext {
  /** The error's message, or a fixed summary where the message would carry SQL. */
  error: string;
  errorClass: string;
  stack?: string;
  database?: { sqlState: string; constraint?: string; table?: string };
  cause?: { errorClass: string; code?: string };
}

const describeCause = (cause: unknown): LogSafeError['cause'] => {
  if (!(cause instanceof Error)) {
    return undefined;
  }

  const code = (cause as { code?: unknown }).code;

  return {
    errorClass: cause.constructor.name,
    ...(typeof code === 'string' && { code }),
  };
};

/**
 * Describe a caught error for a log line or a stored message.
 *
 * A Drizzle query error's message, and so its stack, is the failed SQL and its
 * bound parameters (member emails, free-text answers), and the driver's `detail`
 * repeats the offending values. A database error is therefore described by
 * SQLSTATE, constraint and table, or by the cause's class and code when the
 * driver gave no SQLSTATE. A syntax error's message is withheld; anything else keeps
 * its message and stack.
 */
export function describeErrorForLog(error: unknown): LogSafeError {
  const errorClass = error instanceof Error ? error.constructor.name : typeof error;
  const database = describeDriverError(error);

  if (database) {
    return { error: 'Database driver error', errorClass, database };
  }

  if (!(error instanceof Error)) {
    return { error: 'Unknown error', errorClass };
  }

  if (error instanceof DrizzleQueryError) {
    const cause = describeCause(error.cause);

    return { error: 'Database query failed', errorClass, ...(cause && { cause }) };
  }

  // A JSON.parse failure quotes the text it failed on, which is the request body
  if (error instanceof SyntaxError) {
    const withheld = 'Syntax error (message withheld: it quotes the input)';

    return { error: withheld, errorClass, stack: error.stack?.replace(error.message, withheld) };
  }

  return { error: error.message, errorClass, stack: error.stack };
}

/** A value's shape for a log line (its type, and an object's keys or an array's length), never the value. */
export function describeShapeForLog(value: unknown): Record<string, unknown> {
  if (Array.isArray(value)) {
    return { type: 'array', length: value.length };
  }

  if (typeof value === 'object' && value !== null) {
    return { type: 'object', keys: Object.keys(value) };
  }

  return { type: value === null ? 'null' : typeof value };
}
