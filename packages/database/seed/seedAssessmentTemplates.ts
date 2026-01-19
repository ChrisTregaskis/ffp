import { Pool } from 'pg';
import { eq } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../src/schema/index.js';
import { assessmentTemplates, templateQuestions } from '../src/schema/index.js';
import { createLogger } from '../src/lib/logger.js';
import { QUESTION_IDS } from './seedQuestions.js'; // Used for template-question mappings

import type { NewAssessmentTemplate } from '../src/schema/assessment-templates.js';
import type { NewTemplateQuestion } from '../src/schema/template-questions.js';

const logger = createLogger('seed-assessment-templates');

/**
 * Deterministic UUIDs for assessment templates
 * These are fixed to ensure consistency across seed runs and allow
 * assessment_flows to reference them reliably.
 */
export const TEMPLATE_IDS = {
  PRE_ASSESSMENT_QUESTIONS: '11111111-1111-1111-1111-111111111101',
  STRENGTH_ASSESSMENT: '11111111-1111-1111-1111-111111111102',
  BALANCE_ASSESSMENT: '11111111-1111-1111-1111-111111111103',
  BACK_PAIN_GENERAL: '11111111-1111-1111-1111-111111111104',
  RED_FLAG_SCREENING: '11111111-1111-1111-1111-111111111105',
} as const;

/**
 * Template names matching what's referenced in assessment flows
 */
export const TEMPLATE_NAMES = {
  PRE_ASSESSMENT_QUESTIONS: 'pre-assessment-questions-v1',
  STRENGTH_ASSESSMENT: 'strength-assessment-v1',
  BALANCE_ASSESSMENT: 'balance-assessment-v1',
  BACK_PAIN_GENERAL: 'back-pain-general-v1',
  RED_FLAG_SCREENING: 'red-flag-screening-v1',
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
      'pain-area', // Branching question: determines next step (back vs other)
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
  {
    templateId: TEMPLATE_IDS.BACK_PAIN_GENERAL,
    questionIds: [
      'back-pain-duration',
      'back-pain-intensity',
      'back-pain-type',
      'back-pain-recurrence',
      'back-pain-typical-duration',
    ],
  },
  {
    templateId: TEMPLATE_IDS.RED_FLAG_SCREENING,
    questionIds: [
      'radiating-pain',
      'numbness-tingling',
      'incontinence',
      'saddle-numbness',
      'unexplained-weight-loss',
      'night-sweats',
    ],
  },
];

/**
 * Pre-assessment questions template
 * Contains questions about goals, pain levels, and medical history
 *
 * Questions are now stored in the dedicated `questions` table and linked
 * via `template_questions` join table. See seedQuestions.ts for question data.
 *
 * NOTE: Scoring configuration lives at flow level (assessment_flows.scoringConfig).
 * See seedAssessmentFlows.ts for the combined scoring configuration.
 */
const preAssessmentQuestionsTemplate: NewAssessmentTemplate = {
  id: TEMPLATE_IDS.PRE_ASSESSMENT_QUESTIONS,
  name: TEMPLATE_NAMES.PRE_ASSESSMENT_QUESTIONS,
  description: 'Pre-assessment questions about goals, pain levels, and medical history',
  version: 1,
  isActive: true,
};

/**
 * Strength assessment template
 * Video-based exercises to evaluate strength levels
 *
 * Questions are now stored in the dedicated `questions` table and linked
 * via `template_questions` join table. See seedQuestions.ts for question data.
 *
 * NOTE: Scoring configuration lives at flow level (assessment_flows.scoringConfig).
 * See seedAssessmentFlows.ts for the combined scoring configuration.
 */
const strengthAssessmentTemplate: NewAssessmentTemplate = {
  id: TEMPLATE_IDS.STRENGTH_ASSESSMENT,
  name: TEMPLATE_NAMES.STRENGTH_ASSESSMENT,
  description: 'Video-guided strength assessment exercises',
  version: 1,
  isActive: true,
};

