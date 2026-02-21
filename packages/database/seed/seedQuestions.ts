import { Pool } from 'pg';
import { eq } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../src/schema/index.js';
import { questions } from '../src/schema/index.js';
import { createLogger } from '../src/lib/logger.js';

import type { NewQuestion } from '../src/schema/questions.js';

const logger = createLogger('seed-questions');

/**
 * Deterministic UUIDs for demo videos
 *
 * These are placeholder UUIDs for videos referenced by questions.
 * When actual videos are seeded, they should use these IDs.
 *
 * UUID Pattern: 33333333-3333-3333-8333-3333333300XX
 */
export const VIDEO_IDS = {
  'wall-squat-demo': '33333333-3333-3333-8333-333333330001',
  'modified-pushup-demo': '33333333-3333-3333-8333-333333330002',
  'single-leg-stand-demo': '33333333-3333-3333-8333-333333330003',
  'tandem-stand-demo': '33333333-3333-3333-8333-333333330004',
} as const;

export type VideoSlug = keyof typeof VIDEO_IDS;

/**
 * Deterministic UUIDs for questions
 *
 * These are fixed to ensure consistency across seed runs and allow
 * template_questions and scoring configs to reference them reliably.
 *
 * UUID Pattern: 22222222-2222-2222-8222-2222222200XX
 * - Pre-assessment questions: 01xx
 * - Strength assessment questions: 02xx
 * - Balance assessment questions: 03xx
 * - Back pain general questions: 04xx
 * - Red flag screening questions: 05xx
 */
export const QUESTION_IDS = {
  // Pre-assessment questions (template 11111111-1111-1111-8111-111111111101)
  'goal-primary': '22222222-2222-2222-8222-222222220101',
  'pain-level': '22222222-2222-2222-8222-222222220102',
  'pain-location': '22222222-2222-2222-8222-222222220103',
  'activity-level': '22222222-2222-2222-8222-222222220104',
  'medical-conditions': '22222222-2222-2222-8222-222222220105',
  'pain-area': '22222222-2222-2222-8222-222222220106', // Branching: determines next step

  // Strength assessment questions (template 11111111-1111-1111-8111-111111111102)
  'squat-assessment': '22222222-2222-2222-8222-222222220201',
  'squat-rating': '22222222-2222-2222-8222-222222220202',
  'pushup-assessment': '22222222-2222-2222-8222-222222220203',
  'pushup-count': '22222222-2222-2222-8222-222222220204',
  'strength-comfort': '22222222-2222-2222-8222-222222220205',

  // Balance assessment questions (template 11111111-1111-1111-8111-111111111103)
  'single-leg-stand': '22222222-2222-2222-8222-222222220301',
  'single-leg-duration': '22222222-2222-2222-8222-222222220302',
  'tandem-stand': '22222222-2222-2222-8222-222222220303',
  'tandem-stability': '22222222-2222-2222-8222-222222220304',
  'balance-confidence': '22222222-2222-2222-8222-222222220305',

  // Back pain general questions (template 11111111-1111-1111-8111-111111111104)
  'back-pain-duration': '22222222-2222-2222-8222-222222220401',
  'back-pain-intensity': '22222222-2222-2222-8222-222222220402',
  'back-pain-type': '22222222-2222-2222-8222-222222220403',
  'back-pain-recurrence': '22222222-2222-2222-8222-222222220404',
  'back-pain-typical-duration': '22222222-2222-2222-8222-222222220405',

  // Red flag screening questions (template 11111111-1111-1111-8111-111111111105)
  'radiating-pain': '22222222-2222-2222-8222-222222220501',
  'numbness-tingling': '22222222-2222-2222-8222-222222220502',
  incontinence: '22222222-2222-2222-8222-222222220503',
  'saddle-numbness': '22222222-2222-2222-8222-222222220504',
  'unexplained-weight-loss': '22222222-2222-2222-8222-222222220505',
  'night-sweats': '22222222-2222-2222-8222-222222220506',
} as const;

export type QuestionSlug = keyof typeof QUESTION_IDS;

/**
 * Pre-assessment questions
 * Questions about goals, pain levels, and medical history
 */
