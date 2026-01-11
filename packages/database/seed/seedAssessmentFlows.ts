import { Pool } from 'pg';
import { eq } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../src/schema/index.js';
import { assessmentFlows } from '../src/schema/index.js';
import { createLogger } from '../src/lib/logger.js';
import { TEMPLATE_IDS } from './seedAssessmentTemplates.js';
import { QUESTION_IDS } from './seedQuestions.js';

import type { FlowStep } from '../src/constants/flow.constants.js';
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
 * This consolidates scoring from all templates (pre-assessment, strength, balance)
 * into a single configuration that produces one holistic programme recommendation.
 *
 * Dimensions:
 * - pain: From pre-assessment questions (pain-level, pain-location)
 * - general: From pre-assessment questions (goal-primary, activity-level, medical-conditions)
 * - strength: From strength assessment (squat-rating, pushup-count, strength-comfort)
 * - balance: From balance assessment (single-leg-duration, tandem-stability, balance-confidence)
 */
const FLOW_SCORING_CONFIG: ScoringConfig = {
  dimensions: [
    {
      name: 'pain',
      weight: 1,
      maxScore: 17,
      questionIds: [QUESTION_IDS['pain-level'], QUESTION_IDS['pain-location']],
      riskThresholds: { low: 3, moderate: 6 },
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
    // High pain takes priority - recommend gentle programme
    {
      priority: 1,
      conditions: [{ dimension: 'pain', operator: 'gte', value: 7 }],
      programTemplateId: 'gentle-mobility-programme',
    },
    // Low strength + low balance - foundation programme
    {
      priority: 2,
      conditions: [
        { dimension: 'strength', operator: 'lt', value: 20 },
        { dimension: 'balance', operator: 'lt', value: 6 },
      ],
      operator: 'and',
      programTemplateId: 'foundation-programme',
    },
    // Good overall - advanced programme
    {
      priority: 3,
      conditions: [
        { dimension: 'pain', operator: 'lt', value: 3 },
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
 * Default assessment flow steps (from assessment-engine.md)
 *
 * MVP 7-step journey:
 * 1. Intro - Welcome screen
 * 2. Questions - Pre-assessment questions
 * 3. Transition - Physical assessment preparation
 * 4. Video-assessment - Strength tests
 * 5. Video-assessment - Balance tests
 * 6. Results - Score display
 * 7. Programme-overview - Generated programme
 */
const DEFAULT_FLOW_STEPS: FlowStep[] = [
  {
    order: 1,
    type: 'intro',
    config: {
      title: 'Physiotherapy Assessment',
      description: 'Welcome to your personalised physiotherapy assessment.',
      estimatedMinutes: 20,
    },
  },
  {
    order: 2,
    type: 'questions',
    templateId: TEMPLATE_IDS.PRE_ASSESSMENT_QUESTIONS,
    config: {
      title: 'Pre-Assessment Questions',
      description: 'Quick questions about your goals, pain levels, and medical history',
    },
  },
  {
    order: 3,
    type: 'transition',
    config: {
      title: 'Ready for Physical Assessment?',
      description:
        "Great job completing the initial questions! Now we'll guide you through some physical tests.",
      safetyNotes: [
        'Stop immediately if you experience any pain or discomfort',
        'Only perform movements within your comfortable range',
        'Use support (chair, wall) if needed for balance',
        'Take breaks as needed between exercises',
      ],
    },
  },
  {
    order: 4,
    type: 'video-assessment',
    templateId: TEMPLATE_IDS.STRENGTH_ASSESSMENT,
    config: {
      title: 'Strength Assessment',
      description: "Let's evaluate your current strength levels with some simple exercises.",
      instructions: [
        'Watch the video demonstration carefully',
        'Perform the exercise to the best of your ability',
        'Stop if you feel any pain or discomfort',
        'Rate your performance based on how many repetitions you completed',
      ],
    },
  },
  {
    order: 5,
    type: 'video-assessment',
    templateId: TEMPLATE_IDS.BALANCE_ASSESSMENT,
    config: {
      title: 'Balance Assessment',
      description: 'Tests to measure your stability and balance in different positions.',
    },
  },
  {
    order: 6,
    type: 'results',
    config: {
      title: 'Assessment Complete!',
      description: 'Thank you for completing your physiotherapy assessment. Here are your results:',
    },
  },
  {
    order: 7,
    type: 'programme-overview',
    config: {
      title: 'Your Personalised Programme',
      description: "Based on your assessment results, we've created a custom programme for you.",
    },
  },
];

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
      steps: existingFlow.steps.length,
      isActive: existingFlow.isActive,
    });
    return false;
  }

  // Insert default flow with deterministic UUID
  // NOTE: steps JSONB is kept for backwards compatibility but is deprecated.
  // Normalised steps are now in flow_steps table (see seedFlowSteps.ts).
  const [newFlow] = await db
    .insert(assessmentFlows)
    .values({
      id: FLOW_IDS.DEFAULT,
      name: DEFAULT_FLOW_NAME,
      description: 'Comprehensive assessment with pre-questions and physical tests',
      scoringConfig: FLOW_SCORING_CONFIG,
      steps: DEFAULT_FLOW_STEPS, // @deprecated - kept for backwards compatibility
      isActive: true,
    })
    .returning({ id: assessmentFlows.id });

  logger.info('Assessment flow created', {
    id: newFlow.id,
    name: DEFAULT_FLOW_NAME,
    steps: DEFAULT_FLOW_STEPS.length,
    isActive: true,
  });

  return true;
};
