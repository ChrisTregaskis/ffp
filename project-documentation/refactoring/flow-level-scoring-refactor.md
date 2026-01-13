# Flow-Level Scoring & Template Branching Refactor

**Status**: Planned
**Priority**: High (blocks FFP-133 completion)
**Discovered**: 8th January 2026 (during FFP-191)
**Updated**: 11th January 2026 (founder meeting insights)
**Related Tickets**: FFP-133, FFP-191

---

## Impact Assessment: Template-Level Branching

### Background

Following a founder meeting on 10th January 2026, we identified the need for **template-level branching** - where a template's outcome/score determines the next step (another template, warning message, or programme recommendation). This is in addition to the existing need for flow-level scoring.

### Real-World Examples from Founder

**Back Pain Flow:**

_Set 1 - General Assessment:_

- Duration, intensity (0-10 scale), pain type, recurrence history, typical duration
- Combined answers determine which template(s) follow next

_Set 2 - Red Flag Screening (yes/no questions):_

- Radiating pain, numbness, incontinence, weight loss, night sweats
- Single path forward, but red flag answers trigger warning: "seek medical review before exercise"

**Body Part Selection:**

- Prerequisite question: "Where are you feeling pain?" with body part options
- Selecting "shoulder" leads to shoulder-specific questions
- Selecting "back" leads to back-specific questions (decision tree pattern)

### Key Insight

Branching happens at the **template level**, not individual questions. A template's collective score/outcome determines the next step.

### Current vs. Required Capabilities

| Capability                        | Current Design             | Requirement |
| --------------------------------- | -------------------------- | ----------- |
| Linear question sequences         | ✅ Supported               | ✅ Keep     |
| Multiple templates per flow       | ✅ Supported               | ✅ Keep     |
| Flow-level scoring                | 🔄 Planned (this refactor) | ✅ Keep     |
| **Template-level branching**      | ❌ Not supported           | ⚠️ **NEW**  |
| **Conditional warnings/messages** | ❌ Not supported           | ⚠️ **NEW**  |
| **Aggregate-based next step**     | ❌ Not supported           | ⚠️ **NEW**  |

---

## Problem Statement

### Issue 1: Scoring Location (Original)

The current scoring architecture assumes **one template = one scoring job**, but assessment flows use **multiple templates** (pre-assessment, strength, balance), each with independent scoring configs and programme mappings.

**Issue**: When a user completes a flow, which template's programme mapping wins? We need ONE holistic programme recommendation considering ALL dimensions.

### Issue 2: Linear Step Execution (New)

Current `steps` JSONB structure executes steps linearly by `order`. No mechanism exists for "if template X scores > Y, go to step Z instead of step Z+1".

### Issue 3: JSONB Complexity (New)

The `assessment_flows.steps` JSONB field is becoming complex:

- order, type, templateId, config
- Now needs: nextStepRules (with conditions and actions)

This warrants **normalisation to a dedicated table** for:

- Proper FK relationships (templateId → assessment_templates)
- Better queryability and debugging
- Cleaner extension for branching rules
- Referential integrity enforcement

---

## Target Architecture

### Current State

```
assessment_templates (each has scoringConfig)
├── pre-assessment-questions → dimensions: pain, general
├── strength-assessment → dimensions: strength
└── balance-assessment → dimensions: balance

assessment_flows (no scoringConfig, steps as JSONB)
└── steps[] → linear execution by order
```

### Target State

```
assessment_templates (questions only, NO scoringConfig)
├── pre-assessment-questions → questions only
├── strength-assessment → questions only
└── balance-assessment → questions only

assessment_flows (owns scoringConfig)
└── scoringConfig → combined dimensions + programme mappings

flow_steps (NEW normalised table)
├── flow_id FK → assessment_flows
├── template_id FK → assessment_templates (nullable)
├── order, type, config
└── next_step_rules JSONB → branching conditions
```

---

## Schema Design: flow_steps Table

### Key Design Decision: Step ID vs Order for Branching

**Problem**: Branching creates parallel paths where multiple steps occupy the same logical "tier":

```
Step 1: "Where is your pain?" (prerequisite)
   ├── Answer: "back"     → goto back-assessment step
   ├── Answer: "shoulder" → goto shoulder-assessment step
   └── Answer: "leg"      → goto leg-assessment step

All three assessment steps are logically "tier 2" but are different templates.
Each then leads to their respective "tier 3" follow-up steps.
```

**Solution**:

- `order` becomes a **tier/level indicator** (NOT unique per flow)
- Branching uses `targetStepId` (UUID) for explicit routing
- Multiple steps can share the same order (parallel branches at same tier)
- Default progression: use `defaultNextStepId` or fall back to first step at order + 1

### Table Definition

