import { closeSync } from 'fs';

import { DatabaseError } from 'pg';
import { describe, it, expect } from 'vitest';

import {
  describeDriverError,
  isForeignKeyViolation,
  translateDatabaseError,
} from '../../src/lib/database-errors';
import { ConflictError, NotFoundError } from '../../src/lib/errors';

/** A `pg` DatabaseError as the driver fills it: SQLSTATE on `code`, and always a `severity`. */
const driverError = (code: string, constraint?: string): Error =>
  Object.assign(new DatabaseError('duplicate key value violates unique constraint', 0, 'error'), {
    severity: 'ERROR',
    code,
    constraint,
  });

/** The error Node raises for a bad file descriptor, whose errno code `EBADF` is five capitals. */
const nodeErrnoError = (): Error => {
  try {
    closeSync(2 ** 30);
  } catch (error) {
    return error as Error;
  }

  throw new Error('Expected closing an unopened descriptor to fail');
};

/** Drizzle wraps the driver error, putting the failed SQL in the message. */
const wrapped = (cause: Error): Error =>
  Object.assign(new Error('Failed query: insert into "questions" ...'), { cause });

describe('translateDatabaseError', () => {
  it('maps a unique violation to a conflict', () => {
    const result = translateDatabaseError(driverError('23505', 'questions_slug_unique'));

    expect(result).toBeInstanceOf(ConflictError);
    expect((result as ConflictError).statusCode).toBe(409);
  });

  it('keeps the constraint name out of the response', () => {
    const result = translateDatabaseError(driverError('23505', 'users_email_unique'));

    // Naming the index tells a caller which column collided — on the user path
    // that confirms an address is already registered.
    expect((result as ConflictError).details).toBeUndefined();
    expect((result as ConflictError).message).not.toContain('users_email_unique');
  });

  it('maps a unique violation Drizzle has wrapped', () => {
    const result = translateDatabaseError(wrapped(driverError('23505', 'template_questions_pkey')));

    expect(result).toBeInstanceOf(ConflictError);
  });

  it('does not leak the driver message, which carries the query and its parameters', () => {
    const result = translateDatabaseError(wrapped(driverError('23505')));

    expect((result as ConflictError).message).not.toContain('insert into');
  });

  it('ignores a non-SQLSTATE code higher in the cause chain', () => {
    const connectionReset = Object.assign(new Error('socket hang up'), {
      code: 'ECONNRESET',
      cause: driverError('23505', 'questions_slug_unique'),
    });

    expect(translateDatabaseError(connectionReset)).toBeInstanceOf(ConflictError);
  });

  it('looks past a Node errno code shaped like a SQLSTATE to the driver error it wraps', () => {
    const brokenPipe = Object.assign(new Error('write EPIPE'), {
      code: 'EPIPE',
      cause: driverError('23505', 'questions_slug_unique'),
    });

    expect(translateDatabaseError(brokenPipe)).toBeInstanceOf(ConflictError);
  });
});

describe('isForeignKeyViolation', () => {
  it('recognises a foreign-key violation Drizzle has wrapped', () => {
    expect(isForeignKeyViolation(wrapped(driverError('23503')))).toBe(true);
  });

  it('is false for another SQLSTATE or an ordinary error', () => {
    expect(isForeignKeyViolation(wrapped(driverError('23505')))).toBe(false);
    expect(isForeignKeyViolation(new Error('something else'))).toBe(false);
  });
});

describe('describeDriverError', () => {
  it('summarises a driver error for the log', () => {
    expect(describeDriverError(wrapped(driverError('23505', 'questions_slug_unique')))).toEqual({
      sqlState: '23505',
      constraint: 'questions_slug_unique',
      table: undefined,
    });
  });

  it('returns null for anything that is not a driver error', () => {
    expect(describeDriverError(new Error('something else'))).toBeNull();
  });

  it('returns null for a Node errno error whose code is five capitals, as a SQLSTATE is', () => {
    const errnoError = nodeErrnoError();

    expect(errnoError).toMatchObject({ code: 'EBADF' });
    expect(describeDriverError(errnoError)).toBeNull();
    expect(describeDriverError(wrapped(errnoError))).toBeNull();
  });

  it('leaves another SQLSTATE alone', () => {
    const original = driverError('23503', 'questions_video_id_fkey');

    expect(translateDatabaseError(original)).toBe(original);
  });

  it('leaves application errors alone', () => {
    const original = new NotFoundError('Question', 'quesABCDE123');

    expect(translateDatabaseError(original)).toBe(original);
  });

  it('leaves an ordinary error alone', () => {
    const original = new Error('something else went wrong');

    expect(translateDatabaseError(original)).toBe(original);
  });

  it('survives a self-referential cause chain', () => {
    const looping = new Error('loop');
    looping.cause = looping;

    expect(translateDatabaseError(looping)).toBe(looping);
  });
});
