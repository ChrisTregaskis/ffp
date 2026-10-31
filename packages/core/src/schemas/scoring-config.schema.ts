import { z } from 'zod';

import type { EmphasisRule as StoredEmphasisRule } from '@ffp/database';
import { SCORING_MODES, TAG_CATEGORY_SLUGS } from '@ffp/database/constants';

import { scoreDimensionSchema } from './assessment-question.schema';

/**
 * Risk level enumeration - defines the risk classification for assessment results
 *
 * Used to categorise users based on their assessment scores:
 * - low: Low risk, suitable for standard programmes
 * - moderate: Moderate risk, may need modified programmes
 * - high: High risk, requires gentle programmes (Potentially supervised, but that falls outside scope of this APP)
 */
export const riskLevelSchema = z.enum(['low', 'moderate', 'high']);
export const comparisonOperatorSchema = z.enum(['lt', 'lte', 'gt', 'gte', 'eq']);
export const logicalOperatorSchema = z.enum(['and', 'or']);

export const scoringModeSchema = z.enum(SCORING_MODES);

/**
 * Defines a condition that compares a dimension score against a threshold
 * to determine programme eligibility.
 */
export const programmeMappingConditionSchema = z.object({
  /** The scoring dimension to evaluate */
  dimension: scoreDimensionSchema,
  /** Comparison operator */
  operator: comparisonOperatorSchema,
  /** Threshold value to compare against */
  value: z.number(),
});

/** A tag an answer leans towards, by category and slug so a mapping can name one not yet authored */
export const emphasisTagSchema = z.object({
  category: z.enum(TAG_CATEGORY_SLUGS),
  slug: z.string().min(1),
  /** Added to the weight of every candidate carrying the tag */
  weight: z.number().positive(),
});

/**
 * An answer that leans a programme's draw: when the member's answer to the question is (or, for a
 * multi-choice question, includes) the value, candidates carrying the tags weigh more. Only
 * single- and multi-choice questions can match, since the value is an option's string.
 */
export const emphasisRuleSchema = z.object({
  questionId: z.guid(),
  answerValue: z.string().min(1),
  tags: z.array(emphasisTagSchema).min(1),
});

/**
 * `@ffp/database` holds the stored `EmphasisRule` interface and cannot import this schema;
 * `satisfies` keeps a parsed rule assignable to it, so a field added to one goes in both.
 */
export const emphasisRulesSchema = z.array(emphasisRuleSchema) satisfies z.ZodType<
  StoredEmphasisRule[]
>;

export type RiskLevel = z.infer<typeof riskLevelSchema>;
export type ScoringMode = z.infer<typeof scoringModeSchema>;
export type ComparisonOperator = z.infer<typeof comparisonOperatorSchema>;
export type ProgrammeMappingCondition = z.infer<typeof programmeMappingConditionSchema>;
export type LogicalOperator = z.infer<typeof logicalOperatorSchema>;
export type EmphasisRule = z.infer<typeof emphasisRuleSchema>;
