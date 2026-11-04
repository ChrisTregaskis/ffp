import { eq } from 'drizzle-orm';
import { type NodePgDatabase } from 'drizzle-orm/node-postgres';

import { createLogger } from '../src/lib/logger.js';
import { flowSteps } from '../src/schema/index.js';

import { requireSeedId } from './requireSeedId.js';
import { FLOW_IDS } from './seedAssessmentFlows.js';
import { TEMPLATE_IDS } from './seedAssessmentTemplates.js';

import type { NextStepRule } from '../src/constants/branching.constants.js';
import type { NewFlowStep } from '../src/schema/flow-steps.js';
import type * as schema from '../src/schema/index.js';

const logger = createLogger('seed-flow-steps');

/**
 * Deterministic UUIDs for flow steps
 *
 * UUID Pattern: 55555555-5555-5555-8555-5555555501XX (the branching demo's steps are 00xx).
 * These are fixed to ensure consistency across seed runs and allow
 * tests/Postman to reference steps reliably.
 */
export const STEP_IDS = {
  WELLNESS_INTRO: '55555555-5555-5555-8555-555555550101',
  WELLNESS_ABOUT_YOU: '55555555-5555-5555-8555-555555550102',
  WELLNESS_GOALS_AND_SAFETY: '55555555-5555-5555-8555-555555550103',
  WELLNESS_RESULTS: '55555555-5555-5555-8555-555555550104',
  WELLNESS_PROGRAMME_OVERVIEW: '55555555-5555-5555-8555-555555550105',
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
      warningType: 'seek_medical',
      continueAfterWarning: true,
    },
  },
];

/** The wellness flow's steps, which every environment carries */
export const DEFAULT_FLOW_STEPS: NewFlowStep[] = [
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

/**
 * Seeds the given flow steps. IDEMPOTENT: an existing step, matched by ID, is left as it is.
 * The orchestrator passes only the steps of flows it has just created, so a step an admin
 * removed from an existing flow stays removed. The flow_steps table has no RLS.
 */
export const seedFlowSteps = async (
  db: NodePgDatabase<typeof schema>,
  steps: NewFlowStep[]
): Promise<number> => {
  logger.info('Seeding flow steps...');

  let createdCount = 0;

  for (const step of steps) {
    const existingStep = await db.query.flowSteps.findFirst({
      where: eq(flowSteps.id, requireSeedId(step, `flow step "${step.config.title}"`)),
    });

    if (existingStep) {
      logger.debug(`Step already exists: "${step.config.title}"`, { id: existingStep.id });
      continue;
    }

    await db.insert(flowSteps).values(step);

    logger.info('Step created', {
      id: step.id,
      order: step.order,
      type: step.type,
      title: step.config.title,
    });

    createdCount++;
  }

  logger.info('Flow steps seed complete', { stepsCreated: createdCount, totalSteps: steps.length });

  return createdCount;
};
