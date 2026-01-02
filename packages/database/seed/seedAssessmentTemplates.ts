import { Pool } from 'pg';
import { eq } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../src/schema/index.js';
import { assessmentTemplates, templateQuestions } from '../src/schema/index.js';
import { terminalPrefix, TerminalPrefix } from '../src/lib/terminal-logger.js';
import { QUESTION_IDS } from './seedQuestions.js';

import type { NewAssessmentTemplate } from '../src/schema/assessment-templates.js';
import type { NewTemplateQuestion } from '../src/schema/template-questions.js';

/**
 * Deterministic UUIDs for assessment templates
 * These are fixed to ensure consistency across seed runs and allow
 * assessment_flows to reference them reliably.
 */
export const TEMPLATE_IDS = {
  PRE_ASSESSMENT_QUESTIONS: '11111111-1111-1111-1111-111111111101',
  STRENGTH_ASSESSMENT: '11111111-1111-1111-1111-111111111102',
  BALANCE_ASSESSMENT: '11111111-1111-1111-1111-111111111103',
} as const;

/**
 * Template names matching what's referenced in assessment flows
 */
export const TEMPLATE_NAMES = {
  PRE_ASSESSMENT_QUESTIONS: 'pre-assessment-questions-v1',
  STRENGTH_ASSESSMENT: 'strength-assessment-v1',
  BALANCE_ASSESSMENT: 'balance-assessment-v1',
} as const;

/**
 * Template question mappings
 * Maps each template to its questions with display order
 */
interface TemplateQuestionMapping {
  templateId: string;
  questionIds: Array<keyof typeof QUESTION_IDS>;
}

const templateQuestionMappings: TemplateQuestionMapping[] = [
  {
    templateId: TEMPLATE_IDS.PRE_ASSESSMENT_QUESTIONS,
    questionIds: [
      'goal-primary',
      'pain-level',
      'pain-location',
      'activity-level',
      'medical-conditions',
    ],
  },
  {
    templateId: TEMPLATE_IDS.STRENGTH_ASSESSMENT,
    questionIds: [
      'squat-assessment',
      'squat-rating',
      'pushup-assessment',
      'pushup-count',
      'strength-comfort',
    ],
  },
  {
    templateId: TEMPLATE_IDS.BALANCE_ASSESSMENT,
    questionIds: [
      'single-leg-stand',
      'single-leg-duration',
      'tandem-stand',
      'tandem-stability',
      'balance-confidence',
    ],
  },
];

/**
 * Pre-assessment questions template
 * Contains questions about goals, pain levels, and medical history
 *
 * Note: The `questions` array is retained for backwards compatibility until
 * Phase 8 removes the JSONB column. New code should use template_questions join.
 */
