# FFP - Progress Log

Detailed session-by-session history for Sprint 1 execution.

**For current status, see `project-state.md`**

---

## Recent Sessions (Detailed)

### January 19, 2026 (Session 88 - FFP-126 Manual Testing & Completion)

**Status**: ✅ FFP-126 COMPLETE

**Branch**: `feature/ffp-126-assessment-template-admin-api`

**Summary**: Manual testing of assessment template admin API, bug fixes discovered during testing, and story completion.

**Key Deliverables**:

- **Manual Testing Guide**: `project-documentation/refactoring/testing/manual-testing-guide-template-admin-api.md`
- **6 API Endpoints**: List, Get, Create, Update, Deactivate, Duplicate templates
- **New Jira Story**: FFP-251 (Template Question Management API) - identified gap during testing

**Bugs Fixed During Testing**:

| Issue                  | Description                                        | Fix                                                           |
| ---------------------- | -------------------------------------------------- | ------------------------------------------------------------- |
| TC-05 Validation Error | `scoringConfig` required but not provided          | Removed deprecated field (separate session via prompt)        |
| TC-05 FK Constraint    | `createdBy` used Cognito sub instead of DB user ID | Changed to use `getUserIdFromContext()` for proper resolution |

**Test Results** (All Passed):

| Test  | Description              | Status |
| ----- | ------------------------ | ------ |
| TC-01 | List all templates       | ✓ Pass |
| TC-02 | List active only         | ✓ Pass |
| TC-03 | Get template w/questions | ✓ Pass |
| TC-04 | 404 for non-existent     | ✓ Pass |
| TC-05 | Create new template      | ✓ Pass |
| TC-06 | 403 for non-admin        | ✓ Pass |
| TC-07 | Update template          | ✓ Pass |
| TC-08 | Duplicate template       | ✓ Pass |
| TC-09 | Deactivate (soft delete) | ✓ Pass |

**Quality Assurance**:

- ✅ 504 tests passing
- ✅ TypeScript/lint clean
- ✅ All CRUD operations verified via Postman

**Sprint 4 Progress**: 18/23 pts (78%) - FFP-135 remaining

---

### January 16-18, 2026 (Sessions 85-87 - FFP-133 Manual Testing & Completion)

**Status**: ✅ FFP-133 COMPLETE

**Branch**: `refactor/flow-level-scoring`

**Summary**: Comprehensive manual testing of the flow-level scoring refactor, fixing TF-002 (submit validation), and completing all FFP-133 sub-tasks.

**Sessions Completed**:

| Session | Focus                                        | Status |
| ------- | -------------------------------------------- | ------ |
| 85      | Manual testing guide creation & linear flow  | ✅     |
| 86      | Branching tests (show_warning, goto_step)    | ✅     |
| 87      | TF-002 fix (visited steps validation) & docs | ✅     |

**Key Deliverables**:

- **Manual Testing Guide**: `project-documentation/refactoring/testing/manual-testing-guide-assessments.md`
- **Testing Results**: `project-documentation/refactoring/testing/handover-testing-complete.md`
- **TF-002 Fix**: Submit API now validates only visited template questions (not all flow questions)

**Test Results** (All Passed):

| Test  | Description                | Key Validation                    |
| ----- | -------------------------- | --------------------------------- |
| TC-01 | Start Assessment           | 9 steps returned, correct format  |
| TC-02 | Pre-Assessment (back path) | Default nextStepId works          |
| TC-03 | Red Flag show_warning      | Warning triggered, flow continues |
| TC-04 | Resume Assessment          | isResumed=true, answers preserved |
| TC-05 | Submit Assessment          | jobId returned after TF-002 fix   |
| TC-06 | goto_step branching        | Conditional navigation works      |
| LF-\* | Linear flow (7 steps)      | Full flow progression verified    |

**Finding Fixed During Testing**:

| ID     | Issue                                                 | Fix                                           |
| ------ | ----------------------------------------------------- | --------------------------------------------- |
| TF-002 | Submit validated ALL questions, not just visited ones | Fetch visited templates from `visitedStepIds` |

**Quality Assurance**:

- ✅ 629 tests passing
- ✅ TypeScript/lint clean
- ✅ All branching actions verified (goto_step, show_warning)
- ✅ Linear and branching flows both work correctly

**Next**: FFP-126 (Assessment Template Admin API) or FFP-135 (Assessment Context & State Mgmt)

---

### January 8-13, 2026 (Sessions 78-84 - Flow-Level Scoring Refactor)

**Status**: ✅ COMPLETE (All 7 sessions)

**Branch**: `refactor/flow-level-scoring`

