import { DrizzleQueryError } from 'drizzle-orm';
import { DatabaseError } from 'pg';
import { describe, it, expect } from 'vitest';

import { describeErrorForLog } from '../../src/lib/log-safe-error';

import {
  LEAKABLE,
  drizzleConnectionError,
  drizzleDriverError,
  expectNothingLeakable,
} from './database-error.fixture';

describe('describeErrorForLog', () => {
  it('describes a driver error under Drizzle by SQLSTATE, constraint and table only', () => {
    const description = describeErrorForLog(
      drizzleDriverError({
        code: '23503',
        constraint: 'users_location_id_locations_id_fk',
        table: 'users',
      })
    );

    expect(description).toEqual({
      error: 'Database driver error',
      errorClass: 'DrizzleQueryError',
      database: {
        sqlState: '23503',
        constraint: 'users_location_id_locations_id_fk',
        table: 'users',
      },
    });
    expectNothingLeakable(JSON.stringify(description));
  });

  it('describes a bare driver error the same way, without its detail', () => {
    const driverError = new DatabaseError('null value in column "email"', 0, 'error');
    Object.assign(driverError, { code: '23502', table: 'users', detail: LEAKABLE.detail });

    const description = describeErrorForLog(driverError);

    expect(description).toEqual({
      error: 'Database driver error',
      errorClass: 'DatabaseError',
      database: { sqlState: '23502', table: 'users' },
    });
    expectNothingLeakable(JSON.stringify(description));
  });

  it('describes a failed query whose connection reset by the cause class and code', () => {
    const description = describeErrorForLog(drizzleConnectionError('ECONNRESET'));

    expect(description).toEqual({
      error: 'Database query failed',
      errorClass: 'DrizzleQueryError',
      cause: { errorClass: 'Error', code: 'ECONNRESET' },
    });
    expectNothingLeakable(JSON.stringify(description));
  });

  it('describes a failed query whose connection terminated without a code', () => {
    const description = describeErrorForLog(drizzleConnectionError());

    expect(description).toEqual({
      error: 'Database query failed',
      errorClass: 'DrizzleQueryError',
      cause: { errorClass: 'Error' },
    });
    expectNothingLeakable(JSON.stringify(description));
  });

  it('describes a failed query with no cause without its query or parameters', () => {
    const description = describeErrorForLog(
      new DrizzleQueryError(LEAKABLE.query, [LEAKABLE.param])
    );

    expect(description).toEqual({
      error: 'Database query failed',
      errorClass: 'DrizzleQueryError',
    });
    expectNothingLeakable(JSON.stringify(description));
  });

  it('keeps the message and stack of any other error', () => {
    const error = new Error('Cognito refused the request');

    expect(describeErrorForLog(error)).toEqual({
      error: 'Cognito refused the request',
      errorClass: 'Error',
      stack: error.stack,
    });
  });

  it('logs a thrown non-error as unknown, without its value', () => {
    expect(describeErrorForLog(LEAKABLE.param)).toEqual({
      error: 'Unknown error',
      errorClass: 'string',
    });
  });
});
