import { Pool } from 'pg';
import { eq } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../src/schema/index.js';
import { flowSteps } from '../src/schema/index.js';
import { createLogger } from '../src/lib/logger.js';
import { FLOW_IDS } from './seedAssessmentFlows.js';
import { TEMPLATE_IDS } from './seedAssessmentTemplates.js';

import type { NewFlowStep } from '../src/schema/flow-steps.js';

const logger = createLogger('seed-flow-steps');

/**
 * Deterministic UUIDs for flow steps
 *
 * UUID Pattern: 55555555-5555-5555-5555-5555555500XX
 * These are fixed to ensure consistency across seed runs and allow
 * tests/Postman to reference steps reliably.
 */
export const STEP_IDS = {
  INTRO: '55555555-5555-5555-5555-555555550001',
  PRE_ASSESSMENT_QUESTIONS: '55555555-5555-5555-5555-555555550002',
  TRANSITION: '55555555-5555-5555-5555-555555550003',
  STRENGTH_ASSESSMENT: '55555555-5555-5555-5555-555555550004',
  BALANCE_ASSESSMENT: '55555555-5555-5555-5555-555555550005',
  RESULTS: '55555555-5555-5555-5555-555555550006',
  PROGRAMME_OVERVIEW: '55555555-5555-5555-5555-555555550007',
} as const;

/**
 * Default flow steps (normalised from JSONB)
 *
 * MVP 7-step journey:
 * 1. Intro - Welcome screen
 * 2. Questions - Pre-assessment questions
 * 3. Transition - Physical assessment preparation
 * 4. Video-assessment - Strength tests
 * 5. Video-assessment - Balance tests
 * 6. Results - Score display
 * 7. Programme-overview - Generated programme
 *
 * Note: defaultNextStepId provides linear progression.
 * No branching rules in MVP - will be added for body-part-specific flows.
 */
const DEFAULT_FLOW_STEPS: NewFlowStep[] = [
  {
    id: STEP_IDS.INTRO,
    flowId: FLOW_IDS.DEFAULT,
    templateId: null,
    order: 1,
    type: 'intro',
    config: {
      title: 'Physiotherapy Assessment',
      description: 'Welcome to your personalised physiotherapy assessment.',
      estimatedMinutes: 20,
    },
    nextStepRules: null,
    defaultNextStepId: STEP_IDS.PRE_ASSESSMENT_QUESTIONS,
    isActive: true,
  },
  {
    id: STEP_IDS.PRE_ASSESSMENT_QUESTIONS,
    flowId: FLOW_IDS.DEFAULT,
    templateId: TEMPLATE_IDS.PRE_ASSESSMENT_QUESTIONS,
    order: 2,
    type: 'questions',
    config: {
      title: 'Pre-Assessment Questions',
      description: 'Quick questions about your goals, pain levels, and medical history',
    },
    nextStepRules: null,
    defaultNextStepId: STEP_IDS.TRANSITION,
    isActive: true,
  },
  {
    id: STEP_IDS.TRANSITION,
    flowId: FLOW_IDS.DEFAULT,
    templateId: null,
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
    nextStepRules: null,
    defaultNextStepId: STEP_IDS.STRENGTH_ASSESSMENT,
    isActive: true,
  },
  {
    id: STEP_IDS.STRENGTH_ASSESSMENT,
    flowId: FLOW_IDS.DEFAULT,
    templateId: TEMPLATE_IDS.STRENGTH_ASSESSMENT,
    order: 4,
    type: 'video-assessment',
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
    nextStepRules: null,
    defaultNextStepId: STEP_IDS.BALANCE_ASSESSMENT,
    isActive: true,
  },
  {
    id: STEP_IDS.BALANCE_ASSESSMENT,
    flowId: FLOW_IDS.DEFAULT,
    templateId: TEMPLATE_IDS.BALANCE_ASSESSMENT,
    order: 5,
    type: 'video-assessment',
    config: {
      title: 'Balance Assessment',
      description: 'Tests to measure your stability and balance in different positions.',
    },
    nextStepRules: null,
    defaultNextStepId: STEP_IDS.RESULTS,
    isActive: true,
  },
  {
    id: STEP_IDS.RESULTS,
    flowId: FLOW_IDS.DEFAULT,
    templateId: null,
    order: 6,
    type: 'results',
    config: {
      title: 'Assessment Complete!',
      description: 'Thank you for completing your physiotherapy assessment. Here are your results:',
    },
    nextStepRules: null,
    defaultNextStepId: STEP_IDS.PROGRAMME_OVERVIEW,
    isActive: true,
  },
  {
    id: STEP_IDS.PROGRAMME_OVERVIEW,
    flowId: FLOW_IDS.DEFAULT,
    templateId: null,
    order: 7,
    type: 'programme-overview',
    config: {
      title: 'Your Personalised Programme',
      description: "Based on your assessment results, we've created a custom programme for you.",
    },
    nextStepRules: null,
    defaultNextStepId: null, // End of flow
    isActive: true,
  },
];

/**
 * Seeds flow steps for the default assessment flow.
 *
 * This seed is IDEMPOTENT - safe to run multiple times.
 * Steps are upserted by ID (existing steps are skipped).
 *
 * Note: flow_steps table has NO RLS, so no special context needed.
 *
 * @param db - Database client with schema
 * @returns Promise<number> - Number of steps created (0 if all existed)
 */
export const seedFlowSteps = async (
  db: NodePgDatabase<typeof schema> & { $client: Pool }
): Promise<number> => {
  logger.info('Seeding flow steps...');

  let createdCount = 0;

  for (const step of DEFAULT_FLOW_STEPS) {
    // Check if step already exists (idempotency check by ID)
    const existingStep = await db.query.flowSteps.findFirst({
      where: eq(flowSteps.id, step.id!),
    });

    if (existingStep) {
      logger.debug(`Step already exists: "${step.config.title}"`, { id: existingStep.id });
      continue;
    }

    // Insert new step
    await db.insert(flowSteps).values(step);

    logger.info('Step created', {
      id: step.id,
      order: step.order,
      type: step.type,
      title: step.config.title,
    });

    createdCount++;
  }

  logger.info('Flow steps seed complete', {
    stepsCreated: createdCount,
    totalSteps: DEFAULT_FLOW_STEPS.length,
  });

  return createdCount;
};