**Summary**: Major refactoring to support multi-template assessment flows with combined scoring dimensions and conditional branching.

**Sessions Completed**:

| Session | Focus                                       | Status |
| ------- | ------------------------------------------- | ------ |
| 1       | Schema migration (`scoringConfig` to flows) | ✅     |
| 2       | Normalised `flow_steps` table               | ✅     |
| 3       | Seed data migration                         | ✅     |
| 4       | Handler & service refactor                  | ✅     |
| 5       | Branching logic & clinical questions        | ✅     |
| 6/6b    | Testing & deprecation cleanup               | ✅     |
| 7       | Documentation updates                       | ✅     |

**Key Deliverables**:

- **Schema Changes**: `scoringConfig` moved from `assessment_templates` to `assessment_flows`
- **New Table**: `flow_steps` with normalised step definitions and branching rules
- **Clinical Questions**: 11 new questions (5 back pain history + 6 red flag screening)
- **Branching Service**: `branch-evaluator.service.ts` with condition evaluators
- **Warning System**: `warnings_shown` audit trail on `user_assessments`
- **New Columns**: `visitedStepIds`, `warningsShown` on `user_assessments`

**Files Created**:

```
packages/database/src/
├── constants/branching.constants.ts    # NextStepRule, BranchCondition types
├── schema/flow-steps.ts                # Normalised flow_steps table

packages/core/src/
├── assessments/branching/
│   ├── branch-evaluator.service.ts     # Main branching logic
│   ├── condition-evaluator.ts          # Condition evaluation
│   └── index.ts                        # Module exports
├── schemas/warning.schema.ts           # Warning validation

packages/core/tests/branching/
├── condition-evaluator.test.ts         # 27 tests
└── branch-evaluator.test.ts            # 11 tests
```

**Test Coverage**: 629 tests passing (38 new branching tests)

**Documentation Updated**:

- `assessment-engine.md` - Added Template-Level Branching section
- `database-schema.md` - Added flow_steps, updated ERD
- `architecture.md` - Added specialised services reference
- `project-state.md` - Marked refactor complete, unblocked FFP-191

**Session Logs**: `project-documentation/refactoring/log/session-{1-7}.md`

---

### January 7, 2026 (Session 77 - FFP-133 Scoring Service - Sub-tasks 1-3)

**Status**: ✅ FFP-188, FFP-189, FFP-190 Complete (Scoring Pure Functions)

**Branch**: `feature/ffp-133-scoring-service`

**Completed Work**:

**FFP-188: Create `calculateScores()` orchestrator** (~0.5 hours):

- ✅ Created `@ffp/core/src/assessments/scoring/scoring.service.ts`
- ✅ Main orchestrator coordinates dimension scoring, overall score, risk level, programme matching
- ✅ Added `toJobResult()` helper for job result format conversion

**FFP-189: Implement `calculateQuestionScore()` handler** (~0.25 hours):

- ✅ Created `helpers/question-scoring.ts`
- ✅ Handles single-choice, multi-choice, numeric, scale, text question types
- ✅ Removed video-response (deferred to post-MVP)

**FFP-190: Add `calculateRiskLevel()` + `findMatchingProgramme()`** (~0.25 hours):

- ✅ Created `helpers/risk-level.ts` - throws ValidationError on empty scores
- ✅ Created `helpers/programme-matching.ts` - returns null (not undefined) for no match
- ✅ Created `helpers/dimension-scoring.ts` - dimension/overall score calculations

**Refactoring (Code Review)** (~0.5 hours):

- ✅ Moved types to `@ffp/core/src/types/scoring.types.ts`
- ✅ Created `@ffp/core/src/constants/` directory with `scoring.constants.ts`
- ✅ Extracted risk thresholds: `LOW_RISK_THRESHOLD (70)`, `MODERATE_RISK_THRESHOLD (40)`
- ✅ Created operator constants: `LOGICAL_OPERATORS`, `COMPARISON_OPERATORS`
- ✅ Organised scoring module into `scoring/` directory with `helpers/` subdirectory

**New Directory Structure**:

```
packages/core/src/
├── constants/
│   ├── index.ts
│   └── scoring.constants.ts
├── types/
│   └── scoring.types.ts      # RiskLevel, ScoringResult
└── assessments/
    └── scoring/
        ├── index.ts
        ├── scoring.service.ts
        └── helpers/
            ├── index.ts
            ├── question-scoring.ts
            ├── risk-level.ts
            ├── programme-matching.ts
            └── dimension-scoring.ts
```

**Key Decisions**:

| Decision                          | Rationale                                    |
| --------------------------------- | -------------------------------------------- |
| Throw on empty dimensional scores | Configuration error, not "no data"           |
| Return null (not undefined)       | Explicit intentional "no match" vs unplanned |
| Constants for operators           | Type-safe runtime values matching DB types   |
| Separate helpers directory        | Clean separation, easier testing             |

**Quality Assurance**:

- ✅ `pnpm typecheck` - Zero errors
- ✅ `pnpm lint` - Zero warnings

**Next**: FFP-191 - Create `processScoreAssessment` job handler

---

### January 3, 2026 (Session 76 - FFP-130 Questions Table Refactor - Session D)

**Status**: ✅ FFP-130 Questions Table Refactor COMPLETE (All 9 Phases Done)

**Branch**: `feature/ffp-130-submit-assessment-api`

**Completed Work**:

**Phase 8: Modify Existing Schemas (Breaking Changes)** (~0.25 hours):

- ✅ Updated `packages/database/src/schema/assessment-templates.ts`
  - Removed `questions` JSONB column
  - Removed local type definitions (AssessmentQuestion, QuestionType, etc.)
  - Added relation to `templateQuestions` (many relation)
  - Imported ScoringConfig from shared types
- ✅ Updated `packages/database/src/schema/user-assessments.ts`
  - Removed `answers` JSONB column
  - Added relation to `userAssessmentAnswers` (many relation)
- ✅ Generated migration `0010_redundant_tyger_tiger.sql`
- ✅ Ran migration on both `ffp_dev` and `ffp_test` databases

**Phase 9: Test Updates** (~0.5 hours):

- ✅ Updated `packages/core/src/assessments/template.repository.test.ts`
  - Removed `questions` field from test input
  - Updated `questionIds` to use UUID format
  - Changed TRUNCATE to DELETE statements (FK dependencies)
- ✅ Updated `packages/core/src/assessments/user-assessment.repository.test.ts`
  - Removed `expect(result.answers).toEqual({})` assertions

**Key Fix: Database User Permissions Issue**:

The tests were failing with "permission denied for table template_questions" because:

- Vitest config uses `test_user` (hardcoded in `vitest.config.ts`)
- `.env` file defines `DB_USER=app_user`
- Permissions were only granted to `app_user`, not `test_user`

**Resolution**:

1. Granted permissions on new tables to both `test_user` and `app_user`
2. Set up `ALTER DEFAULT PRIVILEGES` for both users so future tables automatically grant permissions
3. Added strategic comments to `vitest.config.ts` and `migrate.ts` documenting this

**Documentation Added**:

- `packages/core/vitest.config.ts` - Comments explaining test_user vs app_user distinction
- `packages/database/scripts/migrate.ts` - Full documentation of database user roles

**Files Modified**:

| File                                                               | Change                                                               |
| ------------------------------------------------------------------ | -------------------------------------------------------------------- |
| `packages/database/src/schema/assessment-templates.ts`             | Removed questions column, local types, added relation                |
| `packages/database/src/schema/user-assessments.ts`                 | Removed answers column, added relation                               |
| `packages/database/src/migrations/apply-rls.ts`                    | Removed incorrect GRANT section (permissions via DEFAULT PRIVILEGES) |
| `packages/core/src/assessments/template.repository.test.ts`        | UUID question IDs, DELETE instead of TRUNCATE                        |
| `packages/core/src/assessments/user-assessment.repository.test.ts` | Removed answers assertions                                           |
| `packages/core/vitest.config.ts`                                   | Added documentation comments                                         |
| `packages/database/scripts/migrate.ts`                             | Added database user roles documentation                              |

**Quality Assurance**:

- ✅ `pnpm build` - All packages build successfully
- ✅ `pnpm typecheck` - Zero TypeScript errors
- ✅ `pnpm test` - 466 tests passing
- ✅ `pnpm lint` - Zero warnings

---

## Recent Sessions (Brief Summary)

### January 2, 2026 (Sessions 73-75 - FFP-130 Phases 1-7)

- ✅ FFP-130 Questions Table Refactor Phases 1-7 complete
- **Phases 1-3**: Created `questions`, `template_questions`, `user_assessment_answers` tables
- **Phases 4-5**: Seed data refactor with deterministic UUIDs, core schema updates
- **Phases 6-7**: Created `question.repository.ts`, `answer.repository.ts`, updated service layer
- New pattern: `configOverrides` for per-template question customisation
- Transaction support added to repositories

### December 30, 2025 (Sessions 71-72 - FFP-130 Complete)

- ✅ FFP-172 Lambda Handler for POST /assessments/{id}/submit
- ✅ FFP-173 Unit Tests (9 tests for submitAssessment flow)
- Updated Postman collection with Submit Assessment endpoint
- Created test instructions document