/**
 * Balance assessment template
 * Tests to measure stability and balance in different positions
 *
 * Questions are now stored in the dedicated `questions` table and linked
 * via `template_questions` join table. See seedQuestions.ts for question data.
 *
 * NOTE: Scoring configuration lives at flow level (assessment_flows.scoringConfig).
 * See seedAssessmentFlows.ts for the combined scoring configuration.
 */
const balanceAssessmentTemplate: NewAssessmentTemplate = {
  id: TEMPLATE_IDS.BALANCE_ASSESSMENT,
  name: TEMPLATE_NAMES.BALANCE_ASSESSMENT,
  description: 'Balance and stability assessment exercises',
  version: 1,
  isActive: true,
};

/**
 * Back pain general assessment template
 * Clinical questions about back pain history and characteristics
 *
 * Questions include duration, intensity, type, recurrence history, and typical duration.
 * Based on real physiotherapy assessment protocols.
 *
 * NOTE: Scoring configuration lives at flow level (assessment_flows.scoringConfig).
 * See seedAssessmentFlows.ts for the combined scoring configuration.
 */
const backPainGeneralTemplate: NewAssessmentTemplate = {
  id: TEMPLATE_IDS.BACK_PAIN_GENERAL,
  name: TEMPLATE_NAMES.BACK_PAIN_GENERAL,
  description: 'Clinical questions about back pain history and characteristics',
  version: 1,
  isActive: true,
};

/**
 * Red flag screening template
 * Critical clinical questions to identify conditions requiring medical review
 *
 * Contains 6 yes/no questions based on standard physiotherapy red flag screening protocols.
 * Any "yes" answer triggers a medical warning via branching rules before proceeding.
 *
 * NOTE: Scoring configuration lives at flow level (assessment_flows.scoringConfig).
 * See seedAssessmentFlows.ts for the combined scoring configuration.
 */
const redFlagScreeningTemplate: NewAssessmentTemplate = {
  id: TEMPLATE_IDS.RED_FLAG_SCREENING,
  name: TEMPLATE_NAMES.RED_FLAG_SCREENING,
  description: 'Critical clinical questions to identify conditions requiring medical review',
  version: 1,
  isActive: true,
};

/**
 * All default templates to seed
 */
const DEFAULT_TEMPLATES: NewAssessmentTemplate[] = [
  preAssessmentQuestionsTemplate,
  strengthAssessmentTemplate,
  balanceAssessmentTemplate,
  backPainGeneralTemplate,
  redFlagScreeningTemplate,
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
  logger.info('Seeding assessment templates...');

  let templatesCreatedCount = 0;
  let joinRecordsCreatedCount = 0;

  for (const template of DEFAULT_TEMPLATES) {
    // Check if template already exists (idempotency check by ID)
    const existingTemplate = await db.query.assessmentTemplates.findFirst({
      where: eq(assessmentTemplates.id, template.id!),
    });

    // Get question count from template-question mappings
    const mapping = templateQuestionMappings.find((m) => m.templateId === template.id);
    const questionCount = mapping?.questionIds.length ?? 0;

    if (existingTemplate) {
      logger.warn(`Template already exists: "${template.name}"`, { id: existingTemplate.id });
    } else {
      // Insert new template
      const [newTemplate] = await db.insert(assessmentTemplates).values(template).returning({
        id: assessmentTemplates.id,
        name: assessmentTemplates.name,
      });

      logger.info('Template created', {
        name: newTemplate.name,
        id: newTemplate.id,
        questionCount,
      });

      templatesCreatedCount++;
    }

    // Seed template_questions join records (always attempt, idempotent)
    if (mapping) {
      const joinCount = await seedTemplateQuestions(db, template.id!, mapping.questionIds);
      if (joinCount > 0) {
        logger.debug('Template-question joins created', { templateId: template.id, joinCount });
        joinRecordsCreatedCount += joinCount;
      }
    }
  }

  logger.info('Assessment templates seed complete', {
    templatesCreated: templatesCreatedCount,
    joinsCreated: joinRecordsCreatedCount,
  });

  return templatesCreatedCount;
};
