import { createEntityKeys } from './create-entity-keys';

/**
 * Query keys for the assessment flow admin surface.
 *
 * Kept separate from `assessmentKeys`, which covers the member-facing
 * assessment run — the two read different endpoints and invalidate apart.
 * `detail` is keyed on the flow's publicId, which is what the routes carry.
 */
export const assessmentFlowKeys = createEntityKeys('assessment-flows');