### December 29, 2025 (Session 70 - FFP-130 Service Layer)

- ✅ FFP-169 Zod schemas for submission request/response
- ✅ FFP-171 `submitAssessment` service with job enqueue
- Transaction pattern: `withRLS` wraps all writes atomically

### December 28, 2025 (Session 69 - FFP-129 Complete)

- ✅ FFP-129 Save Assessment Progress API COMPLETE
- PUT /assessments/{id}/progress endpoint
- Answer merging, step navigation, status transitions

### December 26, 2025 (Sessions 66-68 - FFP-128 Complete)

- ✅ FFP-128 Start Assessment API COMPLETE
- Zod schemas, flow repository, assessment service with resume logic
- Lambda handler, SST route configuration

### December 24, 2025 (Sessions 64-65 - FFP-125/127 Complete)

- ✅ FFP-125 Assessment Flow Schema - 7-step MVP flow, seed script
- ✅ FFP-127 User Assessment Schema - State machine, RLS policies
- 89 new tests (66 schema + 23 repository integration)

### December 12-19, 2025 (Sessions 57-63 - FFP-124/132 Complete)

- ✅ FFP-124 Assessment Template Schema & Repository
- ✅ FFP-132 Job Queue System (FFP-178, 179, 180, 181, 182)
- Job processor with atomic claiming (`FOR UPDATE SKIP LOCKED`)
- Auto-retry with exponential backoff, EventBridge Cron integration

---

## Earlier Sessions (Grouped Summary)

**Sprint 3 - Assessment Engine Foundation (November 24 - December 11, 2025)**:

- FFP-110 Phase 0 Planning - Key decisions: DB templates, DB polling queue
- Navigation System - Role-based SideMenu/MobileMenu, RBAC utilities
- Database Seeding - Automated FORCE RLS management, fresh DB workflow

**Sprint 2 - Web Authentication (November 10-19, 2025)**:

- FFP-16 Web Login Interface COMPLETE (9/9 subtasks)
- FFP-116 First-Time Password Setup, FFP-92 Login Form
- FFP-119 Web Routing & Component Library Foundation
- Client-side Logger, Error Boundary, AuthContext enhancements
- 185 tests passing across monorepo

**Sprint 2 - API Authentication (November 10-15, 2025)**:

- FFP-12 Testing Infrastructure (deferred Playwright/MSW to post-MVP)
- FFP-41 Unit Tests (60 context.ts tests)
- FFP-40 API Gateway Routes, FFP-39 Refresh Token, FFP-38 Login Lambda
- Sessions 45-48: Web foundation (Amplify, AuthContext, routing)

**Sprint 1 - Cognito & Core Services (November 1-9, 2025)**:

- Sessions 29-37: Error handling, context, logging, admin API
- Actor-based context system, structured logging
- Domain-organised architecture established
- 125 tests passing

**Sprint 1 - Database Layer (October 27 - November 1, 2025)**:

- FFP-10 & FFP-11 COMPLETE (46h)
- PostgreSQL schema, RLS policies, Drizzle ORM
- Three-tier architecture (tenant → customer → users)
- 68 comprehensive tests, custom migration runner

**Sprint 1 - Foundation (October 20-26, 2025)**:

- FFP-7 (Monorepo) & FFP-8 (Infrastructure)
- Turborepo with 4 packages, 70+ tests
- SST v3 Ion deployed to AWS

---

## Key Milestones

| Date        | Milestone                          | Hours         |
| ----------- | ---------------------------------- | ------------- |
| Oct 20      | Sprint 1 Started                   | 0h            |
| Oct 24      | FFP-7 Complete (Monorepo)          | 13h           |
| Oct 26      | FFP-8 Complete (Infrastructure)    | 30h           |
| Nov 1       | FFP-10 & FFP-11 Merged to Main     | 83.5h         |
| Nov 9       | FFP-37 Complete (Invite User)      | 136.5h        |
| Nov 19      | FFP-16 Complete (Web Login)        | 155.5h        |
| Dec 19      | FFP-132 Complete (Job Queue)       | 162h          |
| Dec 24      | FFP-127 Complete (User Assess)     | 165.5h        |
| Dec 30      | FFP-130 Complete (Submit API)      | 167.9h        |
| Jan 3       | FFP-130 Refactor Complete          | ~168h         |
| Jan 13      | Flow-Level Scoring Refactor        | ~172h         |
| Jan 18      | FFP-133 Complete (Scoring Service) | ~175h         |
| **Current** | **Sprint 4 - FFP-126 next**        | **~175/197h** |

---

**For current status and next tasks, see `project-state.md`**
