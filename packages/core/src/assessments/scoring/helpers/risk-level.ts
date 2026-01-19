import { LOW_RISK_THRESHOLD, MODERATE_RISK_THRESHOLD } from '../../../constants';
import { ValidationError } from '../../../lib/errors';

import type { DimensionalScore } from '../../../schemas/job.schema';
import type { RiskLevel } from '../../../types';

/**
 * Calculate risk level from dimensional scores
 *
 * Risk level is determined by the LOWEST dimension score:
 * - Low risk: All dimensions >= LOW_RISK_THRESHOLD %
 * - Moderate risk: Lowest dimension >= MODERATE_RISK_THRESHOLD % and < LOW_RISK_THRESHOLD %
 * - High risk: Any dimension < MODERATE_RISK_THRESHOLD %
 *
 * This conservative approach ensures intervention recommendations
 * are triggered when any dimension shows concern.
 *
 * @param dimensionalScores - Array of calculated dimension scores
 * @returns Risk level ('low', 'moderate', or 'high')
 * @throws ValidationError if no dimensional scores provided (indicates config issue)
 */
export function calculateRiskLevel(dimensionalScores: DimensionalScore[]): RiskLevel {
  if (dimensionalScores.length === 0) {
    throw new ValidationError(
      'Cannot calculate risk level: no dimensional scores provided. Check scoring configuration.'
    );
  }

  // Find the lowest normalised score
  const lowestScore = Math.min(...dimensionalScores.map((s) => s.normalisedScore));

  // Apply thresholds
  if (lowestScore >= LOW_RISK_THRESHOLD) {
    return 'low';
  }

  if (lowestScore >= MODERATE_RISK_THRESHOLD) {
    return 'moderate';
  }

  return 'high';
}

/**
 * Get category string from normalised score and thresholds
 *
 * @param normalisedScore - Score on 0-100 scale
 * @param thresholds - Optional custom thresholds (defaults to standard risk thresholds)
 * @returns Category string ('low', 'moderate', or 'high')
 */
export function getCategoryFromScore(
  normalisedScore: number,
  thresholds?: { low: number; moderate: number }
): RiskLevel {
  const lowThreshold = thresholds?.low ?? LOW_RISK_THRESHOLD;
  const moderateThreshold = thresholds?.moderate ?? MODERATE_RISK_THRESHOLD;

  if (normalisedScore >= lowThreshold) {
    return 'low';
  }

  if (normalisedScore >= moderateThreshold) {
    return 'moderate';
  }

  return 'high';
}
