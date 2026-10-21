import { describe, expect, it } from 'vitest';

import type { TemplatePhaseWithSessions } from '@ffp/core';

import {
  sessionToFormValues,
  toCreateSessionRequest,
  toUpdateSessionRequest,
} from './session-form-values';

const stored = (
  overrides: Partial<TemplatePhaseWithSessions['sessions'][number]> = {}
): TemplatePhaseWithSessions['sessions'][number] => ({
  id: '99999999-9999-9999-8999-999999990001',
  sessionNumber: 1,
  name: 'Morning Mobility',
  description: 'A gentle start to loosen the hips.',
  estimatedDurationMinutes: 20,
  exercises: [],
  ...overrides,
});

describe('toUpdateSessionRequest', () => {
  it('sends nothing when the form matches the stored session', () => {
    const session = stored();

    expect(toUpdateSessionRequest(sessionToFormValues(session), session)).toEqual({});
  });

  it('keeps the description when only the name changes', () => {
    const session = stored();

    expect(
      toUpdateSessionRequest({ ...sessionToFormValues(session), name: 'Evening Mobility' }, session)
    ).toEqual({ name: 'Evening Mobility' });
  });

  it('clears a blanked description and duration with null', () => {
    const session = stored();

    expect(
      toUpdateSessionRequest(
        { ...sessionToFormValues(session), description: '', estimatedDurationMinutes: '' },
        session
      )
    ).toEqual({ description: null, estimatedDurationMinutes: null });
  });
});

describe('toCreateSessionRequest', () => {
  it('stores blank fields as null', () => {
    expect(
      toCreateSessionRequest({ name: '', description: '', estimatedDurationMinutes: '' })
    ).toEqual({ name: null, description: null, estimatedDurationMinutes: null });
  });
});