```typescript
export const flowSteps = pgTable(
  'flow_steps',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    flowId: uuid('flow_id')
      .notNull()
      .references(() => assessmentFlows.id, { onDelete: 'cascade' }),
    templateId: uuid('template_id').references(() => assessmentTemplates.id, {
      onDelete: 'restrict',
    }),

    // Order = tier/level indicator, NOT unique (parallel branches share order)
    order: integer('order').notNull(),

    type: flowStepTypeEnum('type').notNull(),
    config: jsonb('config').$type<StepConfig>().notNull(),
    nextStepRules: jsonb('next_step_rules').$type<NextStepRule[]>(),

    // Default next step for linear progression (when no rules match)
    // If null, defaults to "first active step at order + 1"
    defaultNextStepId: uuid('default_next_step_id'),

    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [
    index('idx_flow_steps_flow_id').on(table.flowId),
    index('idx_flow_steps_order').on(table.flowId, table.order),
    // NOTE: No unique constraint on (flow_id, order) - parallel branches share order
  ]
);
```

### Branching Types

```typescript
interface NextStepRule {
  priority: number; // Lower = higher priority
  conditions: BranchCondition[]; // All must match (AND logic)
  action: BranchAction;
}

interface BranchCondition {
  type: 'dimension_score' | 'answer_value' | 'aggregate';

  // For dimension_score: "If strength score < 4..."
  dimension?: ScoreDimension;
  operator: 'lt' | 'lte' | 'gt' | 'gte' | 'eq';
  value?: number;

  // For answer_value: "If pain-location = 'shoulder'..."
  questionSlug?: string;
  answerValue?: string | string[];
}

interface BranchAction {
  type: 'goto_step' | 'show_warning' | 'end_assessment';

  // For goto_step - uses step UUID for explicit routing
  targetStepId?: string;

  // For show_warning
  warningMessage?: string;
  warningType?: 'info' | 'caution' | 'seek_medical';
  continueAfterWarning?: boolean;

  // For end_assessment
  earlyTerminationReason?: string;
}
```

### Step Navigation Logic

```typescript
function resolveNextStep(
  currentStep: FlowStep,
  allSteps: FlowStep[],
  context: BranchContext
): string | null {
  // 1. Evaluate branching rules (highest priority first)
  for (const rule of sortByPriority(currentStep.nextStepRules)) {
    if (evaluateConditions(rule.conditions, context)) {
      if (rule.action.type === 'goto_step') {
        return rule.action.targetStepId; // UUID of target step
      }
      // Handle warnings, end_assessment...
    }
  }

  // 2. Use explicit default if set
  if (currentStep.defaultNextStepId) {
    return currentStep.defaultNextStepId;
  }

  // 3. Fall back to first active step at order + 1
  const nextTierSteps = allSteps
    .filter((s) => s.order === currentStep.order + 1 && s.isActive)
    .sort((a, b) => a.id.localeCompare(b.id)); // Deterministic ordering

  return nextTierSteps[0]?.id ?? null; // null = end of flow
}
```

### Example: Red Flag Screening

```typescript
// Step IDs (deterministic for testing)
const STEP_IDS = {
  RED_FLAG_SCREENING: '55555555-5555-5555-5555-555555550003',
  RESULTS: '55555555-5555-5555-5555-555555550006',
};

{
  id: STEP_IDS.RED_FLAG_SCREENING,
  flowId: FLOW_IDS.DEFAULT,
  templateId: TEMPLATE_IDS.RED_FLAG_SCREENING,
  order: 3,
  type: 'questions',
  config: { title: 'Health Screening' },
  nextStepRules: [
    {
      priority: 1,
      conditions: [
        { type: 'answer_value', questionSlug: 'radiating-pain', answerValue: 'yes' }
      ],
      action: {
        type: 'show_warning',
        warningMessage: 'Please seek medical review before starting exercise',
        warningType: 'seek_medical',
        continueAfterWarning: true  // User can still proceed
      }
    }
  ],
  defaultNextStepId: STEP_IDS.RESULTS,  // Default progression
}
```

### Example: Body Part Branching

