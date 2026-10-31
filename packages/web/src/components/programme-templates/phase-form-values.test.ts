import { describe, expect, it } from 'vitest';

import { phaseToFormValues, toUpdatePhaseRequest } from './phase-form-values';

const STORED = { name: 'Foundation', description: 'Building the basics.' };

describe('toUpdatePhaseRequest', () => {
  it('sends nothing when the form matches the stored phase', () => {
    expect(toUpdatePhaseRequest(phaseToFormValues(STORED), STORED)).toEqual({});
  });

  it('sends an edited name and description', () => {
    expect(
      toUpdatePhaseRequest({ name: 'Groundwork', description: 'Settling in.' }, STORED)
    ).toEqual({ name: 'Groundwork', description: 'Settling in.' });
  });

  it('clears a blanked description with null', () => {
    expect(toUpdatePhaseRequest({ ...phaseToFormValues(STORED), description: '' }, STORED)).toEqual(
      { description: null }
    );
  });
});
