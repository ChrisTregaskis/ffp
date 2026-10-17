import type { ScoringDryRunRequest } from '@ffp/core';

import { createEntityKeys } from './create-entity-keys';

const entityKeys = createEntityKeys('assessment-flows');

/**
 * Query keys for the assessment flow admin surface.
 *
 * Kept separate from `assessmentKeys`, which covers the member-facing
 * assessment run — the two read different endpoints and invalidate apart.
 * `detail` is keyed on the flow's publicId, which is what the routes carry.
 */
export const assessmentFlowKeys = {
  ...entityKeys,
  scoringDryRun: (publicId: string, answers: ScoringDryRunRequest['answers']) =>
    [...entityKeys.detail(publicId), 'scoring-dry-run', answers] as const,
};