const preAssessmentQuestions: NewQuestion[] = [
  {
    id: QUESTION_IDS['goal-primary'],
    slug: 'goal-primary',
    type: 'single-choice',
    questionText: 'What is your primary goal for this programme?',
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
    isActive: true,
  },
  {
    id: QUESTION_IDS['pain-level'],
    slug: 'pain-level',
    type: 'scale',
    questionText: 'How would you rate your current pain level?',
    description: 'On a scale of 0 (no pain) to 10 (worst pain imaginable)',
    validation: { required: true, min: 0, max: 10 },
    scoreDimension: 'pain',
    isActive: true,
  },
  {
    id: QUESTION_IDS['pain-location'],
    slug: 'pain-location',
    type: 'multi-choice',
    questionText: 'Where do you experience pain or discomfort?',
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
    isActive: true,
  },
  {
    id: QUESTION_IDS['activity-level'],
    slug: 'activity-level',
    type: 'single-choice',
    questionText: 'How would you describe your current activity level?',
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
    isActive: true,
  },
  {
    id: QUESTION_IDS['medical-conditions'],
    slug: 'medical-conditions',
    type: 'multi-choice',
    questionText: 'Do you have any of the following conditions?',
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
    isActive: true,
  },
  {
    id: QUESTION_IDS['pain-area'],
    slug: 'pain-area',
    type: 'single-choice',
    questionText: 'Which area is your primary concern?',
    description:
      'Select the main area you would like to focus on. This helps us tailor your assessment.',
    options: [
      { value: 'back', label: 'Back (lower or upper)', score: 0 },
      { value: 'other', label: 'Other area (general assessment)', score: 0 },
    ],
    validation: { required: true },
    scoreDimension: 'general',
    isActive: true,
  },
];

/**
 * Strength assessment questions
 * Video-based exercises to evaluate strength levels
 */
