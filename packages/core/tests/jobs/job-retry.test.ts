import { describe, expect, it } from 'vitest';

import { isRetryableError } from '../../src/jobs/job-processor.service';
import {
  ConflictError,
  InternalServerError,
  NotFoundError,
  ProgrammeAssemblyError,
  ValidationError,
} from '../../src/lib/errors';

describe('isRetryableError', () => {
  it('retries an unexpected error', () => {
    expect(isRetryableError(new Error('connection reset'))).toBe(true);
  });

  it('retries a server error', () => {
    expect(isRetryableError(new InternalServerError())).toBe(true);
  });

  it('retries a conflict, which a concurrent write can clear', () => {
    expect(isRetryableError(new ConflictError('Already exists'))).toBe(true);
  });

  it.each([
    ['an unfillable programme', new ProgrammeAssemblyError()],
    ['a missing template', new NotFoundError('Programme template', 'level-9')],
    ['an inactive template', new ValidationError('Template is inactive')],
  ])('does not retry %s', (_, error) => {
    expect(isRetryableError(error)).toBe(false);
  });
});
