import { type NodePgDatabase } from 'drizzle-orm/node-postgres';

import { LEVEL_PROGRAMME_SLUGS } from '../src/constants/level-scoring.constants.js';
import { createLogger } from '../src/lib/logger.js';

import { seedAssessmentFlows, type SeedFlow } from './seedAssessmentFlows.js';
import {
  seedAssessmentTemplates,
  type TemplateQuestionMapping,
} from './seedAssessmentTemplates.js';
import { seedFlowSteps } from './seedFlowSteps.js';
import { seedQuestions } from './seedQuestions.js';
import { VIDEO_IDS } from './seedVideos.js';

import type { NextStepRule } from '../src/constants/branching.constants.js';
import type { NewAssessmentTemplate } from '../src/schema/assessment-templates.js';
import type { NewFlowStep } from '../src/schema/flow-steps.js';
import type * as schema from '../src/schema/index.js';
import type { NewQuestion } from '../src/schema/questions.js';
import type { ScoringConfig } from '../src/types/question.types.js';

const logger = createLogger('seed-branching-demo-flow');

/**
 * Deterministic UUIDs for the branching demo's questions
 *
 * UUID Pattern: 22222222-2222-2222-8222-2222222200XX
 * - Getting started: 01xx
 * - Strength check: 02xx
 * - Balance check: 03xx
 */
export const DEMO_QUESTION_IDS = {
  'activity-level': '22222222-2222-2222-8222-222222220104',
  'check-focus': '22222222-2222-2222-8222-222222220107',
  'squat-assessment': '22222222-2222-2222-8222-222222220201',
  'squat-rating': '22222222-2222-2222-8222-222222220202',
  'single-leg-stand': '22222222-2222-2222-8222-222222220301',
  'single-leg-duration': '22222222-2222-2222-8222-222222220302',
} as const;

export const DEMO_TEMPLATE_IDS = {
  GETTING_STARTED: '11111111-1111-1111-8111-111111111101',
  STRENGTH_CHECK: '11111111-1111-1111-8111-111111111102',
  BALANCE_CHECK: '11111111-1111-1111-8111-111111111103',
} as const;

export const DEMO_FLOW_ID = '44444444-4444-4444-8444-444444440002';

export const DEMO_STEP_IDS = {
  INTRO: '55555555-5555-5555-8555-555555550001',
  GETTING_STARTED: '55555555-5555-5555-8555-555555550002',
  STRENGTH_CHECK: '55555555-5555-5555-8555-555555550004',
  BALANCE_CHECK: '55555555-5555-5555-8555-555555550005',
  RESULTS: '55555555-5555-5555-8555-555555550006',
  PROGRAMME_OVERVIEW: '55555555-5555-5555-8555-555555550007',
} as const;

/** Branching demo: "Getting started" */
const gettingStartedQuestions: NewQuestion[] = [
  {
    id: DEMO_QUESTION_IDS['activity-level'],
    slug: 'activity-level',
    type: 'single-choice',
    questionText: 'How would you describe your current activity level?',
    options: [
      { value: 'sedentary', label: 'Sedentary (little to no exercise)' },
      { value: 'light', label: 'Lightly active (light exercise 1-3 days/week)' },
      { value: 'moderate', label: 'Moderately active (moderate exercise 3-5 days/week)' },
      { value: 'very-active', label: 'Very active (hard exercise 6-7 days/week)' },
    ],
    validation: { required: true },
    scoreDimension: null,
    isActive: true,
  },
  {
    id: DEMO_QUESTION_IDS['check-focus'],
    slug: 'check-focus',
    type: 'single-choice',
    questionText: 'Which movement check would you like to start with?',
    description: 'Choosing balance skips the strength check.',
    options: [
      { value: 'strength', label: 'Strength, then balance' },
      { value: 'balance', label: 'Balance only' },
    ],
    validation: { required: true },
    scoreDimension: null,
    isActive: true,
  },
];

