# Flow-Level Scoring Refactor

**Status**: Planned
**Priority**: High (blocks FFP-133 completion)
**Discovered**: 8th January 2026 (during FFP-191)
**Related Tickets**: FFP-133, FFP-191

---

## Problem Statement

The current scoring architecture assumes **one template = one scoring job**, but assessment flows use **multiple templates** (pre-assessment, strength, balance), each with independent scoring configs and programme mappings.

### Current State

```
assessment_templates (each has scoringConfig)
├── pre-assessment-questions → dimensions: pain, general → programme: gentle-mobility
├── strength-assessment → dimensions: strength → programme: beginner-strength
└── balance-assessment → dimensions: balance → programme: balance-foundation

assessment_flows (no scoringConfig)
└── steps[] → references multiple templateIds
```

**Issue**: When a user completes a flow, which template's programme mapping wins? We need ONE holistic programme recommendation considering ALL dimensions.

### Target State

```
assessment_templates (questions only, no scoringConfig)
├── pre-assessment-questions → questions: pain-level, goal-primary, etc.
├── strength-assessment → questions: squat-rating, pushup-count, etc.
└── balance-assessment → questions: single-leg-duration, etc.

assessment_flows (owns scoringConfig)
└── scoringConfig:
    ├── dimensions: [pain, general, strength, balance] (references questions across templates)
    └── programMappings: (considers ALL dimensions for ONE recommendation)
```

---

## Implementation Plan

### Session Structure

This refactor is broken into **4 independent work sessions** plus a coordination document. Each session can be run by Claude Code independently.

| Session | Focus                      | Est. Time | Dependencies |
| ------- | -------------------------- | --------- | ------------ |
| 1       | Schema & Migration         | 1 hour    | None         |
| 2       | Seed Data Updates          | 0.5 hours | Session 1    |
| 3       | Handler & Service Refactor | 1 hour    | Session 2    |
| 4       | Testing & Verification     | 0.5 hours | Session 3    |

**Total estimated**: ~3 hours

---

## Session 1: Schema & Migration

**Goal**: Add `scoringConfig` to `assessment_flows`, remove from `assessment_templates`

### Tasks

1. **Update `assessment_flows` schema**
   - File: `packages/database/src/schema/assessment-flows.ts`
   - Add: `scoringConfig: jsonb('scoring_config').$type<ScoringConfig>()`
   - Import `ScoringConfig` type from shared types

2. **Update `assessment_templates` schema**
   - File: `packages/database/src/schema/assessment-templates.ts`
   - Keep `scoringConfig` column but make nullable (backwards compatibility)
   - Add comment: "Deprecated: Use assessment_flows.scoringConfig instead"

3. **Generate migration**

   ```bash
   cd packages/database && pnpm db:generate
   ```

4. **Review generated SQL**
   - Should add `scoring_config` column to `assessment_flows`
   - Should NOT drop column from `assessment_templates` (data preservation)

5. **Run migration**

   ```bash
   pnpm db:migrate
   ```

6. **Update TypeScript types**
   - Ensure `ScoringConfig` type is exported from `@ffp/database`
   - Update any type imports in `@ffp/core`

### Verification

```bash
pnpm typecheck && pnpm lint
```

### Deliverables

- [ ] Migration file created and applied
- [ ] Schema types updated
- [ ] No TypeScript errors

---

## Session 2: Seed Data Updates

**Goal**: Move scoring config from templates to flow, update seed scripts

### Tasks

1. **Create combined scoring config**
   - File: `packages/database/seed/seedAssessmentFlows.ts`
   - Add `FLOW_SCORING_CONFIG` constant that combines:
     - All dimensions from all templates (pain, general, strength, balance)
     - Unified programme mappings considering all dimensions

