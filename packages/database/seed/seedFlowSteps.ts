import { Pool } from 'pg';
import { eq } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../src/schema/index.js';
import { flowSteps } from '../src/schema/index.js';
import { createLogger } from '../src/lib/logger.js';
import { FLOW_IDS } from './seedAssessmentFlows.js';
import { TEMPLATE_IDS } from './seedAssessmentTemplates.js';

import type { NewFlowStep } from '../src/schema/flow-steps.js';
import type { NextStepRule } from '../src/constants/branching.constants.js';

const logger = createLogger('seed-flow-steps');

/**
 * Deterministic UUIDs for flow steps
 *
 * UUID Pattern: 55555555-5555-5555-8555-5555555500XX
 * - Branching demo: 00xx
 * - Wellness assessment: 01xx
 * These are fixed to ensure consistency across seed runs and allow
 * tests/Postman to reference steps reliably.
 */
export const STEP_IDS = {
  WELLNESS_INTRO: '55555555-5555-5555-8555-555555550101',
  WELLNESS_ABOUT_YOU: '55555555-5555-5555-8555-555555550102',
  WELLNESS_GOALS_AND_SAFETY: '55555555-5555-5555-8555-555555550103',
  WELLNESS_RESULTS: '55555555-5555-5555-8555-555555550104',
  WELLNESS_PROGRAMME_OVERVIEW: '55555555-5555-5555-8555-555555550105',

  DEMO_INTRO: '55555555-5555-5555-8555-555555550001',
  DEMO_GETTING_STARTED: '55555555-5555-5555-8555-555555550002',
  DEMO_STRENGTH_CHECK: '55555555-5555-5555-8555-555555550004',
  DEMO_BALANCE_CHECK: '55555555-5555-5555-8555-555555550005',
  DEMO_RESULTS: '55555555-5555-5555-8555-555555550006',
  DEMO_PROGRAMME_OVERVIEW: '55555555-5555-5555-8555-555555550007',
} as const;

/** Any of the first three safety answers asks the member to seek advice before starting */
const SAFETY_CHECK_RULES: NextStepRule[] = [
  {
    priority: 1,
    conditions: [
      {
        type: 'answer_value',
        questionSlug: 'safety-check',
        answerValue: ['chest-pain', 'dizziness', 'night-pain'],
      },
    ],
    action: {
      type: 'show_warning',
      warningMessage:
        'Before you start, please speak to a health professional about what you have selected, to make sure these sessions are right for you.',
      warningType: 'caution',
      continueAfterWarning: true,
    },
  },
];

/** Choosing the balance check skips the strength check */
const CHECK_FOCUS_RULES: NextStepRule[] = [
  {
    priority: 1,
    conditions: [{ type: 'answer_value', questionSlug: 'check-focus', answerValue: 'balance' }],
    action: { type: 'goto_step', targetStepId: STEP_IDS.DEMO_BALANCE_CHECK },
  },
];

const WELLNESS_FLOW_STEPS: NewFlowStep[] = [
  {
    id: STEP_IDS.WELLNESS_INTRO,
    flowId: FLOW_IDS.WELLNESS,
    templateId: null,
    order: 1,
    type: 'intro',
    config: {
      title: 'Your Movement Check-in',
      description: 'A few quick questions so we can suggest the right starting level for you.',
      estimatedMinutes: 5,
    },
    nextStepRules: null,
    defaultNextStepId: STEP_IDS.WELLNESS_ABOUT_YOU,
    isActive: true,
  },
  {
    id: STEP_IDS.WELLNESS_ABOUT_YOU,
    flowId: FLOW_IDS.WELLNESS,
    templateId: TEMPLATE_IDS.ABOUT_YOU,
    order: 2,
    type: 'questions',
    config: {
      title: 'About You',
      description: 'A little about you and how active you are day to day.',
    },
    nextStepRules: null,
    defaultNextStepId: STEP_IDS.WELLNESS_GOALS_AND_SAFETY,
    isActive: true,
  },
  {
    id: STEP_IDS.WELLNESS_GOALS_AND_SAFETY,
    flowId: FLOW_IDS.WELLNESS,
    templateId: TEMPLATE_IDS.GOALS_AND_SAFETY,
    order: 3,
    type: 'questions',
    config: {
      title: 'Goals and Safety',
      description: 'What you would like to focus on, and a quick safety check.',
    },
    nextStepRules: SAFETY_CHECK_RULES,
    defaultNextStepId: STEP_IDS.WELLNESS_RESULTS,
    isActive: true,
  },
  {
    id: STEP_IDS.WELLNESS_RESULTS,
    flowId: FLOW_IDS.WELLNESS,
    templateId: null,
    order: 4,
    type: 'results',
    config: {
      title: 'All Done!',
      description: 'Thanks for completing your check-in. Here is where you are starting:',
    },
    nextStepRules: null,
    defaultNextStepId: STEP_IDS.WELLNESS_PROGRAMME_OVERVIEW,
    isActive: true,
  },
  {
    id: STEP_IDS.WELLNESS_PROGRAMME_OVERVIEW,
    flowId: FLOW_IDS.WELLNESS,
    templateId: null,
    order: 5,
    type: 'programme-overview',
    config: {
      title: 'Your Programme',
      description: 'Your sessions, matched to your starting level.',
    },
    nextStepRules: null,
    defaultNextStepId: null,
    isActive: true,
  },
];

