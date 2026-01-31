import { Pool } from 'pg';
import { eq } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../src/schema/index.js';
import { assessmentFlows } from '../src/schema/index.js';
import { createLogger } from '../src/lib/logger.js';
import { QUESTION_IDS } from './seedQuestions.js';

import type { ScoringConfig } from '../src/types/question.types.js';

const logger = createLogger('seed-assessment-flows');

/**
 * Deterministic UUID for the default assessment flow
 *
 * UUID Pattern: 44444444-4444-4444-4444-4444444400XX
 * - Default flow: 01
 *
 * This ensures consistency across seed runs and allows Postman/tests
 * to reference the flow reliably.
 */
export const FLOW_IDS = {
  DEFAULT: '44444444-4444-4444-4444-444444440001',
} as const;

/**
 * Default flow name - used for idempotency check
 */
const DEFAULT_FLOW_NAME = 'Standard Physiotherapy Assessment';

/**
 * Combined scoring configuration for all dimensions in the flow.
 *
 * This consolidates scoring from all templates into a single configuration
 * that produces one holistic programme recommendation.
 *
 * Dimensions:
 * - pain: From pre-assessment (pain-level, pain-location) + back pain questions + red flag screening
 * - general: From pre-assessment questions (goal-primary, activity-level, medical-conditions)
 * - strength: From strength assessment (squat-rating, pushup-count, strength-comfort)
 * - balance: From balance assessment (single-leg-duration, tandem-stability, balance-confidence)
 *
 * Note: Red flag screening questions are included in pain dimension but with high scores (10)
 * to ensure any red flag triggers high pain score and gentle programme recommendation.
 */
const FLOW_SCORING_CONFIG: ScoringConfig = {
  dimensions: [
    {
      name: 'pain',
      weight: 1,
      maxScore: 100, // Increased to accommodate back pain and red flag questions
      questionIds: [
        // Pre-assessment pain questions
        QUESTION_IDS['pain-level'],
        QUESTION_IDS['pain-location'],
        // Back pain general questions
        QUESTION_IDS['back-pain-duration'],
        QUESTION_IDS['back-pain-intensity'],
        QUESTION_IDS['back-pain-type'],
        QUESTION_IDS['back-pain-recurrence'],
        QUESTION_IDS['back-pain-typical-duration'],
        // Red flag screening questions (high score = triggers gentle programme)
        QUESTION_IDS['radiating-pain'],
        QUESTION_IDS['numbness-tingling'],
        QUESTION_IDS['incontinence'],
        QUESTION_IDS['saddle-numbness'],
        QUESTION_IDS['unexplained-weight-loss'],
        QUESTION_IDS['night-sweats'],
      ],
      riskThresholds: { low: 15, moderate: 30 }, // Adjusted for more questions
    },
    {
      name: 'general',
      weight: 1,
      maxScore: 6,
      questionIds: [
        QUESTION_IDS['goal-primary'],
        QUESTION_IDS['activity-level'],
        QUESTION_IDS['medical-conditions'],
      ],
    },
    {
      name: 'strength',
      weight: 1.5,
      maxScore: 64,
      questionIds: [
        QUESTION_IDS['squat-rating'],
        QUESTION_IDS['pushup-count'],
        QUESTION_IDS['strength-comfort'],
      ],
      riskThresholds: { low: 20, moderate: 40 },
    },
    {
      name: 'balance',
      weight: 1.2,
      maxScore: 18,
      questionIds: [
        QUESTION_IDS['single-leg-duration'],
        QUESTION_IDS['tandem-stability'],
        QUESTION_IDS['balance-confidence'],
      ],
      riskThresholds: { low: 6, moderate: 12 },
    },
  ],
  programMappings: [
    // Any red flag present - highest priority, recommend gentle programme with medical review
    // Red flags score 10 each, so pain >= 10 catches any single red flag
    {
      priority: 1,
      conditions: [{ dimension: 'pain', operator: 'gte', value: 35 }],
      programTemplateId: 'gentle-mobility-programme',
    },
    // Moderate-high pain without red flags - gentle programme
    {
      priority: 2,
      conditions: [{ dimension: 'pain', operator: 'gte', value: 20 }],
      programTemplateId: 'gentle-mobility-programme',
    },
    // Low strength + low balance - foundation programme
    {
      priority: 3,
      conditions: [
        { dimension: 'strength', operator: 'lt', value: 20 },
        { dimension: 'balance', operator: 'lt', value: 6 },
      ],
      operator: 'and',
      programTemplateId: 'foundation-programme',
    },
    // Good overall - advanced programme
    {
      priority: 4,
      conditions: [
        { dimension: 'pain', operator: 'lt', value: 10 },
        { dimension: 'strength', operator: 'gte', value: 40 },
      ],
      operator: 'and',
      programTemplateId: 'advanced-strength-programme',
    },
    // Default fallback
    {
      priority: 10,
      conditions: [],
      programTemplateId: 'general-wellness-programme',
    },
  ],
};

/**
 * Seeds the default assessment flow for MVP.
 *
 * This seed is IDEMPOTENT - safe to run multiple times.
 * If a flow with the default name already exists, it will be skipped.
 *
 * Note: assessment_flows table has NO RLS, so no special context needed.
 *
 * @param db - Database client with schema
 * @returns Promise<boolean> - true if flow was created, false if already existed
 */
export const seedAssessmentFlows = async (
  db: NodePgDatabase<typeof schema> & { $client: Pool }
): Promise<boolean> => {
  logger.info('Seeding assessment flows...');

  // Check if default flow already exists (idempotency)
  const existingFlow = await db.query.assessmentFlows.findFirst({
    where: eq(assessmentFlows.name, DEFAULT_FLOW_NAME),
  });

  if (existingFlow) {
    logger.warn(`Assessment flow already exists: "${DEFAULT_FLOW_NAME}"`, {
      id: existingFlow.id,
      isActive: existingFlow.isActive,
    });
    return false;
  }

  // Insert default flow with deterministic UUID
  // Normalised steps are in flow_steps table (see seedFlowSteps.ts).
  const [newFlow] = await db
    .insert(assessmentFlows)
    .values({
      id: FLOW_IDS.DEFAULT,
      name: DEFAULT_FLOW_NAME,
      description: 'Comprehensive assessment with pre-questions and physical tests',
      scoringConfig: FLOW_SCORING_CONFIG,
      isActive: true,
    })
    .returning({ id: assessmentFlows.id });

  logger.info('Assessment flow created', {
    id: newFlow.id,
    name: DEFAULT_FLOW_NAME,
    isActive: true,
  });

  return true;
};
