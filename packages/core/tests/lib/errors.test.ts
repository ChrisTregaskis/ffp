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
} from '../../src/lib/errors';

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

  it('should have stack trace', () => {
    const error = new BaseError('Test error', 'TEST_ERROR', 418);

    expect(error.stack).toBeDefined();
    expect(error.stack).toContain('BaseError');
  });
});

describe('UnauthorisedError', () => {
  it('should create 401 error with default message', () => {
    const error = new UnauthorisedError();

    expect(error).toBeInstanceOf(BaseError);
    expect(error.message).toBe('Authentication failed');
    expect(error.code).toBe('UNAUTHORISED');
    expect(error.statusCode).toBe(401);
    expect(error.name).toBe('UnauthorisedError');
  });

  it('should create 401 error with custom message', () => {
    const error = new UnauthorisedError('Invalid JWT token');

    expect(error.message).toBe('Invalid JWT token');
    expect(error.code).toBe('UNAUTHORISED');
    expect(error.statusCode).toBe(401);
  });
});

describe('ForbiddenError', () => {
  it('should create 403 error with default message', () => {
    const error = new ForbiddenError();

    expect(error).toBeInstanceOf(BaseError);
    expect(error.message).toBe('Access denied');
    expect(error.code).toBe('FORBIDDEN');
    expect(error.statusCode).toBe(403);
    expect(error.name).toBe('ForbiddenError');
  });

  it('should create 403 error with custom message', () => {
    const error = new ForbiddenError('Insufficient permissions');

    expect(error.message).toBe('Insufficient permissions');
    expect(error.code).toBe('FORBIDDEN');
    expect(error.statusCode).toBe(403);
  });
});

describe('NotFoundError', () => {
  it('should create 404 error with resource only', () => {
    const error = new NotFoundError('User');

    expect(error).toBeInstanceOf(BaseError);
    expect(error.message).toBe('User not found');
    expect(error.code).toBe('NOT_FOUND');
    expect(error.statusCode).toBe(404);
    expect(error.name).toBe('NotFoundError');
  });

  it('should create 404 error with resource and id', () => {
    const error = new NotFoundError('User', 'user-123');

    expect(error.message).toBe('User with id user-123 not found');
    expect(error.code).toBe('NOT_FOUND');
    expect(error.statusCode).toBe(404);
  });
});

describe('ValidationError', () => {
  it('should create 400 error without details', () => {
    const error = new ValidationError('Invalid input');

    expect(error).toBeInstanceOf(BaseError);
    expect(error.message).toBe('Invalid input');
    expect(error.code).toBe('VALIDATION_ERROR');
    expect(error.statusCode).toBe(400);
    expect(error.details).toBeUndefined();
    expect(error.name).toBe('ValidationError');
  });

  it('should create 400 error with validation details', () => {
    const details = {
      email: 'Invalid email format',
      password: 'Password must be at least 8 characters',
    };
    const error = new ValidationError('Validation failed', details);

    expect(error.message).toBe('Validation failed');
    expect(error.code).toBe('VALIDATION_ERROR');
    expect(error.statusCode).toBe(400);
    expect(error.details).toEqual(details);
  });
});

describe('ConflictError', () => {
  it('should create 409 error without details', () => {
    const error = new ConflictError('Resource already exists');

    expect(error).toBeInstanceOf(BaseError);
    expect(error.message).toBe('Resource already exists');
    expect(error.code).toBe('CONFLICT');
    expect(error.statusCode).toBe(409);
    expect(error.details).toBeUndefined();
    expect(error.name).toBe('ConflictError');
  });

  it('should create 409 error with conflict details', () => {
    const details = { email: 'user@example.com' };
    const error = new ConflictError('User already exists', details);

    expect(error.message).toBe('User already exists');
    expect(error.code).toBe('CONFLICT');
    expect(error.statusCode).toBe(409);
    expect(error.details).toEqual(details);
  });
});

describe('InternalServerError', () => {
  it('should create 500 error with default message', () => {
    const error = new InternalServerError();

    expect(error).toBeInstanceOf(BaseError);
    expect(error.message).toBe('An unexpected error occurred');
    expect(error.code).toBe('INTERNAL_SERVER_ERROR');
    expect(error.statusCode).toBe(500);
    expect(error.name).toBe('InternalServerError');
  });

  it('should create 500 error with custom message', () => {
    const error = new InternalServerError('Database connection failed');

    expect(error.message).toBe('Database connection failed');
    expect(error.code).toBe('INTERNAL_SERVER_ERROR');
    expect(error.statusCode).toBe(500);
  });
});

describe('Error inheritance', () => {
  it('should allow instanceof checks for BaseError', () => {
    const errors = [
      new UnauthorisedError(),
      new ForbiddenError(),
      new NotFoundError('User'),
      new ValidationError('Invalid'),
      new ConflictError('Exists'),
      new InternalServerError(),
    ];

    errors.forEach((error) => {
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(BaseError);
    });
  });

  it('should allow instanceof checks for specific error types', () => {
    const error = new ValidationError('Invalid');

    expect(error instanceof ValidationError).toBe(true);
    expect(error instanceof BaseError).toBe(true);
    expect(error instanceof Error).toBe(true);
    expect(error instanceof UnauthorisedError).toBe(false);
  });
});