```typescript
// Step IDs for parallel branches (all at order: 2)
const STEP_IDS = {
  PAIN_LOCATION: '55555555-5555-5555-5555-555555550001',
  BACK_ASSESSMENT: '55555555-5555-5555-5555-555555550010',
  SHOULDER_ASSESSMENT: '55555555-5555-5555-5555-555555550011',
  LEG_ASSESSMENT: '55555555-5555-5555-5555-555555550012',
};

// Prerequisite step
{
  id: STEP_IDS.PAIN_LOCATION,
  flowId: FLOW_IDS.DEFAULT,
  templateId: TEMPLATE_IDS.PAIN_LOCATION,
  order: 1,
  type: 'questions',
  config: { title: 'Where is your pain?' },
  nextStepRules: [
    {
      priority: 1,
      conditions: [
        { type: 'answer_value', questionSlug: 'pain-location', answerValue: 'shoulder' }
      ],
      action: { type: 'goto_step', targetStepId: STEP_IDS.SHOULDER_ASSESSMENT }
    },
    {
      priority: 2,
      conditions: [
        { type: 'answer_value', questionSlug: 'pain-location', answerValue: 'back' }
      ],
      action: { type: 'goto_step', targetStepId: STEP_IDS.BACK_ASSESSMENT }
    },
    {
      priority: 3,
      conditions: [
        { type: 'answer_value', questionSlug: 'pain-location', answerValue: 'leg' }
      ],
      action: { type: 'goto_step', targetStepId: STEP_IDS.LEG_ASSESSMENT }
    }
  ],
  // No defaultNextStepId - must match a rule (or fails validation)
}

// Parallel branch steps (all at order: 2)
{ id: STEP_IDS.BACK_ASSESSMENT, order: 2, templateId: TEMPLATE_IDS.BACK_QUESTIONS, ... }
{ id: STEP_IDS.SHOULDER_ASSESSMENT, order: 2, templateId: TEMPLATE_IDS.SHOULDER_QUESTIONS, ... }
{ id: STEP_IDS.LEG_ASSESSMENT, order: 2, templateId: TEMPLATE_IDS.LEG_QUESTIONS, ... }
```

---

## Implementation Plan

### Session Structure (Updated)

| Session | Focus                                        | Est. Time | Dependencies |
| ------- | -------------------------------------------- | --------- | ------------ |
| 1       | Schema Migration: scoringConfig to flows     | 1 hour    | None         |
| 2       | Schema Migration: Normalise flow_steps table | 1.5 hours | Session 1    |
| 3       | Seed Data Migration                          | 1 hour    | Session 2    |
| 4       | Handler & Service Refactor (scoring)         | 1 hour    | Session 3    |
| 5       | Branching Logic + Clinical Questions         | 3 hours   | Session 4    |
| 6       | Testing & Postman Updates                    | 1 hour    | Session 5    |
| 6b      | Handler Integration (Branching Wire-up)      | 1.5 hours | Session 6    |
| 7       | Documentation Updates                        | 1 hour    | Session 6b   |

**Total estimated**: ~11 hours (includes real clinical questions for demo)

---

## Session 1: Schema Migration - scoringConfig to Flows

**Goal**: Add `scoringConfig` to `assessment_flows`, deprecate on `assessment_templates`

### Tasks

1. **Update `assessment_flows` schema**
   - File: `packages/database/src/schema/assessment-flows.ts`
   - Add: `scoringConfig: jsonb('scoring_config').$type<ScoringConfig>()`
   - Import `ScoringConfig` type from shared types

2. **Update `assessment_templates` schema**
   - File: `packages/database/src/schema/assessment-templates.ts`
   - Keep `scoringConfig` column but make nullable (backwards compatibility)
   - Add comment: "Deprecated: Use assessment_flows.scoringConfig instead"

3. **Generate and apply migration**

   ```bash
   cd packages/database && pnpm db:generate && pnpm db:migrate
   ```

4. **Update TypeScript types**
   - Ensure `ScoringConfig` type is exported from `@ffp/database`

### Verification

```bash
pnpm typecheck && pnpm lint
```

### Deliverables

- [ ] Migration file created and applied
- [ ] Schema types updated
- [ ] No TypeScript errors

---

## Session 2: Schema Migration - Normalise flow_steps Table

**Goal**: Create `flow_steps` table, migrate data from JSONB

### Tasks

1. **Create flow_steps schema**
   - File: `packages/database/src/schema/flow-steps.ts`
   - Define table with FK relationships
   - Add `flowStepTypeEnum` if not exists
   - Export types and Zod schemas

2. **Create NextStepRule types**
   - File: `packages/database/src/constants/branching.constants.ts`
   - Define `NextStepRule`, `BranchCondition`, `BranchAction` interfaces
   - Define `BranchConditionType`, `BranchActionType` enums

3. **Update schema index**
   - File: `packages/database/src/schema/index.ts`
   - Export flowSteps table and relations

4. **Generate migration**

   ```bash
   cd packages/database && pnpm db:generate
   ```

5. **Create data migration script**
   - File: `packages/database/migrations/manual/migrate-steps-to-table.ts`
   - Read existing `assessment_flows.steps` JSONB
   - Insert into `flow_steps` table
   - This runs AFTER schema migration

6. **Update assessment_flows schema**
   - Mark `steps` column as deprecated (keep for rollback)
   - Add relation to `flowSteps`

