import { BaseError, ConflictError } from './errors.js';

/** PostgreSQL SQLSTATE for a unique-constraint violation. */
const UNIQUE_VIOLATION = '23505';

/** SQLSTATE is five alphanumerics — enough to tell a driver error from `ECONNRESET`. */
const SQLSTATE_PATTERN = /^[0-9A-Z]{5}$/;

/** Drizzle wraps a driver error once; the cap stops a self-referential `cause` looping. */
const MAX_CAUSE_DEPTH = 5;

/** The fields of a `pg` `DatabaseError` this translation reads. */
export interface DriverError {
  code: string;
  constraint?: string;
  table?: string;
}

/** Unwrap to the driver error underneath, or null if this is not one. */
export function findDriverError(error: unknown): DriverError | null {
  let candidate: unknown = error;

  for (let depth = 0; depth <= MAX_CAUSE_DEPTH; depth += 1) {
    if (
      typeof candidate === 'object' &&
      candidate !== null &&
      'code' in candidate &&
      typeof (candidate as { code: unknown }).code === 'string' &&
      SQLSTATE_PATTERN.test((candidate as { code: string }).code)
    ) {
      return candidate as DriverError;
    }

    if (!(candidate instanceof Error)) {
      return null;
    }

    candidate = candidate.cause;
  }

  return null;
}

/**
 * Map a driver error onto an application error, leaving anything else as it was.
 *
 * Services guard uniqueness with a read before the write, so the ordinary path
 * raises a clean 409. A concurrent writer defeats that read and the collision
 * surfaces from the driver instead, which without this is an unexplained 500.
 */
export function translateDatabaseError(error: unknown): unknown {
  if (error instanceof BaseError) {
    return error;
  }

  const driverError = findDriverError(error);

  if (driverError?.code !== UNIQUE_VIOLATION) {
    return error;
  }

  // The constraint name is an internal schema detail and this path is global, so
  // it goes to the log (see `describeDriverError`) and not to the caller.
  return new ConflictError('This change conflicts with a record that already exists');
}

/**
 * Structured, loggable summary of a driver error. The driver's own `message`
 * carries the failed SQL and its bound parameters — member emails, free-text
 * answers — so it must never be logged. Returns null for anything else, and the
 * caller should still avoid `message` in that case.
 */
export function describeDriverError(
  error: unknown
): { sqlState: string; constraint?: string; table?: string } | null {
  const driverError = findDriverError(error);

  if (!driverError) {
    return null;
  }

  return {
    sqlState: driverError.code,
    constraint: driverError.constraint,
    table: driverError.table,
  };
}
