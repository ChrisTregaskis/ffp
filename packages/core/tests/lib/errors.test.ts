/**
 * Unit tests for error classes
 *
 * Tests the custom error hierarchy to ensure:
 * - Correct HTTP status codes
 * - Correct error codes
 * - Proper inheritance from BaseError
 * - Error messages are formatted correctly
 */

import { describe, it, expect } from 'vitest';

import {
  BaseError,
  UnauthorisedError,
  ForbiddenError,
  NotFoundError,
  ValidationError,
  ConflictError,
  InternalServerError,
  JobProcessorError,
  ProgrammeAssemblyError,
} from '../../src/lib/errors';

import { drizzleDriverError, expectNothingLeakable } from './database-error.fixture';

describe('BaseError', () => {
  it('should create error with all properties', () => {
    const error = new BaseError('Test error', 'TEST_ERROR', 418, { foo: 'bar' });

    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(BaseError);
    expect(error.message).toBe('Test error');
    expect(error.code).toBe('TEST_ERROR');
    expect(error.statusCode).toBe(418);
    expect(error.details).toEqual({ foo: 'bar' });
    expect(error.name).toBe('BaseError');
  });

  it('should create error without optional details', () => {
    const error = new BaseError('Test error', 'TEST_ERROR', 418);

    expect(error.details).toBeUndefined();
  });
});

describe('HTTP error classes', () => {
  const validationDetails = {
    email: 'Invalid email format',
    password: 'Password must be at least 8 characters',
  };
  const conflictDetails = { email: 'user@example.com' };

  it.each([
    [
      'UnauthorisedError, default message',
      () => new UnauthorisedError(),
      UnauthorisedError,
      'UnauthorisedError',
      401,
      'UNAUTHORISED',
      'Authentication failed',
      undefined,
    ],
    [
      'UnauthorisedError, custom message',
      () => new UnauthorisedError('Invalid JWT token'),
      UnauthorisedError,
      'UnauthorisedError',
      401,
      'UNAUTHORISED',
      'Invalid JWT token',
      undefined,
    ],
    [
      'ForbiddenError, default message',
      () => new ForbiddenError(),
      ForbiddenError,
      'ForbiddenError',
      403,
      'FORBIDDEN',
      'Access denied',
      undefined,
    ],
    [
      'ForbiddenError, custom message',
      () => new ForbiddenError('Insufficient permissions'),
      ForbiddenError,
      'ForbiddenError',
      403,
      'FORBIDDEN',
      'Insufficient permissions',
      undefined,
    ],
    [
      'NotFoundError, resource only',
      () => new NotFoundError('User'),
      NotFoundError,
      'NotFoundError',
      404,
      'NOT_FOUND',
      'User not found',
      undefined,
    ],
    [
      'NotFoundError, resource and id',
      () => new NotFoundError('User', 'user-123'),
      NotFoundError,
      'NotFoundError',
      404,
      'NOT_FOUND',
      'User with id user-123 not found',
      undefined,
    ],
    [
      'ValidationError, no details',
      () => new ValidationError('Invalid input'),
      ValidationError,
      'ValidationError',
      400,
      'VALIDATION_ERROR',
      'Invalid input',
      undefined,
    ],
    [
      'ValidationError, field details',
      () => new ValidationError('Validation failed', validationDetails),
      ValidationError,
      'ValidationError',
      400,
      'VALIDATION_ERROR',
      'Validation failed',
      validationDetails,
    ],
    [
      'ConflictError, no details',
      () => new ConflictError('Resource already exists'),
      ConflictError,
      'ConflictError',
      409,
      'CONFLICT',
      'Resource already exists',
      undefined,
    ],
    [
      'ConflictError, conflict details',
      () => new ConflictError('User already exists', conflictDetails),
      ConflictError,
      'ConflictError',
      409,
      'CONFLICT',
      'User already exists',
      conflictDetails,
    ],
    [
      'InternalServerError, default message',
      () => new InternalServerError(),
      InternalServerError,
      'InternalServerError',
      500,
      'INTERNAL_SERVER_ERROR',
      'An unexpected error occurred',
      undefined,
    ],
    [
      'InternalServerError, custom message',
      () => new InternalServerError('Database connection failed'),
      InternalServerError,
      'InternalServerError',
      500,
      'INTERNAL_SERVER_ERROR',
      'Database connection failed',
      undefined,
    ],
  ] as const)('%s', (_title, create, Class, name, statusCode, code, message, details) => {
    const error = create();

    expect(error).toBeInstanceOf(BaseError);
    expect(error).toBeInstanceOf(Class);
    expect({
      name: error.name,
      statusCode: error.statusCode,
      code: error.code,
      message: error.message,
      details: error.details,
    }).toStrictEqual({ name, statusCode, code, message, details });
  });
});

describe('JobProcessorError', () => {
  it('keeps a database cause on the instance but out of details, which a response returns', () => {
    const cause = drizzleDriverError({
      code: '23503',
      constraint: 'users_location_id_locations_id_fk',
    });
    const error = new JobProcessorError('Failed to poll and claim jobs', cause);

    expect(error.cause).toBe(cause);
    expect(error.statusCode).toBe(500);
    expect(error.details).toBeUndefined();
    expectNothingLeakable(JSON.stringify({ message: error.message, details: error.details }));
  });
});

describe('ProgrammeAssemblyError', () => {
  it('answers 422 with a member-facing message and no details', () => {
    const error = new ProgrammeAssemblyError();

    expect(error).toBeInstanceOf(BaseError);
    expect(error.statusCode).toBe(422);
    expect(error.code).toBe('PROGRAMME_ASSEMBLY_FAILED');
    expect(error.message).toBe("We couldn't put your programme together just now.");
    expect(error.details).toBeUndefined();
  });
});
