import { DrizzleQueryError } from 'drizzle-orm';
import { DatabaseError } from 'pg';
import { expect } from 'vitest';

/** What a database error carries that must never reach a log line or a stored message. */
export const LEAKABLE = {
  query: 'insert into "users" ("email", "location_id") values ($1, $2)',
  param: 'sentinel-member@example.com',
  detail: 'Key (location_id)=(sentinel-location-0c1d) is not present in table "locations".',
} as const;

/** What Drizzle throws when Postgres refuses a statement: the `pg` error, SQLSTATE and all, on `cause`. */
export const drizzleDriverError = (fields: {
  code: string;
  constraint?: string;
  table?: string;
}): DrizzleQueryError => {
  const cause = new DatabaseError(
    'insert or update on table "users" violates a constraint',
    0,
    'error'
  );
  Object.assign(cause, fields, { detail: LEAKABLE.detail });

  return new DrizzleQueryError(LEAKABLE.query, [LEAKABLE.param, 'sentinel-location-0c1d'], cause);
};

/** What Drizzle throws when the connection drops mid-query: a cause with no SQLSTATE. */
export const drizzleConnectionError = (code?: string): DrizzleQueryError => {
  const cause = Object.assign(
    new Error('Connection terminated unexpectedly'),
    code ? { code } : {}
  );

  return new DrizzleQueryError(LEAKABLE.query, [LEAKABLE.param], cause);
};

/** Fail if serialised log output carries the failed SQL, a bound parameter or the driver's detail. */
export const expectNothingLeakable = (serialised: string): void => {
  expect(serialised).not.toContain('insert into');
  expect(serialised).not.toContain(LEAKABLE.param);
  expect(serialised).not.toContain('sentinel-location-0c1d');
  expect(serialised).not.toContain('is not present in table');
};
