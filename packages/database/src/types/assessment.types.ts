import { z } from 'zod';

/** Dimensional score result from assessment scoring */
export const dimensionalScoreSchema = z.object({
  /** Dimension identifier (e.g., 'mobility', 'strength', 'stability') */
  dimensionId: z.string(),
  /** Dimension display name */
  dimensionName: z.string(),
  /** Raw score value */
  rawScore: z.number(),
  /** Normalised score (0-100 scale) */
  normalisedScore: z.number(),
  /** Score category (e.g., 'low', 'moderate', 'high') */
  category: z.string().optional(),
});

/**
 * Contains calculated dimensional scores after scoring job completes.
 * Stored as JSONB in the user_assessments.scores column.
 */
export const userAssessmentScoresSchema = z.object({
  /** Array of dimensional scores */
  dimensions: z.array(dimensionalScoreSchema),
  /** Overall assessment score (if applicable) */
  overallScore: z.number().optional(),
  /** Risk level derived from scores */
  riskLevel: z.enum(['low', 'moderate', 'high']).optional(),
  /** Programme template slug recommended by scoring (for reassessment replacement) */
  recommendedTemplateSlug: z.string().optional(),
  /** Timestamp when scoring was completed */
  scoredAt: z.coerce.date(),
});

/** Single dimension score from assessment scoring */
export type DimensionalScore = z.infer<typeof dimensionalScoreSchema>;

/** Calculated assessment scores stored in user_assessments.scores JSONB column */
export type UserAssessmentScores = z.infer<typeof userAssessmentScoresSchema>;