### Migration SQL Preview

```sql
-- Create enum for step types (if not exists)
CREATE TYPE flow_step_type AS ENUM (
  'intro', 'questions', 'transition',
  'video-assessment', 'results', 'programme-overview'
);

-- Create flow_steps table
CREATE TABLE flow_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  flow_id UUID NOT NULL REFERENCES assessment_flows(id) ON DELETE CASCADE,
  template_id UUID REFERENCES assessment_templates(id) ON DELETE RESTRICT,
  "order" INTEGER NOT NULL,
  type flow_step_type NOT NULL,
  config JSONB NOT NULL,
  next_step_rules JSONB,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Indexes
CREATE INDEX idx_flow_steps_flow_id ON flow_steps(flow_id);
CREATE INDEX idx_flow_steps_order ON flow_steps(flow_id, "order");

-- Data migration (run separately)
INSERT INTO flow_steps (flow_id, template_id, "order", type, config)
SELECT
  f.id as flow_id,
  (step->>'templateId')::UUID as template_id,
  (step->>'order')::INTEGER as "order",
  (step->>'type')::flow_step_type as type,
  step->'config' as config
FROM assessment_flows f,
LATERAL jsonb_array_elements(f.steps) AS step;
```

### Verification

```bash
pnpm typecheck && pnpm lint
psql -d ffp_dev -c "SELECT COUNT(*) FROM flow_steps;"
```

### Deliverables

- [ ] flow_steps table created
- [ ] Data migrated from JSONB
- [ ] FK relationships enforced
- [ ] TypeScript types updated

---

## Session 3: Seed Data Migration

**Goal**: Update seed scripts to use new schema, create combined scoring config

### Current Seed State

| File                         | Current Behaviour                | Required Change                 |
| ---------------------------- | -------------------------------- | ------------------------------- |
| `seedAssessmentTemplates.ts` | Has `scoringConfig` per template | Remove scoringConfig            |
| `seedAssessmentFlows.ts`     | Has `steps` JSONB                | Add scoringConfig, remove steps |
| (new) `seedFlowSteps.ts`     | N/A                              | Insert normalised steps         |

### Tasks

1. **Create combined scoring config**
   - File: `packages/database/seed/seedAssessmentFlows.ts`
   - Add `FLOW_SCORING_CONFIG` constant combining all dimensions

   ```typescript
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
       // High pain takes priority
       {
         priority: 1,
         conditions: [{ dimension: 'pain', operator: 'gte', value: 7 }],
         programTemplateId: 'gentle-mobility-programme',
       },
       // Low strength + low balance
       {
         priority: 2,
         conditions: [
           { dimension: 'strength', operator: 'lt', value: 20 },
           { dimension: 'balance', operator: 'lt', value: 6 },
         ],
         logicalOperator: 'and',
         programTemplateId: 'foundation-programme',
       },
       // Good overall
       {
         priority: 3,
         conditions: [
           { dimension: 'pain', operator: 'lt', value: 3 },
           { dimension: 'strength', operator: 'gte', value: 40 },
         ],
         logicalOperator: 'and',
         programTemplateId: 'advanced-strength-programme',
       },
       // Default fallback
       { priority: 10, conditions: [], programTemplateId: 'general-wellness-programme' },
     ],
   };
   ```

2. **Create seedFlowSteps.ts**
   - File: `packages/database/seed/seedFlowSteps.ts`
   - Insert 7 default steps with deterministic IDs
   - Export `STEP_IDS` for testing

3. **Update seedAssessmentTemplates.ts**
   - Remove `scoringConfig` from template definitions
   - Add deprecation comment

4. **Update seedAssessmentFlows.ts**
   - Remove `steps` from insert
   - Add `scoringConfig: FLOW_SCORING_CONFIG`

5. **Update seed orchestrator**
   - File: `packages/database/seed/index.ts`
   - Add `seedFlowSteps` after `seedAssessmentFlows`
   - Ensure correct execution order

6. **Run seeds**
   ```bash
   cd packages/database && pnpm db:seed
   ```

### Verification

```sql
-- Check flow has scoring config
SELECT id, name, scoring_config IS NOT NULL as has_config
FROM assessment_flows;

-- Check steps are normalised
SELECT fs.order, fs.type, at.name as template_name
FROM flow_steps fs
LEFT JOIN assessment_templates at ON fs.template_id = at.id
WHERE fs.flow_id = '44444444-4444-4444-4444-444444440001'
ORDER BY fs.order;

-- Check templates no longer have scoring config (or it's null)
SELECT id, name, scoring_config IS NULL as config_removed
FROM assessment_templates;
```

### Deliverables