2. **Design combined programme mappings**

   ```typescript
   const FLOW_SCORING_CONFIG: ScoringConfig = {
     dimensions: [
       {
         name: 'pain',
         weight: 1,
         maxScore: 17,
         questionIds: ['pain-level', 'pain-location'],
         riskThresholds: { low: 3, moderate: 6 },
       },
       {
         name: 'general',
         weight: 1,
         maxScore: 6,
         questionIds: ['goal-primary', 'activity-level', 'medical-conditions'],
       },
       {
         name: 'strength',
         weight: 1.5,
         maxScore: 64,
         questionIds: ['squat-rating', 'pushup-count', 'strength-comfort'],
         riskThresholds: { low: 20, moderate: 40 },
       },
       {
         name: 'balance',
         weight: 1.2,
         maxScore: 18,
         questionIds: ['single-leg-duration', 'tandem-stability', 'balance-confidence'],
         riskThresholds: { low: 6, moderate: 12 },
       },
     ],
     programMappings: [
       // High pain takes priority - gentle programme
       {
         priority: 1,
         conditions: [{ dimension: 'pain', operator: 'gte', value: 7 }],
         programTemplateId: 'gentle-mobility-programme',
       },
       // Low strength + low balance - foundation programme
       {
         priority: 2,
         conditions: [
           { dimension: 'strength', operator: 'lt', value: 20 },
           { dimension: 'balance', operator: 'lt', value: 6 },
         ],
         logicalOperator: 'and',
         programTemplateId: 'foundation-programme',
       },
       // Good overall - strength focus
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

3. **Update flow seed to include scoring config**
   - Add `scoringConfig: FLOW_SCORING_CONFIG` to flow insert

4. **Update template seeds (optional cleanup)**
   - File: `packages/database/seed/seedAssessmentTemplates.ts`
   - Option A: Remove `scoringConfig` from templates (cleaner)
   - Option B: Keep but add deprecation comment (safer for rollback)
   - Recommend: Option B for MVP

5. **Re-run seeds**
   ```bash
   cd packages/database && pnpm db:seed
   ```

### Verification

```bash
# Check flow has scoring config
psql -d ffp_dev -c "SELECT id, name, scoring_config IS NOT NULL as has_config FROM assessment_flows;"
```

### Deliverables

- [ ] Flow seed updated with combined scoring config
- [ ] Seeds run successfully
- [ ] Database contains flow-level scoring config

---

## Session 3: Handler & Service Refactor

**Goal**: Update `processScoreAssessment` to use flow's scoring config

### Tasks

1. **Update job payload interface**
   - File: `packages/core/src/jobs/handlers/score-assessment.handler.ts`
   - Change from `{ userAssessmentId, templateId }` to `{ userAssessmentId, flowId }`

   ```typescript
   export interface ScoreAssessmentJobPayload {
     userAssessmentId: string;
     flowId: string; // Changed from templateId
   }
   ```

2. **Update handler logic**

   ```typescript
   export async function processScoreAssessment(
     payload: ScoreAssessmentJobPayload,
     tenantId: string
   ): Promise<ScoreAssessmentResult> {
     return await withRLS(db, tenantId, undefined, async (tx) => {
       // Fetch flow (has scoringConfig)
       const flow = await findFlowById(tx, payload.flowId);
       if (!flow?.scoringConfig) {
         throw new ValidationError(`Flow ${payload.flowId} has no scoring config`);
       }

       // Fetch ALL questions for ALL templates in flow
       const templateIds = flow.steps
         .filter(step => step.templateId)
         .map(step => step.templateId);
       const questions = await findQuestionsByTemplateIds(tx, templateIds);

       // Fetch answers (unchanged)
       const answerRecords = await tx
         .select()
         .from(userAssessmentAnswers)
         .where(eq(userAssessmentAnswers.userAssessmentId, payload.userAssessmentId));

       // Score using flow's config
       const scoringResult = calculateScores(responses, questions, flow.scoringConfig);

       // Update assessment (unchanged)
       await tx.update(userAssessments)...

       return toJobResult(scoringResult);
     });
   }
   ```

3. **Add flow repository function**
   - File: `packages/core/src/assessments/flow.repository.ts`
   - Add `findById(db, flowId)` if not exists

4. **Add question repository function**
   - File: `packages/core/src/questions/question.repository.ts`
   - Add `findByTemplateIds(db, templateIds: string[])` for batch fetch

5. **Update job enqueue (submit assessment)**
   - File: `packages/core/src/assessments/assessment.service.ts`
   - When enqueueing `score_assessment` job, pass `flowId` instead of `templateId`
   - The `flowId` is already on `user_assessments` record

6. **Update job schema**
   - File: `packages/core/src/schemas/job.schema.ts`
   - Update `scoreAssessmentPayloadSchema` to use `flowId`

### Verification

```bash
pnpm typecheck && pnpm lint && pnpm test
```

### Deliverables

- [ ] Handler uses flowId and flow's scoringConfig
- [ ] Questions fetched from all templates in flow
- [ ] Job enqueue updated to pass flowId
- [ ] All type checks pass

---

## Session 4: Testing & Verification

**Goal**: Verify end-to-end scoring works with flow-level config

### Tasks

1. **Update unit tests**
   - File: `packages/core/src/jobs/handlers/score-assessment.handler.test.ts` (if exists)
   - Update mocks to use flowId
   - Test with multi-template flow

2. **Manual E2E test via Postman**
   - Start assessment (creates user_assessment with flowId)
   - Save progress (answers for questions across all templates)
   - Submit assessment (enqueues score_assessment job)
   - Poll job status until complete
   - Verify scores include all dimensions (pain, general, strength, balance)
   - Verify single programme recommendation

3. **Update Postman collection**
   - File: `postman/FFP.postman_collection.json`
   - Ensure submit payload doesn't require templateId
   - Add example response showing combined scores

4. **Run full test suite**

   ```bash
   pnpm test
   ```

5. **Update documentation**
   - Update `project-state.md` to mark refactor complete
   - Update any architecture docs if needed

### Verification Checklist

- [ ] Unit tests pass
- [ ] Manual E2E test succeeds
- [ ] All 4 dimensions appear in scores
- [ ] Single programme recommendation returned
- [ ] Postman collection updated

---

## Rollback Plan

If issues arise:

1. **Schema**: `scoring_config` on flows is additive, templates still have their configs
2. **Handler**: Can revert to templateId-based approach
3. **Seeds**: Can re-run original seeds to restore template configs

---

## Future Considerations

After this refactor:

1. **Body-part-specific scoring** (post-MVP enhancement) integrates cleanly
   - Flow's scoringConfig can include answer-based conditions
   - See: `project-documentation/post-mvp-enhancements/body-part-specific-scoring.md`

2. **Template reusability**
   - Templates become pure question containers
   - Same template can be used in different flows with different scoring strategies

3. **A/B testing flows**
   - Different flows can have different programme mappings
   - Same questions, different scoring approaches

---

## Files Modified

| File                                                          | Change                        |
| ------------------------------------------------------------- | ----------------------------- |
| `packages/database/src/schema/assessment-flows.ts`            | Add scoringConfig column      |
| `packages/database/src/schema/assessment-templates.ts`        | Deprecation comment           |
| `packages/database/seed/seedAssessmentFlows.ts`               | Add combined scoring config   |
| `packages/core/src/jobs/handlers/score-assessment.handler.ts` | Use flowId, fetch flow config |
| `packages/core/src/assessments/flow.repository.ts`            | Add findById                  |
| `packages/core/src/questions/question.repository.ts`          | Add findByTemplateIds         |
| `packages/core/src/assessments/assessment.service.ts`         | Pass flowId to job            |
| `packages/core/src/schemas/job.schema.ts`                     | Update payload schema         |

---

## Session Coordination

When starting each session, reference this document:

```
Continue the flow-level scoring refactor.
Read: project-documentation/refactoring/flow-level-scoring-refactor.md
Start Session [N] tasks.
```

After completing each session, update the checkboxes in this document and commit.
