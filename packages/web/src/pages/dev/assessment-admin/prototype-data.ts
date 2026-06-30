/**
 * In-memory mock catalogue for the assessment-admin prototype.
 *
 * Populated from Hanan's first-draft question set (Employee Exercise Assessment
 * Flow — see .claude/local/plans/epics/assessment-management). The seven source
 * questions are reproduced faithfully; Q1 (demographics) is split into a gender
 * and an age question, since the prototype has no dedicated demographics type.
 *
 * Level scoring follows the confirmed model (see prototype-level-model.ts): the
 * three activity answers set a base level by a modal tally (mostly lower → Level
 * 1, mixed → Level 2, mostly higher → Level 3), and under-40s are bumped up one
 * level (capped at Level 3). Age is therefore a scored input, not just profiling.
 * Throwaway, no DB.
 */
import type {
  LevelScenario,
  ProgrammeTemplateOption,
  PrototypeFlow,
  PrototypeQuestion,
  PrototypeTemplate,
} from './prototype-types';

export const INITIAL_QUESTIONS: PrototypeQuestion[] = [
  // Q1 (demographics) — split into two unscored profiling questions.
  {
    id: 'q-demographics-gender',
    publicId: 'qdemogender1',
    slug: 'demographics-gender',
    type: 'single-choice',
    questionText: 'Which best describes you?',
    description: 'Used to personalise your experience — it does not affect your programme level.',
    options: [
      { value: 'female', label: 'Female' },
      { value: 'male', label: 'Male' },
      { value: 'prefer_not', label: 'Prefer not to say' },
    ],
    validation: { required: true },
    scoreDimension: null,
    isActive: true,
  },
  {
    id: 'q-demographics-age',
    publicId: 'qdemogage001',
    slug: 'demographics-age',
    type: 'single-choice',
    questionText: 'Which age bracket are you in?',
    description:
      'Scored: under-40s start one level higher, since they generally tolerate a touch more intensity.',
    scoringNote: 'affects level (age bump)',
    options: [
      { value: 'under_20', label: 'Under 20' },
      { value: '20_30', label: '20–30' },
      { value: '31_40', label: '31–40' },
      { value: '41_45', label: '41–45' },
      { value: '46_55', label: '46–55' },
      { value: '56_65', label: '56–65' },
      { value: 'over_65', label: '65+' },
    ],
    validation: { required: true },
    scoreDimension: null,
    isActive: true,
  },
  // Q2 — weekly physical activity (A/B/C → 1/2/3). Feeds the readiness tally.
  {
    id: 'q-weekly-activity',
    publicId: 'qweekact0001',
    slug: 'weekly-activity',
    type: 'single-choice',
    questionText: 'How would you describe your typical weekly physical activity?',
    options: [
      {
        value: 'low',
        label: 'Low — I mostly sit during the day and mainly walk for exercise.',
        score: 1,
      },
      {
        value: 'moderate',
        label: 'Moderate — light cycling, yoga/pilates, or occasional workouts (1–2 times a week).',
        score: 2,
      },
      {
        value: 'active',
        label:
          'Active — I exercise regularly (3+ times a week) or play intense sport like football or rugby.',
        score: 3,
      },
    ],
    validation: { required: true },
    scoreDimension: 'general', // "Activity & readiness" in the UI
    isActive: true,
  },
  // Q3 — exercise tolerance (A/B/C → 1/2/3).
  {
    id: 'q-exercise-tolerance',
    publicId: 'qexertol0001',
    slug: 'exercise-tolerance',
    type: 'single-choice',
    questionText: 'How would you describe your exercise tolerance?',
    options: [
      {
        value: 'low',
        label: 'Low — light exercise like walks, but not much more intense than that.',
        score: 1,
      },
      {
        value: 'moderate',
        label: 'Moderate — I could manage jogging, pilates or light gym sessions.',
        score: 2,
      },
      {
        value: 'high',
        label: 'High — runs, sport and gym sessions, and I can manage a high heart rate.',
        score: 3,
      },
    ],
    validation: { required: true },
    scoreDimension: 'general',
    isActive: true,
  },
  // Q4 — how joints and muscles feel (A/B/C → 1/2/3).
  {
    id: 'q-movement-comfort',
    publicId: 'qmovecomf001',
    slug: 'movement-comfort',
    type: 'single-choice',
    questionText: 'How do your joints and muscles generally feel when you move or stretch?',
    options: [
      {
        value: 'stiff',
        label: 'I frequently feel stiff, tight, or have mild, nagging aches that make me cautious.',
        score: 1,
      },
      {
        value: 'occasional',
        label: 'I get occasional stiffness after a long day at the desk, but I move fairly easily.',
        score: 2,
      },
      {
        value: 'flexible',
        label: 'I feel flexible, strong, and comfortable doing a wide range of movements.',
        score: 3,
      },
    ],
    validation: { required: true },
    scoreDimension: 'general',
    isActive: true,
  },
  // Q5 — main goal for the session. Shapes programme theme, not the readiness level → unscored.
  {
    id: 'q-session-goal',
    publicId: 'qsessgoal001',
    slug: 'session-goal',
    type: 'single-choice',
    questionText: "What is your main goal for today's session?",
    description: 'Steers the focus of your session. Choose one.',
    options: [
      { value: 'relieve', label: 'Relieve tension & stiffness — great for long desk sessions' },
      { value: 'strength', label: 'Build strength & stability — great for physical resilience' },
      { value: 'energy', label: 'Boost energy & get moving — great for a midday refresh' },
    ],
    validation: { required: true },
    scoreDimension: null,
    isActive: true,
  },
  // Q6 — body areas to focus on (select up to 2). Content targeting → unscored.
  // NOTE: "max 2 selections" is carried as validation.max; the prototype has no
  // first-class max-selections rule (flagged in the validation note).
  {
    id: 'q-focus-areas',
    publicId: 'qfocusarea02',
    slug: 'focus-areas',
    type: 'multi-choice',
    questionText: 'Which areas of the body would you like to focus on?',
    description: 'Select up to 2.',
    options: [
      { value: 'neck_shoulders', label: 'Neck & shoulders — easing typing tightness' },
      { value: 'back_core', label: 'Lower back & core — supporting sitting posture' },
      { value: 'hips_lower', label: 'Hips & lower body — opening tight glutes and hip flexors' },
      { value: 'full_body', label: 'Full body refresh — a balanced mix of everything' },
    ],
    validation: { required: true, max: 2 },
    scoreDimension: null,
    isActive: true,
  },
  // Q7 — safety red-flag screen (select all that apply). Not scored — drives a safety gate.
  {
    id: 'q-safety-screen',
    publicId: 'qsafety00001',
    slug: 'safety-screen',
    type: 'multi-choice',
    questionText:
      'To keep things safe and tailored to you, have you recently experienced any of the following?',
    description:
      'Select all that apply. Choosing any of the first three prompts advice to check with a health professional before starting.',
    options: [
      {
        value: 'chest_pain',
        label: 'Sudden chest pain or shortness of breath during mild activity',
      },
      { value: 'dizziness', label: 'Unexplained dizziness, fainting, or loss of balance' },
      {
        value: 'sharp_pain',
        label: 'Severe, sharp, or constant joint/muscle pain that wakes you at night',
      },
      { value: 'none', label: 'None of the above' },
    ],
    validation: { required: true },
    scoreDimension: null,
    isActive: true,
  },
];