- [ ] Flow seed updated with combined scoring config
- [ ] Steps seeded to flow_steps table
- [ ] Template scoring configs removed/deprecated
- [ ] Seeds run successfully

---

## Session 4: Handler & Service Refactor (Scoring)

**Goal**: Update `processScoreAssessment` to use flow's scoring config and normalised steps

Note: scoring.service.ts and helpers require no changes - they're already generic. Only the handler and repository layer need updates to fetch from flow instead of template.

### Tasks

1. **Update job payload interface**
   - File: `packages/core/src/jobs/handlers/score-assessment.handler.ts`
   - Change from `{ userAssessmentId, templateId }` to `{ userAssessmentId, flowId }`

2. **Update handler logic**

   ```typescript
   export async function processScoreAssessment(
     payload: ScoreAssessmentJobPayload,
     tenantId: string
   ): Promise<ScoreAssessmentResult> {
     return await withRLS(db, tenantId, undefined, async (tx) => {
       // Fetch flow with scoringConfig
       const flow = await findFlowById(tx, payload.flowId);
       if (!flow?.scoringConfig) {
         throw new ValidationError(`Flow ${payload.flowId} has no scoring config`);
       }

       // Fetch ALL steps for flow (normalised table)
       const steps = await findStepsByFlowId(tx, payload.flowId);

       // Get template IDs from steps
       const templateIds = steps
         .filter(step => step.templateId)
         .map(step => step.templateId);

       // Fetch questions from all templates
       const questions = await findQuestionsByTemplateIds(tx, templateIds);

       // Fetch answers
       const answerRecords = await tx
         .select()
         .from(userAssessmentAnswers)
         .where(eq(userAssessmentAnswers.userAssessmentId, payload.userAssessmentId));

       // Score using flow's config
       const scoringResult = calculateScores(responses, questions, flow.scoringConfig);

       // Update assessment
       await tx.update(userAssessments)...

       return toJobResult(scoringResult);
     });
   }
   ```

3. **Add flow repository functions**
   - File: `packages/core/src/assessments/flow.repository.ts`
   - Add `findById(db, flowId)` with scoringConfig
   - Add `findStepsByFlowId(db, flowId)` for normalised steps

4. **Add question repository function**
   - File: `packages/core/src/questions/question.repository.ts`
   - Add `findByTemplateIds(db, templateIds: string[])` for batch fetch

5. **Update job enqueue**
   - File: `packages/core/src/assessments/assessment.service.ts`
   - Pass `flowId` instead of `templateId`

6. **Update job schema**
   - File: `packages/core/src/schemas/job.schema.ts`
   - Update `scoreAssessmentPayloadSchema` to use `flowId`

### Verification

```bash
pnpm typecheck && pnpm lint && pnpm test
```

### Deliverables

- [ ] Handler uses flowId and flow's scoringConfig
- [ ] Steps fetched from normalised table
- [ ] Questions fetched from all templates in flow
- [ ] All type checks pass

---

## Session 5: Branching Logic + Clinical Questions

**Goal**: Implement `evaluateNextStep()` logic for conditional navigation AND add real clinical questions for a meaningful demo.

