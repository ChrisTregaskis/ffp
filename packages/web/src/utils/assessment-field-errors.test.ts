import { describe, expect, it } from 'vitest';

import { ApiError } from '@web/lib/api';

import { toRefusalMessage } from './assessment-field-errors';

const STEP_REFUSAL = 'This step is not part of the assessment.';

describe('toRefusalMessage', () => {
  it("gives a refusal's own message when it names no field", () => {
    const refusal = new ApiError(400, 'VALIDATION_ERROR', STEP_REFUSAL, { currentStep: 7 });

    expect(toRefusalMessage(refusal)).toBe(STEP_REFUSAL);
  });

  it("gives a conflict's own message", () => {
    const conflict = new ApiError(409, 'CONFLICT', 'This assessment has no steps to show yet');

    expect(toRefusalMessage(conflict)).toBe('This assessment has no steps to show yet');
  });

  it('gives nothing for a refusal naming fields, which shows on its questions', () => {
    const refusal = new ApiError(400, 'VALIDATION_ERROR', 'Some answers need your attention', [
      { path: 'answers.q1', message: 'Choose up to 2 options.', code: 'too_many_selections' },
    ]);

    expect(toRefusalMessage(refusal)).toBeNull();
  });

  it.each([
    [
      'a server failure',
      new ApiError(500, 'INTERNAL_SERVER_ERROR', 'An unexpected error occurred'),
    ],
    ['a missing assessment', new ApiError(404, 'NOT_FOUND', 'User assessment not found')],
    ['a dropped connection', ApiError.networkError(new Error('Failed to fetch'))],
    ['an error that is not from the API', new Error('Something broke')],
  ])('gives nothing for %s', (_case, error) => {
    expect(toRefusalMessage(error)).toBeNull();
  });
});
