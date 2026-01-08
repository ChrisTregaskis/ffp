import type { QuestionWithConfig, DimensionConfig } from '@ffp/database';

import { calculateQuestionScore } from './question-scoring';
import { getCategoryFromScore } from './risk-level';

import type { AssessmentResponse, DimensionalScore } from '../../../schemas/job.schema';

/**
 * Question lookup map for efficient access during scoring
 */
export type QuestionMap = Map<string, QuestionWithConfig>;

/**
 * Build a lookup map from question array
 *
 * Enables O(1) access to questions by ID during scoring.
 * Uses Map for optimal key-value lookups with string keys.
 *
 * @example
 * ```typescript
 * const questions = [
 *   { id: 'q1-uuid', slug: 'pain-level', type: 'scale', ... },
 *   { id: 'q2-uuid', slug: 'mobility', type: 'single-choice', ... }
 * ];
 * const questionMap = buildQuestionMap(questions);
 * // Map { 'q1-uuid' => { id: 'q1-uuid', ... }, 'q2-uuid' => { id: 'q2-uuid', ... } }
 * const question = questionMap.get('q1-uuid'); // O(1) lookup
 * ```
 */
export function buildQuestionMap(questions: QuestionWithConfig[]): QuestionMap {
  const map = new Map<string, QuestionWithConfig>();

  for (const question of questions) {
    map.set(question.id, question);
  }

  return map;
}

/**
 * Build a lookup map from responses array
 *
 * Enables O(1) access to responses by question ID.
 */
export function buildResponseMap(responses: AssessmentResponse[]): Map<string, AssessmentResponse> {
  const map = new Map<string, AssessmentResponse>();

  for (const response of responses) {
    map.set(response.questionId, response);
  }

  return map;
}

/**
 * Calculate score for a single dimension
 *
 * Aggregates scores from all questions that contribute to this dimension.
 *
 * @param dimensionConfig - Configuration for the dimension being scored
 * @param responseMap - Map of responses keyed by question ID
 * @param questionMap - Map of questions keyed by ID
 * @returns Dimensional score with raw and normalised values
 */
export function calculateDimensionScore(
  dimensionConfig: DimensionConfig,
  responseMap: Map<string, AssessmentResponse>,
  questionMap: QuestionMap
): DimensionalScore {
  let rawScore = 0;

  // Sum scores from all questions in this dimension
  for (const questionId of dimensionConfig.questionIds) {
    const response = responseMap.get(questionId);
    const question = questionMap.get(questionId);

    if (response && question) {
      rawScore += calculateQuestionScore(question, response.answerValue);
    }
  }

  // Normalise to 0-100 scale
  const normalisedScore =
    dimensionConfig.maxScore > 0 ? Math.round((rawScore / dimensionConfig.maxScore) * 100) : 0;

  // Determine category based on normalised score
  const category = getCategoryFromScore(normalisedScore, dimensionConfig.riskThresholds);

  return {
    dimensionId: dimensionConfig.name,
    dimensionName: formatDimensionName(dimensionConfig.name),
    rawScore,
    normalisedScore,
    category,
  };
}

/**
 * Calculate overall score from dimensional scores
 *
 * Uses weighted average if weights are defined, otherwise simple average.
 *
 * @param dimensionalScores - Array of calculated dimension scores
 * @param dimensionConfigs - Dimension configurations with optional weights
 * @returns Overall score as weighted average (0-100)
 */
export function calculateOverallScore(
  dimensionalScores: DimensionalScore[],
  dimensionConfigs: DimensionConfig[]
): number {
  if (dimensionalScores.length === 0) {
    return 0;
  }

  // Build weight map for lookup
  const weightMap = new Map<string, number>();

  for (const config of dimensionConfigs) {
    weightMap.set(config.name, config.weight ?? 1);
  }

  let weightedSum = 0;
  let totalWeight = 0;

  for (const score of dimensionalScores) {
    const weight = weightMap.get(score.dimensionId) ?? 1;
    weightedSum += score.normalisedScore * weight;
    totalWeight += weight;
  }

  return totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 0;
}

/**
 * Format dimension name for display
 *
 * Converts dimension IDs to human-readable names.
 *
 * @param dimensionId - Dimension identifier (e.g., 'strength', 'balance')
 * @returns Formatted display name (e.g., 'Strength', 'Balance')
 */
export function formatDimensionName(dimensionId: string): string {
  // Capitalise first letter
  return dimensionId.charAt(0).toUpperCase() + dimensionId.slice(1);
}