**Related Ticket**: [FFP-249](https://ctregaskis.atlassian.net/browse/FFP-249) - Add real clinical assessment questions to seed data

### Design Decisions

**Step targeting**: Uses `targetStepId` (UUID) not order, because parallel branches share the same order tier.

**Warnings storage**: Store on `user_assessments.warnings_shown` as JSONB array for MVP simplicity. Warnings are few per assessment (unlike answers). Can extract to separate table later if analytics needs grow.

**Clinical questions**: Red flag screening is the perfect use case for `show_warning` branching - any "yes" answer triggers a medical review warning.

### Tasks

#### Part A: Clinical Questions (~1.5 hours)

1. **Add back pain questions to seedQuestions.ts**
   - File: `packages/database/seed/seedQuestions.ts`
   - Add 5 back pain general questions:
     - Duration of pain (less than 1 week, 1-2 weeks, 2-4 weeks, 4-12 weeks, 12+ weeks)
     - Pain intensity (0-10 scale)
     - Type of pain (sharp shooting, dull aching, only when moving, constant intense)
     - Recurrence history (0, 1, 2-5, 5+ times in last 3 years)
     - Typical duration (few days, 1-2 weeks, 3-6 weeks, 7-12 weeks, 12+ weeks, N/A)
   - Add 6 red flag screening questions (yes/no):
     - Radiating pain to leg
     - Pins & needles/numbness in feet or legs
     - Incontinence/inability to go to toilet
     - Genital/saddle area numbness
     - Unexplained weight loss (10%+)
     - Night sweats

2. **Create red flag screening template**
   - File: `packages/database/seed/seedAssessmentTemplates.ts`
   - Add `RED_FLAG_SCREENING` template linking to the 6 yes/no questions

3. **Update flow steps with red flag screening**
   - File: `packages/database/seed/seedFlowSteps.ts`
   - Add red flag screening step after pre-assessment (order: 3)
   - Shift subsequent steps (transition → 4, strength → 5, etc.)
   - Add `nextStepRules` to red flag step:
     ```typescript
     nextStepRules: [
       {
         priority: 1,
         conditions: [{ type: 'answer_value', questionSlug: 'radiating-pain', answerValue: 'yes' }],
         action: {
           type: 'show_warning',
           warningMessage: 'Please seek medical review before starting exercise programme',
           warningType: 'seek_medical',
           continueAfterWarning: true,
         },
       },
       // Similar rules for other red flags...
     ];
     ```

4. **Update scoring config with back pain dimensions**
   - File: `packages/database/seed/seedAssessmentFlows.ts`
   - Update pain dimension to use new back pain questions

#### Part B: Branching Logic (~1.5 hours)

5. **Create branch evaluator service**
   - File: `packages/core/src/assessments/branching/branch-evaluator.service.ts`

   ```typescript
   export interface BranchEvaluationContext {
     currentStepId: string;
     allSteps: FlowStep[];
     answers: Map<string, AnswerValue>;
     dimensionScores?: Map<ScoreDimension, number>;
   }

   export interface BranchEvaluationResult {
     nextStepId: string | null; // null = end of flow
     warnings: Warning[];
     shouldTerminate: boolean;
     terminationReason?: string;
   }

   export function evaluateNextStep(
     currentStep: FlowStep,
     context: BranchEvaluationContext
   ): BranchEvaluationResult {
     const warnings: Warning[] = [];

     if (!currentStep.nextStepRules?.length) {
       return {
         nextStepId: resolveDefaultNextStep(currentStep, context.allSteps),
         warnings: [],
         shouldTerminate: false,
       };
     }

     // Sort rules by priority (lower = higher priority)
     const sortedRules = [...currentStep.nextStepRules].sort((a, b) => a.priority - b.priority);

     for (const rule of sortedRules) {
       if (evaluateConditions(rule.conditions, context)) {
         switch (rule.action.type) {
           case 'goto_step':
             return {
               nextStepId: rule.action.targetStepId!,
               warnings,
               shouldTerminate: false,
             };

           case 'show_warning':
             warnings.push({
               message: rule.action.warningMessage!,
               type: rule.action.warningType!,
               shownAt: new Date().toISOString(),
             });
             if (!rule.action.continueAfterWarning) {
               return {
                 nextStepId: null,
                 warnings,
                 shouldTerminate: true,
                 terminationReason: rule.action.warningMessage,
               };
             }
             // Continue evaluating other rules after warning
             break;

           case 'end_assessment':
             return {
               nextStepId: null,
               warnings,
               shouldTerminate: true,
               terminationReason: rule.action.earlyTerminationReason,
             };
         }
       }
     }

     // No rule matched - use default progression
     return {
       nextStepId: resolveDefaultNextStep(currentStep, context.allSteps),
       warnings,
       shouldTerminate: false,
     };
   }

   function resolveDefaultNextStep(currentStep: FlowStep, allSteps: FlowStep[]): string | null {
     // 1. Use explicit default if set
     if (currentStep.defaultNextStepId) {
       return currentStep.defaultNextStepId;
     }

     // 2. Fall back to first active step at order + 1
     const nextTierSteps = allSteps
       .filter((s) => s.order === currentStep.order + 1 && s.isActive)
       .sort((a, b) => a.id.localeCompare(b.id)); // Deterministic

     return nextTierSteps[0]?.id ?? null;
   }
   ```

6. **Create condition evaluators**
   - File: `packages/core/src/assessments/branching/condition-evaluator.ts`

   ```typescript
   export function evaluateConditions(
     conditions: BranchCondition[],
     context: BranchEvaluationContext
   ): boolean {
     // All conditions must match (AND logic)
     return conditions.every((condition) => evaluateCondition(condition, context));
   }

   function evaluateCondition(
     condition: BranchCondition,
     context: BranchEvaluationContext
   ): boolean {
     switch (condition.type) {
       case 'answer_value':
         return evaluateAnswerCondition(condition, context.answers);
       case 'dimension_score':
         return evaluateDimensionCondition(condition, context.dimensionScores);
       case 'aggregate':
         return evaluateAggregateCondition(condition, context);
       default:
         return false;
     }
   }
   ```

7. **Update save-progress handler**
   - File: `packages/functions/src/assessments/save-progress.ts`
   - After saving answers, evaluate branching rules
   - Return `nextStepId` and any warnings in response

8. **Update user_assessments table**
   - Add `visited_step_ids` JSONB array for path tracking (UUIDs of visited steps)
   - Add `warnings_shown` JSONB array for audit (with timestamps)

   ```typescript
   // In user-assessments.ts schema
   visitedStepIds: jsonb('visited_step_ids').$type<string[]>().default([]),
   warningsShown: jsonb('warnings_shown').$type<Warning[]>().default([]),
   ```

9. **Add warning schema**
   - File: `packages/core/src/schemas/warning.schema.ts`

   ```typescript
   export const warningSchema = z.object({
     message: z.string(),
     type: z.enum(['info', 'caution', 'seek_medical']),
     shownAt: z.string().datetime(),
     stepId: z.string().uuid().optional(),
   });

   export type Warning = z.infer<typeof warningSchema>;
   ```

### Verification

```bash
pnpm typecheck && pnpm lint && pnpm test
```

### Deliverables

#### Clinical Questions (Part A)

- [ ] Back pain general questions added (5 questions)
- [ ] Red flag screening questions added (6 yes/no questions)
- [ ] Red flag screening template created
- [ ] Flow steps updated with red flag screening step
- [ ] Scoring config updated with back pain dimensions
- [ ] Seeds run successfully

#### Branching Logic (Part B)

- [ ] Branch evaluator service implemented
- [ ] Condition evaluators for all types
- [ ] save-progress returns branching result
- [ ] User assessment tracks visited path
- [ ] Unit tests for branching logic

---

## Session 6: Testing & Postman Updates

**Goal**: Verify end-to-end scoring and branching works

### Postman Collection Updates

**File**: `postman/FFP-API-Collection.postman_collection.json`

1. **Update Start Assessment response schema**
   - Add `steps` array (from normalised table)
   - Each step includes `nextStepRules` preview

2. **Update Save Progress request/response**
   - Response now includes:
     ```json
     {
       "saved": true,
       "nextStepId": "55555555-5555-5555-5555-555555550004",
       "warnings": [
         {
           "message": "Please seek medical review before starting exercise",
           "type": "seek_medical",
           "shownAt": "2026-01-11T10:30:00.000Z"
         }
       ],
       "shouldTerminate": false
     }
     ```

3. **Add branching test scenarios**
   - Test: Linear progression (no rules)
   - Test: Answer-based branching
   - Test: Warning display
   - Test: Early termination

4. **Update environment variables**
   - File: `postman/FFP-Dev-Environment.postman_environment.json`
   - Verify `testFlowId` still valid: `44444444-4444-4444-4444-444444440001`

### Unit Test Updates

1. **Scoring service tests**
   - Test flow-level scoring with combined dimensions
   - Test programme mapping priority

2. **Branching service tests**
   - Test answer-based conditions
   - Test dimension score conditions
   - Test warning accumulation
   - Test early termination

3. **Integration tests**
   - E2E flow: start → progress → branch → complete

### Manual E2E Test Checklist

- [ ] Start assessment returns normalised steps with IDs
- [ ] Save progress evaluates branching rules
- [ ] `nextStepId` returned correctly for branching
- [ ] Warnings returned when conditions match (with timestamps)
- [ ] `goto_step` routes to correct step by UUID
- [ ] Parallel branches (same order) work correctly
- [ ] Submit assessment uses flow's scoringConfig
- [ ] All 4 dimensions appear in final scores
- [ ] Single programme recommendation returned
- [ ] `visited_step_ids` tracks actual path taken
- [ ] `warnings_shown` persisted on user_assessment

_note:_ please provide user with manual test instructions once work complete.

### Deliverables

- [ ] Postman collection updated
- [ ] Unit tests pass
- [ ] Manual E2E test succeeds

---

## Session 7: Documentation Updates

**Goal**: Update project documentation to reflect new architecture

### Tasks

1. **Update assessment-engine.md**
   - Add "Template-Level Branching" section with concept explanation
   - Update data model diagrams to include `flow_steps` table
   - Add branching examples (red flags, body part routing)
   - Update API endpoint response schemas
   - Document warning system behaviour

2. **Update database-schema.md**
   - Add `flow_steps` table definition and relationships
   - Update `assessment_flows` (add scoringConfig, note steps deprecation)
   - Update `user_assessments` (add visitedStepIds, warningsShown)
   - Update ERD if present

3. **Update architecture.md** (if needed)
   - Add branching evaluator to service layer diagram
   - Update assessment flow diagrams to show branching paths

4. **Update project-state.md**
   - Mark this refactor as complete
   - Update "Current State" section
   - Note any follow-up work identified

5. **Update progress-log.md**
   - Add entry summarising flow-level scoring + branching refactor
   - Include key decisions made (stepId vs order, JSONB warnings, etc.)

### Verification

Review each updated document for accuracy and consistency.

### Review Context

Replace in full and prepare .claude/review-context.md ready for a final review of all work on this branch.

### Deliverables

- [ ] assessment-engine.md updated with branching concepts
- [ ] database-schema.md updated with new tables/columns
- [ ] architecture.md updated (if applicable)
- [ ] project-state.md updated
- [ ] progress-log.md updated
- [ ] .claude/review-context.md ready for review

---

## Files Modified Summary

| File                                                          | Change                                            |
| ------------------------------------------------------------- | ------------------------------------------------- |
| `packages/database/src/schema/assessment-flows.ts`            | Add scoringConfig, deprecate steps                |
| `packages/database/src/schema/assessment-templates.ts`        | Deprecate scoringConfig                           |
| `packages/database/src/schema/flow-steps.ts`                  | **NEW** normalised steps table                    |
| `packages/database/src/schema/user-assessments.ts`            | Add visitedStepIds, warningsShown JSONB           |
| `packages/database/src/constants/branching.constants.ts`      | **NEW** branching types                           |
| `packages/database/seed/seedQuestions.ts`                     | Add back pain + red flag screening questions      |
| `packages/database/seed/seedAssessmentFlows.ts`               | Add combined scoring config, back pain dimensions |
| `packages/database/seed/seedAssessmentTemplates.ts`           | Remove scoringConfig, add RED_FLAG_SCREENING      |
| `packages/database/seed/seedFlowSteps.ts`                     | **NEW** seed normalised steps + branching rules   |
| `packages/core/src/assessments/flow.repository.ts`            | Add findById, findStepsByFlowId                   |
| `packages/core/src/assessments/branching/`                    | **NEW** branch-evaluator, condition-evaluator     |
| `packages/core/src/questions/question.repository.ts`          | Add findByTemplateIds                             |
| `packages/core/src/jobs/handlers/score-assessment.handler.ts` | Use flowId, flow config                           |
| `packages/core/src/assessments/assessment.service.ts`         | Pass flowId to job                                |
| `packages/core/src/schemas/job.schema.ts`                     | Update payload schema                             |
| `packages/core/src/schemas/warning.schema.ts`                 | **NEW** warning types                             |
| `packages/functions/src/assessments/save-progress.ts`         | Evaluate branching, return nextStepId + warnings  |
| `postman/FFP-API-Collection.postman_collection.json`          | Update schemas, add branching tests               |
| `project-documentation/assessment-engine.md`                  | Add branching concepts, update diagrams           |
| `project-documentation/database-schema.md`                    | Add flow_steps, update schema definitions         |
| `project-documentation/architecture.md`                       | Update service layer diagrams (if needed)         |
| `project-documentation/project-state.md`                      | Mark refactor complete                            |
| `project-documentation/progress-log.md`                       | Add refactor summary entry                        |

---

## Rollback Plan

If issues arise:

1. **Schema**: All changes are additive (new columns, new table)
   - `assessment_flows.steps` JSONB preserved
   - `assessment_templates.scoringConfig` preserved

2. **Handler**: Can revert to templateId-based approach

3. **Seeds**: Can re-run original seeds to restore template configs

4. **flow_steps table**: Can drop if needed, data preserved in JSONB

---

## Future Considerations

After this refactor:

1. **Body-part-specific flows**
   - Create separate flows for shoulder, back, knee, etc.
   - Use branching to route to correct flow

2. **Template reusability**
   - Templates become pure question containers
   - Same template can be used in different flows

3. **A/B testing flows**
   - Different flows with different branching strategies
   - Same questions, different routing

4. **Visual flow builder** (Post-MVP)
   - Drag-and-drop step configuration
   - Preview branching paths

---

## Session Coordination

When starting each session, reference this document:

```
Continue the flow-level scoring refactor.
Read: project-documentation/refactoring/flow-level-scoring-refactor.md
Start Session [N] tasks.
```

After completing each session, update the checkboxes and commit.

---

## Impact on FFP-2 EPIC

| Story                      | Impact    | Notes                                         |
| -------------------------- | --------- | --------------------------------------------- |
| Create assessment template | ⚪ None   | Templates unchanged (just questions)          |
| Update assessment template | ⚪ None   | Templates unchanged                           |
| Delete assessment template | ⚪ None   | Templates unchanged                           |
| Create assessment flow     | 🟡 Medium | Must support scoringConfig + normalised steps |
| Update assessment flow     | 🟡 Medium | Handle step + branching updates               |
| Start assessment           | 🟡 Medium | Return normalised steps                       |
| Save progress              | 🟡 Medium | Evaluate branching rules                      |
| Submit assessment          | ⚪ Low    | Flow-level scoring unchanged                  |
