import { describe, expect, it } from 'vitest';

import { ApiError } from '@web/lib/api/client';

import { isProgrammeLoadFailure } from './programme';

describe('isProgrammeLoadFailure', () => {
  it('is not a failure without an error, or when the programme is not found', () => {
    expect(isProgrammeLoadFailure(null)).toBe(false);
    expect(
      isProgrammeLoadFailure(new ApiError(404, 'NOT_FOUND', 'Active programme not found'))
    ).toBe(false);
  });

  it('is a failure for any other error', () => {
    expect(isProgrammeLoadFailure(new ApiError(500, 'INTERNAL_ERROR', 'Something broke'))).toBe(
      true
    );
    expect(isProgrammeLoadFailure(ApiError.timeoutError())).toBe(true);
    expect(isProgrammeLoadFailure(new Error('Response failed validation'))).toBe(true);
  });
});
