import { Pool } from 'pg';
import { eq } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../src/schema/index.js';
import { assessmentFlows } from '../src/schema/index.js';
import { terminalPrefix, TerminalPrefix } from '../src/lib/terminal-logger.js';
import { TEMPLATE_IDS } from './seedAssessmentTemplates.js';

import type { FlowStep } from '../src/constants/flow.constants.js';

/**
 * Default flow name - used for idempotency check
 */
const DEFAULT_FLOW_NAME = 'Standard Physiotherapy Assessment';

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
  console.log(`${terminalPrefix(TerminalPrefix.INFO)} Seeding assessment flows...`);

  // Check if default flow already exists (idempotency)
  const existingFlow = await db.query.assessmentFlows.findFirst({
    where: eq(assessmentFlows.name, DEFAULT_FLOW_NAME),
  });

  if (existingFlow) {
    console.log(
      `${terminalPrefix(TerminalPrefix.WARNING)} Assessment flow already exists: "${DEFAULT_FLOW_NAME}"`
    );
    console.log(`  ID: ${existingFlow.id}`);
    console.log(`  Steps: ${existingFlow.steps.length}`);
    console.log(`  Active: ${existingFlow.isActive}`);
    return false;
  }

  // Insert default flow
  const [newFlow] = await db
    .insert(assessmentFlows)
    .values({
      name: DEFAULT_FLOW_NAME,
      description: 'Comprehensive assessment with pre-questions and physical tests',
      steps: DEFAULT_FLOW_STEPS,
      isActive: true,
    })
    .returning({ id: assessmentFlows.id });

  console.log(`${terminalPrefix(TerminalPrefix.SUCCESS)} Assessment flow created: ${newFlow.id}`);
  console.log(`  Name: ${DEFAULT_FLOW_NAME}`);
  console.log(`  Steps: ${DEFAULT_FLOW_STEPS.length}`);
  console.log(`  Active: true`);

  return true;
};