const preAssessmentQuestionsTemplate: NewAssessmentTemplate = {
  id: TEMPLATE_IDS.PRE_ASSESSMENT_QUESTIONS,
  name: TEMPLATE_NAMES.PRE_ASSESSMENT_QUESTIONS,
  description: 'Pre-assessment questions about goals, pain levels, and medical history',
  version: 1,
  questions: [
    {
      id: QUESTION_IDS['goal-primary'],
      type: 'single-choice',
      question: 'What is your primary goal for this programme?',
      description: 'Select the goal that best describes what you want to achieve',
      options: [
        { value: 'pain-reduction', label: 'Reduce pain and discomfort', score: 1 },
        { value: 'strength', label: 'Build strength', score: 2 },
        { value: 'mobility', label: 'Improve mobility and flexibility', score: 2 },
        { value: 'balance', label: 'Improve balance and stability', score: 2 },
        { value: 'general-fitness', label: 'General fitness improvement', score: 1 },
      ],
      validation: { required: true },
      scoreDimension: 'general',
    },
    {
      id: QUESTION_IDS['pain-level'],
      type: 'scale',
      question: 'How would you rate your current pain level?',
      description: 'On a scale of 0 (no pain) to 10 (worst pain imaginable)',
      validation: { required: true, min: 0, max: 10 },
      scoreDimension: 'pain',
    },
    {
      id: QUESTION_IDS['pain-location'],
      type: 'multi-choice',
      question: 'Where do you experience pain or discomfort?',
      description: 'Select all areas that apply',
      options: [
        { value: 'lower-back', label: 'Lower back', score: 1 },
        { value: 'upper-back', label: 'Upper back/shoulders', score: 1 },
        { value: 'neck', label: 'Neck', score: 1 },
        { value: 'hips', label: 'Hips', score: 1 },
        { value: 'knees', label: 'Knees', score: 1 },
        { value: 'ankles-feet', label: 'Ankles/feet', score: 1 },
        { value: 'none', label: 'No pain', score: 0 },
      ],
      validation: { required: false },
      scoreDimension: 'pain',
    },
    {
      id: QUESTION_IDS['activity-level'],
      type: 'single-choice',
      question: 'How would you describe your current activity level?',
      options: [
        { value: 'sedentary', label: 'Sedentary (little to no exercise)', score: 1 },
        { value: 'light', label: 'Lightly active (light exercise 1-3 days/week)', score: 2 },
        {
          value: 'moderate',
          label: 'Moderately active (moderate exercise 3-5 days/week)',
          score: 3,
        },
        { value: 'very-active', label: 'Very active (hard exercise 6-7 days/week)', score: 4 },
      ],
      validation: { required: true },
      scoreDimension: 'general',
    },
    {
      id: QUESTION_IDS['medical-conditions'],
      type: 'multi-choice',
      question: 'Do you have any of the following conditions?',
      description: 'Select all that apply. This helps us tailor your programme safely.',
      options: [
        { value: 'heart-condition', label: 'Heart condition', score: 0 },
        { value: 'high-blood-pressure', label: 'High blood pressure', score: 0 },
        { value: 'diabetes', label: 'Diabetes', score: 0 },
        { value: 'arthritis', label: 'Arthritis', score: 0 },
        { value: 'osteoporosis', label: 'Osteoporosis', score: 0 },
        { value: 'recent-surgery', label: 'Recent surgery (within 6 months)', score: 0 },
        { value: 'none', label: 'None of the above', score: 0 },
      ],
      validation: { required: true },
      scoreDimension: 'general',
    },
  ],
  scoringConfig: {
    dimensions: [
      {
        name: 'pain',
        questionIds: [QUESTION_IDS['pain-level'], QUESTION_IDS['pain-location']],
        maxScore: 17,
        weight: 1,
        riskThresholds: { low: 3, moderate: 6 },
      },
      {
        name: 'general',
        questionIds: [
          QUESTION_IDS['goal-primary'],
          QUESTION_IDS['activity-level'],
          QUESTION_IDS['medical-conditions'],
        ],
        maxScore: 6,
        weight: 1,
      },
    ],
    programMappings: [
      {
        conditions: [{ dimension: 'pain', operator: 'gte', value: 7 }],
        programTemplateId: 'gentle-mobility-programme',
        priority: 1,
      },
      {
        conditions: [{ dimension: 'pain', operator: 'lt', value: 3 }],
        programTemplateId: 'strength-building-programme',
        priority: 2,
      },
    ],
  },
  isActive: true,
};

/**
 * Strength assessment template
 * Video-based exercises to evaluate strength levels
 */