/** Branching demo: "Strength check" */
const strengthCheckQuestions: NewQuestion[] = [
  {
    id: DEMO_QUESTION_IDS['squat-assessment'],
    slug: 'squat-assessment',
    type: 'video-response',
    questionText: 'Wall Squat Hold',
    description: 'Hold a wall squat position for as long as comfortable',
    videoId: VIDEO_IDS['bodyweight-squat'],
    validation: { required: true, min: 0, max: 300 },
    scoreDimension: 'strength',
    isActive: true,
  },
  {
    id: DEMO_QUESTION_IDS['squat-rating'],
    slug: 'squat-rating',
    type: 'single-choice',
    questionText: 'How did you find the wall squat?',
    options: [
      { value: 'very-difficult', label: 'Very difficult - could not complete', score: 1 },
      { value: 'difficult', label: 'Difficult - held for less than 15 seconds', score: 2 },
      { value: 'moderate', label: 'Moderate - held for 15-30 seconds', score: 3 },
      { value: 'easy', label: 'Easy - held for over 30 seconds', score: 4 },
    ],
    validation: { required: true },
    scoreDimension: 'strength',
    isActive: true,
  },
];

/** Branching demo: "Balance check" */
const balanceCheckQuestions: NewQuestion[] = [
  {
    id: DEMO_QUESTION_IDS['single-leg-stand'],
    slug: 'single-leg-stand',
    type: 'video-response',
    questionText: 'Single Leg Stand',
    description: 'Stand on one leg for as long as you can safely manage',
    videoId: VIDEO_IDS['single-leg-balance'],
    validation: { required: true, min: 0, max: 300 },
    scoreDimension: 'balance',
    isActive: true,
  },
  {
    id: DEMO_QUESTION_IDS['single-leg-duration'],
    slug: 'single-leg-duration',
    type: 'single-choice',
    questionText: 'How long could you hold the single leg stand?',
    options: [
      { value: 'less-5', label: 'Less than 5 seconds', score: 1 },
      { value: '5-15', label: '5-15 seconds', score: 2 },
      { value: '15-30', label: '15-30 seconds', score: 3 },
      { value: 'over-30', label: 'Over 30 seconds', score: 4 },
    ],
    validation: { required: true },
    scoreDimension: 'balance',
    isActive: true,
  },
];

export const DEMO_QUESTIONS: NewQuestion[] = [
  ...gettingStartedQuestions,
  ...strengthCheckQuestions,
  ...balanceCheckQuestions,
];

const DEMO_TEMPLATES: NewAssessmentTemplate[] = [
  {
    id: DEMO_TEMPLATE_IDS.GETTING_STARTED,
    name: 'getting-started-v1',
    description: 'Activity level and which movement check to start with',
    version: 1,
    isActive: true,
  },
  {
    id: DEMO_TEMPLATE_IDS.STRENGTH_CHECK,
    name: 'strength-check-v1',
    description: 'Video-guided strength check',
    version: 1,
    isActive: true,
  },
  {
    id: DEMO_TEMPLATE_IDS.BALANCE_CHECK,
    name: 'balance-check-v1',
    description: 'Video-guided balance check',
    version: 1,
    isActive: true,
  },
];

const DEMO_TEMPLATE_QUESTION_MAPPINGS: TemplateQuestionMapping[] = [
  {
    templateId: DEMO_TEMPLATE_IDS.GETTING_STARTED,
    questionIds: [DEMO_QUESTION_IDS['activity-level'], DEMO_QUESTION_IDS['check-focus']],
  },
  {
    templateId: DEMO_TEMPLATE_IDS.STRENGTH_CHECK,
    questionIds: [DEMO_QUESTION_IDS['squat-assessment'], DEMO_QUESTION_IDS['squat-rating']],
  },
  {
    templateId: DEMO_TEMPLATE_IDS.BALANCE_CHECK,
    questionIds: [DEMO_QUESTION_IDS['single-leg-stand'], DEMO_QUESTION_IDS['single-leg-duration']],
  },
];

/**
 * Deliberately simple: strong on both checks → level 2, otherwise level 1.
 * Neither check feeds the risk level: the branch can skip the strength check,
 * and a skipped check scores 0.
 */
const SCORING_CONFIG: ScoringConfig = {
  dimensions: [
    {
      name: 'strength',
      questionIds: [DEMO_QUESTION_IDS['squat-rating']],
      maxScore: 4,
      affectsRiskLevel: false,
    },
    {
      name: 'balance',
      questionIds: [DEMO_QUESTION_IDS['single-leg-duration']],
      maxScore: 4,
      affectsRiskLevel: false,
    },
  ],
  programmeMappings: [
    {
      priority: 1,
      operator: 'and',
      conditions: [
        { dimension: 'strength', operator: 'gte', value: 3 },
        { dimension: 'balance', operator: 'gte', value: 3 },
      ],
      programmeTemplateId: LEVEL_PROGRAMME_SLUGS[2],
    },
    { priority: 10, conditions: [], programmeTemplateId: LEVEL_PROGRAMME_SLUGS[1] },
  ],
};

