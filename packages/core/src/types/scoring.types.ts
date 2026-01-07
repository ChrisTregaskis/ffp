/**
 * Scoring-related types
 *
 * Types used by the assessment scoring service.
 *
 * @module types/scoring
 */

import type { DimensionalScore } from '../schemas/job.schema';

/**
 * Risk level thresholds for categorising dimension scores
 *
 * Based on normalised percentage scores (0-100):
 * - Low risk: >= 70% (good capacity)
 * - Moderate risk: >= 40% and < 70% (needs attention)
 * - High risk: < 40% (requires intervention)
 */
export type RiskLevel = 'low' | 'moderate' | 'high';

/**
 * Extended scoring result with risk level and programme recommendation
 *
 * This is the internal result type that includes additional data
 * beyond what the job result schema requires.
 */
export interface ScoringResult {
  /** Dimensional scores */
  scores: DimensionalScore[];
  /** Overall assessment score (weighted average of dimensions) */
  overallScore: number;
  /** Risk level based on lowest dimension score */
  riskLevel: RiskLevel;
  /** Recommended programme template ID, or null if no matching rule */
  recommendedProgrammeId: string | null;
  /** Timestamp when scoring completed */
  scoredAt: string;
}