const strengthAssessmentTemplate: NewAssessmentTemplate = {
  id: TEMPLATE_IDS.STRENGTH_ASSESSMENT,
  name: TEMPLATE_NAMES.STRENGTH_ASSESSMENT,
  description: 'Video-guided strength assessment exercises',
  version: 1,
  questions: [
    {
      id: QUESTION_IDS['squat-assessment'],
      type: 'video-response',
      question: 'Wall Squat Hold',
      description: 'Hold a wall squat position for as long as comfortable',
      videoId: 'video-wall-squat-demo',
      validation: { required: true },
      scoreDimension: 'strength',
    },
    {
      id: QUESTION_IDS['squat-rating'],
      type: 'single-choice',
      question: 'How did you find the wall squat?',
      options: [
        { value: 'very-difficult', label: 'Very difficult - could not complete', score: 1 },
        { value: 'difficult', label: 'Difficult - held for less than 15 seconds', score: 2 },
        { value: 'moderate', label: 'Moderate - held for 15-30 seconds', score: 3 },
        { value: 'easy', label: 'Easy - held for over 30 seconds', score: 4 },
      ],
      validation: { required: true },
      scoreDimension: 'strength',
    },
    {
      id: QUESTION_IDS['pushup-assessment'],
      type: 'video-response',
      question: 'Modified Push-up Test',
      description: 'Perform as many modified push-ups as you can with good form',
      videoId: 'video-modified-pushup-demo',
      validation: { required: true },
      scoreDimension: 'strength',
    },
    {
      id: QUESTION_IDS['pushup-count'],
      type: 'numeric',
      question: 'How many modified push-ups did you complete?',
      validation: { required: true, min: 0, max: 50 },
      scoreDimension: 'strength',
    },
    {
      id: QUESTION_IDS['strength-comfort'],
      type: 'scale',
      question: 'How comfortable did you feel during the strength exercises?',
      description: 'On a scale of 1 (very uncomfortable) to 10 (very comfortable)',
      validation: { required: false, min: 1, max: 10 },
      scoreDimension: 'strength',
    },
  ],
  scoringConfig: {
    dimensions: [
      {
        name: 'strength',
        questionIds: [
          QUESTION_IDS['squat-rating'],
          QUESTION_IDS['pushup-count'],
          QUESTION_IDS['strength-comfort'],
        ],
        maxScore: 64,
        weight: 1.5,
        riskThresholds: { low: 20, moderate: 40 },
      },
    ],
    programMappings: [
      {
        conditions: [{ dimension: 'strength', operator: 'lt', value: 20 }],
        programTemplateId: 'beginner-strength-programme',
        priority: 1,
      },
      {
        conditions: [{ dimension: 'strength', operator: 'gte', value: 40 }],
        programTemplateId: 'advanced-strength-programme',
        priority: 2,
      },
    ],
  },
  isActive: true,
};

/**
 * Balance assessment template
 * Tests to measure stability and balance in different positions
 */
const balanceAssessmentTemplate: NewAssessmentTemplate = {
  id: TEMPLATE_IDS.BALANCE_ASSESSMENT,
  name: TEMPLATE_NAMES.BALANCE_ASSESSMENT,
  description: 'Balance and stability assessment exercises',
  version: 1,
  questions: [
    {
      id: QUESTION_IDS['single-leg-stand'],
      type: 'video-response',
      question: 'Single Leg Stand',
      description: 'Stand on one leg for as long as you can safely manage',
      videoId: 'video-single-leg-stand-demo',
      validation: { required: true },
      scoreDimension: 'balance',
    },
    {
      id: QUESTION_IDS['single-leg-duration'],
      type: 'single-choice',
      question: 'How long could you hold the single leg stand?',
      options: [
        { value: 'less-5', label: 'Less than 5 seconds', score: 1 },
        { value: '5-15', label: '5-15 seconds', score: 2 },
        { value: '15-30', label: '15-30 seconds', score: 3 },
        { value: 'over-30', label: 'Over 30 seconds', score: 4 },
      ],
      validation: { required: true },
      scoreDimension: 'balance',
    },
    {
      id: QUESTION_IDS['tandem-stand'],
      type: 'video-response',
      question: 'Tandem Stand',
      description: 'Stand with one foot directly in front of the other, heel to toe',
      videoId: 'video-tandem-stand-demo',
      validation: { required: true },
      scoreDimension: 'balance',
    },
    {
      id: QUESTION_IDS['tandem-stability'],
      type: 'single-choice',
      question: 'How stable did you feel during the tandem stand?',
      options: [
        { value: 'very-unstable', label: 'Very unstable - needed support', score: 1 },
        { value: 'unstable', label: 'Unstable - wobbled significantly', score: 2 },
        { value: 'somewhat-stable', label: 'Somewhat stable - minor wobbles', score: 3 },
        { value: 'very-stable', label: 'Very stable - held position easily', score: 4 },
      ],
      validation: { required: true },
      scoreDimension: 'balance',
    },
    {
      id: QUESTION_IDS['balance-confidence'],
      type: 'scale',
      question: 'How confident do you feel about your balance in daily activities?',
      description: 'On a scale of 1 (not confident) to 10 (very confident)',
      validation: { required: true, min: 1, max: 10 },
      scoreDimension: 'balance',
    },
  ],
  scoringConfig: {
    dimensions: [
      {
        name: 'balance',
        questionIds: [
          QUESTION_IDS['single-leg-duration'],
          QUESTION_IDS['tandem-stability'],
          QUESTION_IDS['balance-confidence'],
        ],
        maxScore: 18,
        weight: 1.2,
        riskThresholds: { low: 6, moderate: 12 },
      },
    ],
    programMappings: [
      {
        conditions: [{ dimension: 'balance', operator: 'lt', value: 6 }],
        programTemplateId: 'balance-foundation-programme',
        priority: 1,
      },
      {
        conditions: [{ dimension: 'balance', operator: 'gte', value: 12 }],
        programTemplateId: 'advanced-balance-programme',
        priority: 2,
      },
    ],
  },
  isActive: true,
};