export const INITIAL_TEMPLATES: PrototypeTemplate[] = [
  {
    id: 't-about-you',
    publicId: 'taboutyou001',
    name: 'About you',
    questionIds: [
      'q-demographics-gender',
      'q-demographics-age',
      'q-weekly-activity',
      'q-exercise-tolerance',
      'q-movement-comfort',
    ],
  },
  {
    id: 't-goals-safety',
    publicId: 'tgoalsafe001',
    name: 'Goals & safety check',
    questionIds: ['q-session-goal', 'q-focus-areas', 'q-safety-screen'],
  },
];

export const INITIAL_FLOWS: PrototypeFlow[] = [
  {
    id: 'f-exercise-assessment',
    publicId: 'fexerassess1',
    name: 'Employee exercise assessment',
    description: "Hanan's first-draft onboarding assessment — tailors a starting level and focus.",
    isActive: true,
    steps: [
      {
        id: 's-intro',
        order: 1,
        type: 'intro',
        config: {
          title: 'Welcome',
          description: 'A few questions to tailor your session.',
          estimatedMinutes: 1,
        },
        ruleCount: 0,
      },
      {
        id: 's-about-you',
        order: 2,
        type: 'questions',
        templateId: 't-about-you',
        config: { title: 'About you', estimatedMinutes: 2 },
        ruleCount: 0,
      },
      {
        id: 's-goals-safety',
        order: 3,
        type: 'questions',
        templateId: 't-goals-safety',
        config: {
          title: 'Your goals & safety check',
          description: 'Goals, focus areas, and a quick safety screen.',
          estimatedMinutes: 2,
        },
        // The red-flag safety gate (advise a health professional if any of the
        // first three options are picked) — surfaced read-only in this prototype.
        ruleCount: 1,
      },
      {
        id: 's-results',
        order: 4,
        type: 'results',
        config: { title: 'Your results' },
        ruleCount: 0,
      },
      {
        id: 's-programme',
        order: 5,
        type: 'programme-overview',
        config: { title: 'Your programme' },
        ruleCount: 0,
      },
    ],
    scoringConfig: {
      // A single readiness dimension approximates Hanan's "mostly A/B/C" tally:
      // each of the three A/B/C questions scores 1/2/3, summed to a raw 3–9.
      // maxScore = 3 + 3 + 3 = 9.
      dimensions: [
        {
          name: 'general', // "Activity & readiness" in the UI
          questionIds: ['q-weekly-activity', 'q-exercise-tolerance', 'q-movement-comfort'],
          maxScore: 9,
          weight: 1,
          // riskThresholds band the normalised 0–100 score for the band chip.
          riskThresholds: { low: 78, moderate: 45 },
        },
      ],
      // Mapping conditions compare the RAW dimension score. Lowest priority wins.
      // raw ≤ 4 → Level 1 · raw ≥ 8 → Level 3 · otherwise (5–7) → Level 2.
      programmeMappings: [
        {
          conditions: [{ dimension: 'general', operator: 'lte', value: 4 }],
          programmeTemplateId: 'level-1-gentle-mobility',
          priority: 1,
        },
        {
          conditions: [{ dimension: 'general', operator: 'gte', value: 8 }],
          programmeTemplateId: 'level-3-energized-dynamic',
          priority: 2,
        },
        {
          conditions: [{ dimension: 'general', operator: 'gte', value: 5 }],
          programmeTemplateId: 'level-2-active-wellness',
          priority: 3,
        },
      ],
    },
  },
  {
    id: 'f-reassessment',
    publicId: 'freassess001',
    name: 'Quick re-check',
    description: 'A shorter check-in flow — still in draft.',
    isActive: false,
    steps: [
      {
        id: 's-re-intro',
        order: 1,
        type: 'intro',
        config: { title: 'Welcome back' },
        ruleCount: 0,
      },
      {
        id: 's-re-questions',
        order: 2,
        type: 'questions',
        templateId: 't-about-you',
        config: { title: 'How have things changed?', estimatedMinutes: 2 },
        ruleCount: 0,
      },
    ],
    scoringConfig: { dimensions: [], programmeMappings: [] },
  },
];

