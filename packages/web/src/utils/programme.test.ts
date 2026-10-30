import { describe, expect, it } from 'vitest';

import { memberPhase } from '@web/components/programme/programme-test-fixture';
import { ApiError } from '@web/lib/api/client';

import {
  countDoneSessions,
  findNextSession,
  isProgrammeLoadFailure,
  isSessionDone,
} from './programme';

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

describe('the done rule', () => {
  it('counts completed and skipped sessions as done, and nothing else', () => {
    const phase = memberPhase(['completed', 'skipped', 'in_progress', 'not_started']);

    expect(phase.sessions.map(isSessionDone)).toEqual([true, true, false, false]);
    expect(countDoneSessions(phase.sessions)).toBe(2);
  });

  it('passes over skipped sessions when finding the next one', () => {
    const phase = memberPhase(['completed', 'skipped', 'not_started']);

    expect(findNextSession(phase)?.sessionNumber).toBe(3);
  });

  it('finds no next session once every session is done', () => {
    expect(findNextSession(memberPhase(['completed', 'skipped', 'completed']))).toBeUndefined();
  });
});