const BRANCHING_DEMO_FLOW_STEPS: NewFlowStep[] = [
  {
    id: STEP_IDS.DEMO_INTRO,
    flowId: FLOW_IDS.BRANCHING_DEMO,
    templateId: null,
    order: 1,
    type: 'intro',
    config: {
      title: 'Movement Check',
      description: 'A short, video-guided check of your strength and balance.',
      estimatedMinutes: 10,
    },
    nextStepRules: null,
    defaultNextStepId: STEP_IDS.DEMO_GETTING_STARTED,
    isActive: true,
  },
  {
    id: STEP_IDS.DEMO_GETTING_STARTED,
    flowId: FLOW_IDS.BRANCHING_DEMO,
    templateId: TEMPLATE_IDS.GETTING_STARTED,
    order: 2,
    type: 'questions',
    config: {
      title: 'Getting Started',
      description: 'Tell us how active you are and where you would like to start.',
    },
    nextStepRules: CHECK_FOCUS_RULES,
    defaultNextStepId: STEP_IDS.DEMO_STRENGTH_CHECK,
    isActive: true,
  },
  {
    id: STEP_IDS.DEMO_STRENGTH_CHECK,
    flowId: FLOW_IDS.BRANCHING_DEMO,
    templateId: TEMPLATE_IDS.STRENGTH_CHECK,
    order: 3,
    type: 'video-assessment',
    config: {
      title: 'Strength Check',
      description: 'Follow the video, then tell us how it went.',
      instructions: [
        'Watch the video demonstration carefully',
        'Only move within a comfortable range',
        'Stop if anything feels uncomfortable',
      ],
    },
    nextStepRules: null,
    defaultNextStepId: STEP_IDS.DEMO_BALANCE_CHECK,
    isActive: true,
  },
  {
    id: STEP_IDS.DEMO_BALANCE_CHECK,
    flowId: FLOW_IDS.BRANCHING_DEMO,
    templateId: TEMPLATE_IDS.BALANCE_CHECK,
    order: 4,
    type: 'video-assessment',
    config: {
      title: 'Balance Check',
      description: 'Use a chair or wall for support if you need it.',
    },
    nextStepRules: null,
    defaultNextStepId: STEP_IDS.DEMO_RESULTS,
    isActive: true,
  },
  {
    id: STEP_IDS.DEMO_RESULTS,
    flowId: FLOW_IDS.BRANCHING_DEMO,
    templateId: null,
    order: 5,
    type: 'results',
    config: {
      title: 'All Done!',
      description: 'Thanks for completing your movement check. Here are your results:',
    },
    nextStepRules: null,
    defaultNextStepId: STEP_IDS.DEMO_PROGRAMME_OVERVIEW,
    isActive: true,
  },
  {
    id: STEP_IDS.DEMO_PROGRAMME_OVERVIEW,
    flowId: FLOW_IDS.BRANCHING_DEMO,
    templateId: null,
    order: 6,
    type: 'programme-overview',
    config: {
      title: 'Your Programme',
      description: 'Your sessions, matched to your results.',
    },
    nextStepRules: null,
    defaultNextStepId: null,
    isActive: true,
  },
];

const DEFAULT_FLOW_STEPS: NewFlowStep[] = [...WELLNESS_FLOW_STEPS, ...BRANCHING_DEMO_FLOW_STEPS];

/**
 * Seeds flow steps for the seeded assessment flows.
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