/** Programme templates available to the scoring picker (slugs match seed convention) */
export const PROGRAMME_TEMPLATE_OPTIONS: ProgrammeTemplateOption[] = [
  { slug: 'level-1-gentle-mobility', name: 'Level 1 — Gentle / Mobility Focus' },
  { slug: 'level-2-active-wellness', name: 'Level 2 — Active Wellness / Moderate' },
  { slug: 'level-3-energized-dynamic', name: 'Level 3 — Energized / Dynamic' },
  { slug: 'default-wellbeing', name: 'Default Wellbeing (fallback)' },
];

/**
 * Named answer scenarios, by user type, that exercise each level outcome. Used as a
 * dropdown in the scenario runner to check the questions produce the right level —
 * pick one, then amend any answer to feel the boundaries (e.g. the under-40 bump).
 * In the real product these would be generated per flow from its own questions.
 */
export const LEVEL_SCENARIOS: LevelScenario[] = [
  {
    id: 'lower-older',
    label: 'Mostly lower · older (40+)',
    expectation: 'Expected: Level 1',
    answers: {
      'q-weekly-activity': 'low',
      'q-exercise-tolerance': 'low',
      'q-movement-comfort': 'stiff',
      'q-demographics-age': '46_55',
    },
  },
  {
    id: 'lower-younger',
    label: 'Mostly lower · younger (under 40)',
    expectation: 'Expected: Level 2 (under-40 bump)',
    answers: {
      'q-weekly-activity': 'low',
      'q-exercise-tolerance': 'low',
      'q-movement-comfort': 'stiff',
      'q-demographics-age': '20_30',
    },
  },
  {
    id: 'mixed-older',
    label: 'Mixed · older (40+)',
    expectation: 'Expected: Level 2',
    answers: {
      'q-weekly-activity': 'low',
      'q-exercise-tolerance': 'moderate',
      'q-movement-comfort': 'flexible',
      'q-demographics-age': '46_55',
    },
  },
  {
    id: 'mixed-younger',
    label: 'Mixed · younger (under 40)',
    expectation: 'Expected: Level 3 (under-40 bump)',
    answers: {
      'q-weekly-activity': 'low',
      'q-exercise-tolerance': 'moderate',
      'q-movement-comfort': 'flexible',
      'q-demographics-age': '31_40',
    },
  },
  {
    id: 'higher-older',
    label: 'Mostly higher · older (40+)',
    expectation: 'Expected: Level 3',
    answers: {
      'q-weekly-activity': 'active',
      'q-exercise-tolerance': 'high',
      'q-movement-comfort': 'flexible',
      'q-demographics-age': '56_65',
    },
  },
  {
    id: 'higher-younger',
    label: 'Mostly higher · younger (under 40)',
    expectation: 'Expected: Level 3 (capped)',
    answers: {
      'q-weekly-activity': 'active',
      'q-exercise-tolerance': 'high',
      'q-movement-comfort': 'flexible',
      'q-demographics-age': '20_30',
    },
  },
];