const strengthAssessmentQuestions: NewQuestion[] = [
  {
    id: QUESTION_IDS['squat-assessment'],
    slug: 'squat-assessment',
    type: 'video-response',
    questionText: 'Wall Squat Hold',
    description: 'Hold a wall squat position for as long as comfortable',
    videoId: VIDEO_IDS['wall-squat-demo'],
    validation: { required: true, min: 0, max: 300 },
    scoreDimension: 'strength',
    isActive: true,
  },
  {
    id: QUESTION_IDS['squat-rating'],
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
  {
    id: QUESTION_IDS['pushup-assessment'],
    slug: 'pushup-assessment',
    type: 'video-response',
    questionText: 'Modified Push-up Test',
    description: 'Perform as many modified push-ups as you can with good form',
    videoId: VIDEO_IDS['modified-pushup-demo'],
    validation: { required: true, min: 0, max: 100 },
    scoreDimension: 'strength',
    isActive: true,
  },
  {
    id: QUESTION_IDS['pushup-count'],
    slug: 'pushup-count',
    type: 'numeric',
    questionText: 'How many modified push-ups did you complete?',
    validation: { required: true, min: 0, max: 50 },
    scoreDimension: 'strength',
    isActive: true,
  },
  {
    id: QUESTION_IDS['strength-comfort'],
    slug: 'strength-comfort',
    type: 'scale',
    questionText: 'How comfortable did you feel during the strength exercises?',
    description: 'On a scale of 1 (very uncomfortable) to 10 (very comfortable)',
    validation: { required: false, min: 1, max: 10 },
    scoreDimension: 'strength',
    isActive: true,
  },
];

/**
 * Balance assessment questions
 * Tests to measure stability and balance in different positions
 */
const balanceAssessmentQuestions: NewQuestion[] = [
  {
    id: QUESTION_IDS['single-leg-stand'],
    slug: 'single-leg-stand',
    type: 'video-response',
    questionText: 'Single Leg Stand',
    description: 'Stand on one leg for as long as you can safely manage',
    videoId: VIDEO_IDS['single-leg-stand-demo'],
    validation: { required: true, min: 0, max: 300 },
    scoreDimension: 'balance',
    isActive: true,
  },
  {
    id: QUESTION_IDS['single-leg-duration'],
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
  {
    id: QUESTION_IDS['tandem-stand'],
    slug: 'tandem-stand',
    type: 'video-response',
    questionText: 'Tandem Stand',
    description: 'Stand with one foot directly in front of the other, heel to toe',
    videoId: VIDEO_IDS['tandem-stand-demo'],
    validation: { required: true, min: 0, max: 300 },
    scoreDimension: 'balance',
    isActive: true,
  },
  {
    id: QUESTION_IDS['tandem-stability'],
    slug: 'tandem-stability',
    type: 'single-choice',
    questionText: 'How stable did you feel during the tandem stand?',
    options: [
      { value: 'very-unstable', label: 'Very unstable - needed support', score: 1 },
      { value: 'unstable', label: 'Unstable - wobbled significantly', score: 2 },
      { value: 'somewhat-stable', label: 'Somewhat stable - minor wobbles', score: 3 },
      { value: 'very-stable', label: 'Very stable - held position easily', score: 4 },
    ],
    validation: { required: true },
    scoreDimension: 'balance',
    isActive: true,
  },
  {
    id: QUESTION_IDS['balance-confidence'],
    slug: 'balance-confidence',
    type: 'scale',
    questionText: 'How confident do you feel about your balance in daily activities?',
    description: 'On a scale of 1 (not confident) to 10 (very confident)',
    validation: { required: true, min: 1, max: 10 },
    scoreDimension: 'balance',
    isActive: true,
  },
];

/**
 * Back pain general questions
 * Clinical questions about back pain history and characteristics
 * Based on real physiotherapy assessment protocols
 */
const backPainGeneralQuestions: NewQuestion[] = [
  {
    id: QUESTION_IDS['back-pain-duration'],
    slug: 'back-pain-duration',
    type: 'single-choice',
    questionText: 'How long have you been experiencing your current back pain?',
    description: 'Select the option that best describes the duration',
    options: [
      { value: 'less-1-week', label: 'Less than 1 week', score: 1 },
      { value: '1-2-weeks', label: '1-2 weeks', score: 2 },
      { value: '2-4-weeks', label: '2-4 weeks', score: 3 },
      { value: '4-12-weeks', label: '4-12 weeks', score: 4 },
      { value: 'over-12-weeks', label: 'More than 12 weeks', score: 5 },
    ],
    validation: { required: true },
    scoreDimension: 'pain',
    isActive: true,
  },
  {
    id: QUESTION_IDS['back-pain-intensity'],
    slug: 'back-pain-intensity',
    type: 'scale',
    questionText: 'On average, how would you rate your back pain intensity?',
    description:
      'On a scale of 0 (no pain) to 10 (worst pain imaginable). Think about your typical pain level over the past week.',
    validation: { required: true, min: 0, max: 10 },
    scoreDimension: 'pain',
    isActive: true,
  },
  {
    id: QUESTION_IDS['back-pain-type'],
    slug: 'back-pain-type',
    type: 'single-choice',
    questionText: 'How would you best describe your back pain?',
    description: 'Select the description that most closely matches your experience',
    options: [
      { value: 'sharp-shooting', label: 'Sharp or shooting pain', score: 4 },
      { value: 'dull-aching', label: 'Dull or aching pain', score: 2 },
      { value: 'only-when-moving', label: 'Pain only when moving', score: 1 },
      { value: 'constant-intense', label: 'Constant and intense pain', score: 5 },
    ],
    validation: { required: true },
    scoreDimension: 'pain',
    isActive: true,
  },
  {
    id: QUESTION_IDS['back-pain-recurrence'],
    slug: 'back-pain-recurrence',
    type: 'single-choice',
    questionText: 'How many times has your back pain recurred in the last 3 years?',
    description: 'Include any episodes of significant back pain',
    options: [
      { value: 'never', label: 'This is the first time', score: 1 },
      { value: 'once', label: '1 previous episode', score: 2 },
      { value: '2-5-times', label: '2-5 times', score: 3 },
      { value: 'over-5-times', label: 'More than 5 times', score: 4 },
    ],
    validation: { required: true },
    scoreDimension: 'pain',
    isActive: true,
  },
  {
    id: QUESTION_IDS['back-pain-typical-duration'],
    slug: 'back-pain-typical-duration',
    type: 'single-choice',
    questionText: 'When you have had back pain before, how long did it typically last?',
    description: 'Select the duration that best matches your experience',
    options: [
      { value: 'few-days', label: 'A few days', score: 1 },
      { value: '1-2-weeks', label: '1-2 weeks', score: 2 },
      { value: '3-6-weeks', label: '3-6 weeks', score: 3 },
      { value: '7-12-weeks', label: '7-12 weeks', score: 4 },
      { value: 'over-12-weeks', label: 'More than 12 weeks', score: 5 },
      { value: 'not-applicable', label: 'Not applicable (first episode)', score: 0 },
    ],
    validation: { required: true },
    scoreDimension: 'pain',
    isActive: true,
  },
];

/**
 * Red flag screening questions
 * Critical clinical questions to identify conditions requiring medical review
 * Any "yes" answer triggers a medical warning before proceeding with exercise
 *
 * These questions are based on standard physiotherapy red flag screening protocols.
 * All questions use yes/no format with score: 0 for no, 10 for yes (triggers warning threshold)
 */
const redFlagScreeningQuestions: NewQuestion[] = [
  {
    id: QUESTION_IDS['radiating-pain'],
    slug: 'radiating-pain',
    type: 'single-choice',
    questionText: 'Does your back pain radiate (travel) down your leg below the knee?',
    description:
      'Pain that travels from your back down into your leg may indicate nerve involvement',
    options: [
      { value: 'no', label: 'No', score: 0 },
      { value: 'yes', label: 'Yes', score: 10 },
    ],
    validation: { required: true },
    scoreDimension: 'pain',
    isActive: true,
  },
  {
    id: QUESTION_IDS['numbness-tingling'],
    slug: 'numbness-tingling',
    type: 'single-choice',
    questionText: 'Do you experience pins and needles, numbness, or tingling in your feet or legs?',
    description: 'These sensations may indicate nerve involvement',
    options: [
      { value: 'no', label: 'No', score: 0 },
      { value: 'yes', label: 'Yes', score: 10 },
    ],
    validation: { required: true },
    scoreDimension: 'pain',
    isActive: true,
  },
  {
    id: QUESTION_IDS['incontinence'],
    slug: 'incontinence',
    type: 'single-choice',
    questionText:
      'Have you experienced any difficulty controlling your bladder or bowel (incontinence)?',
    description: 'This is an important symptom that requires immediate medical attention',
    options: [
      { value: 'no', label: 'No', score: 0 },
      { value: 'yes', label: 'Yes', score: 10 },
    ],
    validation: { required: true },
    scoreDimension: 'pain',
    isActive: true,
  },
  {
    id: QUESTION_IDS['saddle-numbness'],
    slug: 'saddle-numbness',
    type: 'single-choice',
    questionText:
      'Do you have any numbness around your genital area or inner thighs (saddle area)?',
    description: 'This is an important symptom that requires immediate medical attention',
    options: [
      { value: 'no', label: 'No', score: 0 },
      { value: 'yes', label: 'Yes', score: 10 },
    ],
    validation: { required: true },
    scoreDimension: 'pain',
    isActive: true,
  },
  {
    id: QUESTION_IDS['unexplained-weight-loss'],
    slug: 'unexplained-weight-loss',
    type: 'single-choice',
    questionText:
      'Have you experienced unexplained weight loss of more than 10% of your body weight?',
    description: 'Unexplained weight loss alongside back pain may require investigation',
    options: [
      { value: 'no', label: 'No', score: 0 },
      { value: 'yes', label: 'Yes', score: 10 },
    ],
    validation: { required: true },
    scoreDimension: 'pain',
    isActive: true,
  },
  {
    id: QUESTION_IDS['night-sweats'],
    slug: 'night-sweats',
    type: 'single-choice',
    questionText: 'Have you been experiencing night sweats or fever alongside your back pain?',
    description: 'These symptoms alongside back pain may require further investigation',
    options: [
      { value: 'no', label: 'No', score: 0 },
      { value: 'yes', label: 'Yes', score: 10 },
    ],
    validation: { required: true },
    scoreDimension: 'pain',
    isActive: true,
  },
];

/**
 * All default questions to seed
 */
const DEFAULT_QUESTIONS: NewQuestion[] = [
  ...preAssessmentQuestions,
  ...strengthAssessmentQuestions,
  ...balanceAssessmentQuestions,
  ...backPainGeneralQuestions,
  ...redFlagScreeningQuestions,
];

/**
 * Seeds questions for MVP.
 *
 * This seed is IDEMPOTENT - safe to run multiple times.
 * Questions are upserted by ID (existing questions are skipped).
 *
 * Note: questions table has NO RLS, so no special context needed.
 *
 * @param db - Database client with schema
 * @returns Promise<number> - Number of questions created (0 if all existed)
 */
export const seedQuestions = async (
  db: NodePgDatabase<typeof schema> & { $client: Pool }
): Promise<number> => {
  logger.info('Seeding questions...');

  let createdCount = 0;

  for (const question of DEFAULT_QUESTIONS) {
    // Check if question already exists (idempotency check by ID)
    const existingQuestion = await db.query.questions.findFirst({
      where: eq(questions.id, question.id!),
    });

    if (existingQuestion) {
      logger.warn(`Question already exists: "${question.slug}"`);
      continue;
    }

    // Insert new question
    const [newQuestion] = await db.insert(questions).values(question).returning({
      id: questions.id,
      slug: questions.slug,
      type: questions.type,
    });

    logger.info('Question created', {
      slug: newQuestion.slug,
      id: newQuestion.id,
      type: newQuestion.type,
    });

    createdCount++;
  }

  logger.info('Questions seed complete', {
    created: createdCount,
    alreadyExisted: DEFAULT_QUESTIONS.length - createdCount,
  });

  return createdCount;
};
