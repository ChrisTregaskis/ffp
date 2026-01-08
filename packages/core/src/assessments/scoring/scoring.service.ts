import type { QuestionWithConfig, ScoringConfig } from '@ffp/database';

import {
  buildQuestionMap,
  buildResponseMap,
  calculateDimensionScore,
  calculateOverallScore,
  calculateRiskLevel,
  findMatchingProgramme,
} from './helpers';

import type { AssessmentResponse, ScoreAssessmentResult } from '../../schemas/job.schema';
import type { ScoringResult } from '../../types';

/**
 * Calculate assessment scores from responses
 *
 * @example
 * ```typescript
 * const result = calculateScores(
 *   [{ questionId: 'q1', answerValue: 'high' }],
 *   questionsFromTemplate,
 *   template.scoringConfig
 * );
 * // result.scores = [{ dimensionId: 'strength', rawScore: 3, normalisedScore: 75, ... }]
 * // result.riskLevel = 'low'
 * ```
 */
export function calculateScores(
  responses: AssessmentResponse[],
  questions: QuestionWithConfig[],
  scoringConfig: ScoringConfig
): ScoringResult {
  // Build lookup map for efficient question access
  const questionMap = buildQuestionMap(questions);

  // Build response map for efficient answer lookup
  const responseMap = buildResponseMap(responses);

  // Calculate scores for each dimension
  const dimensionalScores = scoringConfig.dimensions.map((dimensionConfig) =>
    calculateDimensionScore(dimensionConfig, responseMap, questionMap)
  );

  // Calculate overall score (weighted average of normalised scores)
  const overallScore = calculateOverallScore(dimensionalScores, scoringConfig.dimensions);

  // Determine risk level from lowest dimension score
  const riskLevel = calculateRiskLevel(dimensionalScores);

  // Find matching programme recommendation
  const recommendedProgrammeId = findMatchingProgramme(
    dimensionalScores,
    scoringConfig.programMappings
  );

  return {
    scores: dimensionalScores,
    overallScore,
    riskLevel,
    recommendedProgrammeId,
    scoredAt: new Date().toISOString(),
  };
}

/**
 * Convert scoring result to job result format
 *
 * The job result schema has a simpler structure than the internal
 * scoring result. This function extracts the required fields.
 *
 * @param scoringResult - Internal scoring result
 * @returns Job result format for storage
 */
export function toJobResult(scoringResult: ScoringResult): ScoreAssessmentResult {
  return {
    scores: scoringResult.scores,
    overallScore: scoringResult.overallScore,
    scoredAt: scoringResult.scoredAt,
  };
}
