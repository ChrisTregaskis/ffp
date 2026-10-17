import { isAssessed, type ScoreDimension, type MemberAssessmentScores } from '@ffp/core';

/** Age adjusts a member's level but is not something they are scored on */
const HIDDEN_DIMENSIONS: ReadonlySet<string> = new Set<ScoreDimension>(['age']);

export const visibleScoreDimensions = (
  scores: MemberAssessmentScores
): MemberAssessmentScores['dimensions'] =>
  scores.dimensions.filter(
    (dimension) => isAssessed(dimension) && !HIDDEN_DIMENSIONS.has(dimension.dimensionId)
  );
