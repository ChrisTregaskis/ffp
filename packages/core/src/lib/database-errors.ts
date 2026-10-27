import { BaseError, ConflictError } from './errors.js';

/** PostgreSQL SQLSTATE for a unique-constraint violation. */
const UNIQUE_VIOLATION = '23505';

/** PostgreSQL SQLSTATE for a foreign-key violation. */
const FOREIGN_KEY_VIOLATION = '23503';

/** SQLSTATE is five alphanumerics, a shape Node errno codes such as `EPIPE` share. */
const SQLSTATE_PATTERN = /^[0-9A-Z]{5}$/;

/** Drizzle wraps a driver error once; the cap stops a self-referential `cause` looping. */
const MAX_CAUSE_DEPTH = 5;

/** The fields of a `pg` `DatabaseError` this translation reads. */
export interface DriverError {
  code: string;
  severity: string;
  constraint?: string;
  table?: string;
}

/**
 * A `pg` error: a SQLSTATE plus the severity `pg` copies from every Postgres error
 * response. A Node errno error carries no severity. Read by shape rather than
 * `instanceof DatabaseError`, which a second copy of `pg` in a bundle would defeat.
 */
const isDriverError = (candidate: unknown): candidate is DriverError => {
  if (typeof candidate !== 'object' || candidate === null) {
    return false;
  }

  const { code, severity } = candidate as { code?: unknown; severity?: unknown };

  return typeof code === 'string' && SQLSTATE_PATTERN.test(code) && typeof severity === 'string';
};

/** Unwrap to the driver error underneath, or null if this is not one. */
export function findDriverError(error: unknown): DriverError | null {
  let candidate: unknown = error;

  for (let depth = 0; depth <= MAX_CAUSE_DEPTH; depth += 1) {
    if (isDriverError(candidate)) {
      return candidate;
    }

    if (!(candidate instanceof Error)) {
      return null;
    }

    candidate = candidate.cause;
  }

  return null;
}

/**
 * Whether a write was refused because another row still references what it
 * removes. Not mapped globally: only a caller that knows what holds the row can
 * say why it is in use.
 */
export function isForeignKeyViolation(error: unknown): boolean {
  return findDriverError(error)?.code === FOREIGN_KEY_VIOLATION;
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
  // it goes to the log (see `describeErrorForLog`) and not to the caller.
  return new ConflictError('This change conflicts with a record that already exists');
}

/**
 * The SQLSTATE, constraint and table of a driver error, or null for anything
 * else. A log site describes a caught error with `describeErrorForLog`, which
 * builds on this; never log a database error's `message` or `stack` directly.
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
