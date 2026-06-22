/**
 * Throwaway UX-prototype types for the assessment-admin authoring surface.
 *
 * These mirror the real catalogue shapes (see packages/core/src/assessments/CLAUDE.md
 * and packages/database/src/types) but are defined locally so the prototype stays
 * self-contained: no @ffp/core / @ffp/database imports, no network, no DB.
 *
 * NOTE: disposable. The real admin UI is built properly in Track 3.
 */

export const QUESTION_TYPES = [
  'single-choice',
  'multi-choice',
  'numeric',
  'text',
  'scale',
  'video-response',
] as const;
export type QuestionType = (typeof QUESTION_TYPES)[number];

export const SCORE_DIMENSIONS = ['strength', 'balance', 'mobility', 'pain', 'general'] as const;
export type ScoreDimension = (typeof SCORE_DIMENSIONS)[number];

export const FLOW_STEP_TYPES = [
  'intro',
  'questions',
  'transition',
  'video-assessment',
  'results',
  'programme-overview',
] as const;
export type FlowStepType = (typeof FLOW_STEP_TYPES)[number];

export type ComparisonOperator = 'lt' | 'lte' | 'gt' | 'gte' | 'eq';

export interface QuestionOption {
  value: string;
  label: string;
  score?: number;
}

export interface QuestionValidation {
  required?: boolean;
  min?: number;
  max?: number;
  pattern?: string;
  customError?: string;
}

export interface PrototypeQuestion {
  id: string;
  publicId: string;
  slug: string;
  type: QuestionType;
  questionText: string;
  description?: string;
  options?: QuestionOption[];
  validation?: QuestionValidation;
  scoreDimension?: ScoreDimension | null;
  isActive: boolean;
}

export interface PrototypeStepConfig {
  title: string;
  description?: string;
  estimatedMinutes?: number;
}

export interface PrototypeStep {
  id: string;
  order: number;
  type: FlowStepType;
  /** Linked template (questions / video-assessment steps) */
  templateId?: string;
  config: PrototypeStepConfig;
  /** Count of seeded branching rules — surfaced read-only in v1 */
  ruleCount: number;
}

export interface RiskThresholds {
  low: number;
  moderate: number;
}

export interface DimensionConfig {
  name: ScoreDimension;
  questionIds: string[];
  maxScore: number;
  weight?: number;
  riskThresholds?: RiskThresholds;
}

export interface ProgrammeMappingCondition {
  dimension: ScoreDimension;
  operator: ComparisonOperator;
  value: number;
}

export interface ProgrammeMapping {
  conditions: ProgrammeMappingCondition[];
  operator?: 'and' | 'or';
  /** Slug or id of the recommended programme template */
  programmeTemplateId: string;
  priority?: number;
}

export interface ScoringConfig {
  dimensions: DimensionConfig[];
  programmeMappings: ProgrammeMapping[];
}

export interface PrototypeFlow {
  id: string;
  publicId: string;
  name: string;
  description: string;
  isActive: boolean;
  steps: PrototypeStep[];
  scoringConfig: ScoringConfig;
}

export interface PrototypeTemplate {
  id: string;
  publicId: string;
  name: string;
  /** Ordered question assignment (template_questions.display_order) */
  questionIds: string[];
}

export interface ProgrammeTemplateOption {
  /** Slug used by scoring_config.programmeMappings (seed data uses slugs) */
  slug: string;
  name: string;
}

/** In-app navigation target (internal mini-router — keeps the prototype to one route) */
export type PrototypeView =
  | { name: 'flows' }
  // flowId/questionId may be the 'new' sentinel for create flows
  | { name: 'flow-meta'; flowId: string }
  | { name: 'flow-builder'; flowId: string }
  // stepId may be the 'new' sentinel for adding a step
  | { name: 'step-edit'; flowId: string; stepId: string }
  | { name: 'questions' }
  | { name: 'question-edit'; questionId: string }
  | { name: 'templates' }
  | { name: 'template-edit'; templateId: string }
  | { name: 'scoring'; flowId: string };
