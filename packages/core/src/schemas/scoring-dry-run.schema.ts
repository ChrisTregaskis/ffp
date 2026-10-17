import { z } from 'zod';

import { answerValueSchema } from '@ffp/database/types';

import {
  questionOptionSchema,
  questionTypeSchema,
  scoreDimensionSchema,
} from './assessment-question.schema';
import { dimensionalScoreSchema } from './job.schema';
import { publicIdSchema } from './public-id.schema';
import {
  logicalOperatorSchema,
  programmeMappingConditionSchema,
  riskLevelSchema,
  scoringModeSchema,
} from './scoring-config.schema';

export const scoringDryRunRequestSchema = z.object({
  answers: z
    .array(z.object({ questionPublicId: publicIdSchema, answerValue: answerValueSchema }))
    .max(100, 'At most 100 answers can be scored in one request'),
});

export const NOT_SCORABLE_REASONS = ['no-config', 'no-dimensions'] as const;

export const scoringDryRunQuestionSchema = z.object({
  publicId: publicIdSchema,
  slug: z.string(),
  type: questionTypeSchema,
  questionText: z.string(),
  options: z.array(questionOptionSchema).nullable(),
});

export const scoringDryRunDimensionSchema = z.object({
  name: scoreDimensionSchema,
  displayName: z.string(),
  scoringMode: scoringModeSchema,
  maxScore: z.number(),
  affectsRiskLevel: z.boolean(),
  questions: z.array(scoringDryRunQuestionSchema),
  /** Configured questions absent from the flow's templates, or inactive */
  unresolvedQuestionCount: z.number().int().nonnegative(),
});

export const scoringDryRunMappingSchema = z.object({
  index: z.number().int().nonnegative(),
  priority: z.number().int().optional(),
  operator: logicalOperatorSchema,
  conditions: z.array(programmeMappingConditionSchema),
  programmeSlug: z.string(),
  programmeName: z.string().nullable(),
  /** Null when no programme template carries the slug */
  programmeActive: z.boolean().nullable(),
  level: z.number().int().nullable(),
});

export const scoringDryRunResultSchema = z.discriminatedUnion('scorable', [
  z.object({ scorable: z.literal(false), reason: z.enum(NOT_SCORABLE_REASONS) }),
  z.object({
    scorable: z.literal(true),
    dimensions: z.array(scoringDryRunDimensionSchema),
    mappings: z.array(scoringDryRunMappingSchema),
    result: z.object({
      scores: z.array(dimensionalScoreSchema),
      overallScore: z.number(),
      riskLevel: riskLevelSchema.optional(),
      recommendedProgrammeSlug: z.string().nullable(),
      matchedMappingIndex: z.number().int().nonnegative().nullable(),
    }),
  }),
]);

export type ScoringDryRunRequest = z.infer<typeof scoringDryRunRequestSchema>;
export type NotScorableReason = (typeof NOT_SCORABLE_REASONS)[number];
export type ScoringDryRunQuestion = z.infer<typeof scoringDryRunQuestionSchema>;
export type ScoringDryRunDimension = z.infer<typeof scoringDryRunDimensionSchema>;
export type ScoringDryRunMapping = z.infer<typeof scoringDryRunMappingSchema>;
export type ScoringDryRunResult = z.infer<typeof scoringDryRunResultSchema>;
export type ScorableDryRunResult = Extract<ScoringDryRunResult, { scorable: true }>;