export const DEMO_FLOW: SeedFlow = {
  id: DEMO_FLOW_ID,
  name: 'Movement Check Demo',
  description: 'A reduced flow with a branching rule and video-guided movement checks',
  scoringConfig: SCORING_CONFIG,
};

/** Choosing the balance check skips the strength check */
const CHECK_FOCUS_RULES: NextStepRule[] = [
  {
    priority: 1,
    conditions: [{ type: 'answer_value', questionSlug: 'check-focus', answerValue: 'balance' }],
    action: { type: 'goto_step', targetStepId: DEMO_STEP_IDS.BALANCE_CHECK },
  },
];

const DEMO_FLOW_STEPS: NewFlowStep[] = [
  {
    id: DEMO_STEP_IDS.INTRO,
    flowId: DEMO_FLOW_ID,
    templateId: null,
    order: 1,
    type: 'intro',
    config: {
      title: 'Movement Check',
      description: 'A short, video-guided check of your strength and balance.',
      estimatedMinutes: 10,
    },
    nextStepRules: null,
    defaultNextStepId: DEMO_STEP_IDS.GETTING_STARTED,
    isActive: true,
  },
  {
    id: DEMO_STEP_IDS.GETTING_STARTED,
    flowId: DEMO_FLOW_ID,
    templateId: DEMO_TEMPLATE_IDS.GETTING_STARTED,
    order: 2,
    type: 'questions',
    config: {
      title: 'Getting Started',
      description: 'Tell us how active you are and where you would like to start.',
    },
    nextStepRules: CHECK_FOCUS_RULES,
    defaultNextStepId: DEMO_STEP_IDS.STRENGTH_CHECK,
    isActive: true,
  },
  {
    id: DEMO_STEP_IDS.STRENGTH_CHECK,
    flowId: DEMO_FLOW_ID,
    templateId: DEMO_TEMPLATE_IDS.STRENGTH_CHECK,
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
    defaultNextStepId: DEMO_STEP_IDS.BALANCE_CHECK,
    isActive: true,
  },
  {
    id: DEMO_STEP_IDS.BALANCE_CHECK,
    flowId: DEMO_FLOW_ID,
    templateId: DEMO_TEMPLATE_IDS.BALANCE_CHECK,
    order: 4,
    type: 'video-assessment',
    config: {
      title: 'Balance Check',
      description: 'Use a chair or wall for support if you need it.',
    },
    nextStepRules: null,
    defaultNextStepId: DEMO_STEP_IDS.RESULTS,
    isActive: true,
  },
  {
    id: DEMO_STEP_IDS.RESULTS,
    flowId: DEMO_FLOW_ID,
    templateId: null,
    order: 5,
    type: 'results',
    config: {
      title: 'All Done!',
      description: 'Thanks for completing your movement check. Here are your results:',
    },
    nextStepRules: null,
    defaultNextStepId: DEMO_STEP_IDS.PROGRAMME_OVERVIEW,
    isActive: true,
  },
  {
    id: DEMO_STEP_IDS.PROGRAMME_OVERVIEW,
    flowId: DEMO_FLOW_ID,
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

/**
 * Seeds the branching demo flow with its questions, templates and steps. Its video-response
 * questions point at the sample videos, so this runs after seedVideos.
 */
export const seedBranchingDemoFlow = async (db: NodePgDatabase<typeof schema>): Promise<void> => {
  logger.info('Seeding the branching demo flow...');

  await seedQuestions(db, DEMO_QUESTIONS);
  await seedAssessmentTemplates(db, DEMO_TEMPLATES, DEMO_TEMPLATE_QUESTION_MAPPINGS);

  const createdFlows = await seedAssessmentFlows(db, [DEMO_FLOW]);

  await seedFlowSteps(
    db,
    DEMO_FLOW_STEPS.filter((step) => createdFlows.includes(step.flowId))
  );
};