/**
 * All default templates to seed
 */
const DEFAULT_TEMPLATES: NewAssessmentTemplate[] = [
  preAssessmentQuestionsTemplate,
  strengthAssessmentTemplate,
  balanceAssessmentTemplate,
];

/**
 * Seeds template_questions join records for a template
 *
 * @param db - Database client
 * @param templateId - Template UUID
 * @param questionSlugs - Ordered array of question slugs
 * @returns Number of join records created
 */
const seedTemplateQuestions = async (
  db: NodePgDatabase<typeof schema> & { $client: Pool },
  templateId: string,
  questionSlugs: Array<keyof typeof QUESTION_IDS>
): Promise<number> => {
  let createdCount = 0;

  for (let i = 0; i < questionSlugs.length; i++) {
    const slug = questionSlugs[i];
    const questionId = QUESTION_IDS[slug];
    const displayOrder = i + 1; // 1-based display order

    // Check if join record already exists
    const existing = await db.query.templateQuestions.findFirst({
      where: (tq, { and, eq }) => and(eq(tq.templateId, templateId), eq(tq.questionId, questionId)),
    });

    if (existing) {
      continue; // Already exists, skip
    }

    const joinRecord: NewTemplateQuestion = {
      templateId,
      questionId,
      displayOrder,
    };

    await db.insert(templateQuestions).values(joinRecord);
    createdCount++;
  }

  return createdCount;
};

/**
 * Seeds assessment templates for MVP.
 *
 * This seed is IDEMPOTENT - safe to run multiple times.
 * Templates are upserted by ID (existing templates are skipped).
 *
 * Note: assessment_templates table has NO RLS, so no special context needed.
 *
 * @param db - Database client with schema
 * @returns Promise<number> - Number of templates created (0 if all existed)
 */
export const seedAssessmentTemplates = async (
  db: NodePgDatabase<typeof schema> & { $client: Pool }
): Promise<number> => {
  console.log(`${terminalPrefix(TerminalPrefix.INFO)} Seeding assessment templates...`);

  let templatesCreatedCount = 0;
  let joinRecordsCreatedCount = 0;

  for (const template of DEFAULT_TEMPLATES) {
    // Check if template already exists (idempotency check by ID)
    const existingTemplate = await db.query.assessmentTemplates.findFirst({
      where: eq(assessmentTemplates.id, template.id!),
    });

    if (existingTemplate) {
      console.log(
        `${terminalPrefix(TerminalPrefix.WARNING)} Template already exists: "${template.name}"`
      );
      console.log(`  ID: ${existingTemplate.id}`);
      console.log(`  Questions: ${existingTemplate.questions.length}`);
    } else {
      // Insert new template
      const [newTemplate] = await db.insert(assessmentTemplates).values(template).returning({
        id: assessmentTemplates.id,
        name: assessmentTemplates.name,
      });

      console.log(
        `${terminalPrefix(TerminalPrefix.SUCCESS)} Template created: ${newTemplate.name}`
      );
      console.log(`  ID: ${newTemplate.id}`);
      console.log(`  Questions: ${template.questions.length}`);

      // Count required questions for visibility
      const requiredCount = template.questions.filter((q) => q.validation?.required).length;
      console.log(`  Required questions: ${requiredCount}`);

      templatesCreatedCount++;
    }

    // Seed template_questions join records (always attempt, idempotent)
    const mapping = templateQuestionMappings.find((m) => m.templateId === template.id);
    if (mapping) {
      const joinCount = await seedTemplateQuestions(db, template.id!, mapping.questionIds);
      if (joinCount > 0) {
        console.log(`  Template-question joins created: ${joinCount}`);
        joinRecordsCreatedCount += joinCount;
      }
    }
  }

  console.log(
    `${terminalPrefix(TerminalPrefix.INFO)} Assessment templates seed complete: ${templatesCreatedCount} templates created, ${joinRecordsCreatedCount} joins created`
  );

  return templatesCreatedCount;
};
