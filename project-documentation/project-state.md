# FFP - Project State

**Last Updated**: 3rd January 2026
**Current EPIC**: FFP-2 - Assessment Engine
**Sprint Status**: Sprint 3 ✅ Complete | Sprint 4 in progress (FFP-130 Questions Table Refactor ✅)
**Previous EPIC**: FFP-1 - Application Setup & Foundation ✅ COMPLETE

---

## Completed: Sprint 3 - Backend Foundation (24 pts + 3 early) ✅

**Status**: ✅ Complete
**Branch**: `feature/sprint3` (merged)

| Key     | Story                                      | Pts | Key Files                                                                    |
| ------- | ------------------------------------------ | --- | ---------------------------------------------------------------------------- |
| FFP-124 | Assessment Template Schema & Repository    | 5   | `schema/assessment-templates.ts`, `assessment-template.repository.ts`        |
| FFP-132 | Process Jobs Schema & Queue Infrastructure | 8   | `schema/process-jobs.ts`, `job-queue.service.ts`, `job-processor.service.ts` |
| FFP-125 | Assessment Flow Schema & Configuration     | 3   | `schema/assessment-flows.ts`, `seedAssessmentFlows.ts`                       |
| FFP-127 | User Assessment Schema & State Machine     | 5   | `schema/user-assessments.ts`, `user-assessment.repository.ts`                |
| FFP-128 | Start Assessment API                       | 3   | `start-assessment.ts`, `assessment.service.ts`                               |
| FFP-129 | Save Assessment Progress API (early)       | 3   | `save-progress.ts`, `assessment.service.ts`                                  |

**Sprint Goal**: All database schemas migrated, job queue ready, users can start assessments. ✅ ACHIEVED

### Key Patterns & Decisions Established

| Area               | Decision                                                                                |
| ------------------ | --------------------------------------------------------------------------------------- |
| **State Machine**  | `not_started → in_progress → submitted → scored → completed` (+ `abandoned`)            |
| **Job Queue**      | Database-driven polling with `FOR UPDATE SKIP LOCKED`, exponential backoff              |
| **Flow Steps**     | `intro`, `questions`, `transition`, `video-assessment`, `results`, `programme-overview` |
| **RLS Pattern**    | Tenant isolation via `app.tenant_id` session variable                                   |
| **User Ownership** | Service-layer `userId` check (RLS enforces tenant, not user isolation)                  |
| **Router**         | Regex-based pattern matching with parameter extraction for dynamic routes               |

### Key File Locations

- **Schemas**: `@ffp/database/src/schema/` (assessment-templates, assessment-flows, user-assessments, process-jobs)
- **Repositories**: `@ffp/core/src/assessments/` (user-assessment.repository.ts, assessment-template.repository.ts)
- **Services**: `@ffp/core/src/assessments/assessment.service.ts`
- **Job Queue**: `@ffp/core/src/jobs/` (job-queue.service.ts, job-processor.service.ts)
- **Handlers**: `@ffp/functions/src/assessments/` (start-assessment.ts, save-progress.ts, submit-assessment.ts)

---

## Completed: FFP-130 - Questions Table Refactor ✅

**Branch**: `feature/ffp-130-submit-assessment-api`
**Story Points**: 5
**Status**: ✅ All Phases Complete (Sessions A-D)

### Implementation Plan

Refactoring questions from embedded JSONB (`assessment_templates.questions`) into a dedicated `questions` table with proper referential integrity.

**Full Plan**: `project-documentation/sprint-planning/outputs/ffp-130-questions-table-implementation.md`

| Phase | Description                        | Status      | Session |
| ----- | ---------------------------------- | ----------- | ------- |
| 1     | Database Constants                 | ✅ Complete | A       |
| 2     | New Database Schema Files          | ✅ Complete | A       |
| 3     | Generate and Run Migration         | ✅ Complete | A       |
| 4     | Seed Data Refactor                 | ✅ Complete | B       |
| 5     | Core Package - Schema Updates      | ✅ Complete | B       |
| 6     | Core Package - Repository Updates  | ✅ Complete | C       |
| 7     | Service Layer Updates              | ✅ Complete | C       |
| 8     | Modify Existing Schemas (Breaking) | ✅ Complete | D       |
| 9     | Test Updates                       | ✅ Complete | D       |

### Session D Completed Work (3rd January 2026)

**Phase 8: Modify Existing Schemas (Breaking Changes)**

- Updated `packages/database/src/schema/assessment-templates.ts`
  - Removed `questions` JSONB column
  - Removed local type definitions (AssessmentQuestion, QuestionType, etc.)
  - Added relation to `templateQuestions` (many relation)
  - Imported ScoringConfig from shared types
- Updated `packages/database/src/schema/user-assessments.ts`
  - Removed `answers` JSONB column
  - Added relation to `userAssessmentAnswers` (many relation)
- Generated migration `0010_redundant_tyger_tiger.sql` (drops questions/answers columns)
- Ran migration on both `ffp_dev` and `ffp_test` databases

**Phase 9: Test Updates**

- Updated `packages/core/src/assessments/template.repository.test.ts`
  - Removed `questions` field from test input
  - Updated `questionIds` to use UUID format (`22222222-2222-2222-2222-222222220101`)
  - Changed TRUNCATE to DELETE statements (FK dependencies)
- Updated `packages/core/src/assessments/user-assessment.repository.test.ts`
  - Removed `expect(result.answers).toEqual({})` assertions (answers now in separate table)
- Fixed database permissions for `test_user` on new tables (questions, template_questions, user_assessment_answers)
- Set up DEFAULT PRIVILEGES for both `app_user` and `test_user`

**Key Fix: Database User Permissions**

The vitest config (`@ffp/core/vitest.config.ts`) uses `test_user`, not `app_user` from `.env`. When adding new tables:

1. Run migrations as `root_user` (DB_MIGRATE_USER)
2. Ensure DEFAULT PRIVILEGES are configured so `test_user` and `app_user` both get table access
3. Added strategic comments to `vitest.config.ts` and `migrate.ts` documenting this

**Quality Assurance**:

- ✅ `pnpm build` - All packages build successfully
- ✅ `pnpm typecheck` - Zero TypeScript errors
- ✅ `pnpm test` - 466 tests passing
- ✅ `pnpm lint` - Zero warnings

### Session C Completed Work (2nd January 2026)

**Phase 6: Core Package - Repository Updates**

- Created `packages/core/src/questions/question.repository.ts`
  - `findById(db, id)` - Find question by ID
  - `findByIds(db, ids)` - Find multiple questions by IDs
  - `findBySlug(db, slug)` - Find question by slug
  - `findByTemplateId(db, templateId)` - Join with template_questions, order by displayOrder
  - `findByTemplateIds(db, templateIds)` - Batch fetch for multiple templates
  - `findAll(db, options)` - Find all active questions
  - Types exported: `Question`, `QuestionWithConfig`
- Created `packages/core/src/questions/index.ts` - Barrel export for questions domain
- Created `packages/core/src/assessments/answer.repository.ts`
  - `findByAssessmentId()` - Find all answers for assessment
  - `findByAssessmentAndQuestion()` - Find specific answer
  - `upsertAnswer()` - Insert or update single answer (ON CONFLICT)
  - `saveAnswers()` - Batch upsert multiple answers
  - `deleteByAssessmentId()` - Delete all answers for assessment
  - `deleteByQuestionIds()` - Delete specific answers
  - Transaction support via optional `tx` parameter
  - Types exported: `UserAssessmentAnswer`, `SaveAnswerInput`
- Updated `packages/core/src/assessments/template.repository.ts`
  - Added `findWithQuestions(db, id)` - Fetch template with questions loaded
  - Added `AssessmentTemplateWithQuestions` type
- Updated `packages/core/src/assessments/user-assessment.repository.ts`
  - Removed JSONB answer merging from `updateProgress()`
  - Now only updates `currentStep` (answers via `answerRepository`)
  - Added deprecation comments
- Updated `packages/core/src/assessments/index.ts`
  - Added `answerRepository` export and types

**Phase 7: Service Layer Updates**

- Updated `packages/core/src/assessments/assessment.service.ts`
  - Added `convertAnswersToResponseFormat()` - DB → API format conversion
  - Added `convertAnswersToSaveFormat()` - API → DB format conversion
  - Added `extractAnswerValue()` - Extract value from JSONB structure
  - Updated `startAssessment()` - Load answers from `user_assessment_answers` table
  - Updated `saveProgress()` - Save answers via `answerRepository.saveAnswers()` in transaction
  - Updated `submitAssessment()` - Use new repositories instead of JSONB field
  - Updated `getRequiredQuestionIds()` - Use `questionRepository.findByTemplateIds()`
- Updated `packages/core/src/assessments/assessment.service.test.ts`
  - Refactored all mocks: removed `templateRepository`, added `questionRepository` + `answerRepository`
  - Updated test fixtures to use `QuestionWithConfig` type
  - All 12 tests updated to use new repository patterns
  - Fixed answer structure expectations (separate table vs JSONB)

**Quality Assurance**:

- ✅ `pnpm build` - All packages build successfully
- ✅ `pnpm typecheck` - Zero TypeScript errors
- ✅ `pnpm test` - 466 tests passing
- ✅ `pnpm lint` - Zero warnings

### Session B Completed Work (2nd January 2026)

**Phase 4: Seed Data Refactor**

- Created `packages/database/seed/seedQuestions.ts`
  - Deterministic UUIDs for 15 questions (pattern: `22222222-2222-2222-2222-2222222200XX`)
  - `QUESTION_IDS` mapping: slug → UUID
  - Questions grouped: pre-assessment, strength, balance
  - Idempotent seeding (checks existence before insert)
- Refactored `packages/database/seed/seedAssessmentTemplates.ts`
  - Updated question IDs to use UUIDs from `QUESTION_IDS`
  - Added `template_questions` join record seeding
- Updated `packages/database/seed/index.ts`
  - Added `seedQuestions` call before templates
  - Re-exports `seedQuestions` and `QUESTION_IDS`

**Phase 5: Core Package - Schema Updates**

- Updated `assessment-question.schema.ts`: `id` now validates as UUID
- Updated `scoring-config.schema.ts`: `questionIds` array validates as UUIDs
- Updated `assessment-template.schema.ts`: Made `questions` optional with `@deprecated` annotation
- Fixed build errors in `assessment.service.ts` and `template.repository.ts` for optional `questions`
- Updated `assessment-template.schema.test.ts` with UUID test fixtures

**Quality Assurance**:

- ✅ `pnpm build` - All packages build successfully
- ✅ `pnpm typecheck` - Zero TypeScript errors
- ✅ `pnpm test` - 466 tests passing
- ✅ `pnpm lint` - Zero warnings

### Session A Completed Work (2nd January 2026)

**Phase 1: Database Constants**

- Created `packages/database/src/constants/question.constants.ts`
  - `QUESTION_TYPES`: single-choice, multi-choice, numeric, text, scale, video-response
  - `SCORE_DIMENSIONS`: strength, balance, mobility, pain, general
- Updated `constants/index.ts` to export new constants

**Phase 2: New Database Schema Files**

- Created `packages/database/src/schema/questions.ts`
  - Questions table with slug, type, questionText, options, validation, videoId, scoreDimension
  - PostgreSQL enums: `question_type`, `score_dimension`
  - Indexes on slug, type, is_active
- Created `packages/database/src/schema/template-questions.ts`
  - Join table: templateId, questionId, displayOrder, configOverrides
  - Unique constraints on (template_id, question_id) and (template_id, display_order)
  - FK CASCADE on template delete, RESTRICT on question delete
- Created `packages/database/src/schema/user-assessment-answers.ts`
  - Answers table with RLS: tenantId, userAssessmentId, questionId, answerValue
  - Unique constraint on (user_assessment_id, question_id)
- Updated `schema/index.ts` to export all new schemas

**Phase 3: Migration**

- Generated `migrations/0009_easy_captain_marvel.sql`
  - Creates 2 enums, 3 tables, FK constraints, and indexes
- Migration ready to run locally

**Architectural Improvement: Shared Types Pattern**

- Created `packages/database/src/types/` folder (following `constants/` pattern)
- `question.types.ts`: QuestionOption, QuestionValidation, ConfigOverrides, AnswerValue
- Schema files now import from `../types` instead of defining locally
- Added TODO to `assessment-templates.ts` to migrate legacy types

### Files Created

| File                                                        | Description                                |
| ----------------------------------------------------------- | ------------------------------------------ |
| `packages/database/src/constants/question.constants.ts`     | QUESTION_TYPES, SCORE_DIMENSIONS constants |
| `packages/database/src/types/question.types.ts`             | Shared JSONB types                         |
| `packages/database/src/types/index.ts`                      | Types barrel export                        |
| `packages/database/src/schema/questions.ts`                 | Questions table schema                     |
| `packages/database/src/schema/template-questions.ts`        | Template-questions join table              |
| `packages/database/src/schema/user-assessment-answers.ts`   | User answers table with RLS                |
| `packages/database/migrations/0009_easy_captain_marvel.sql` | Migration file                             |

### Files Modified

| File                                                   | Change                          |
| ------------------------------------------------------ | ------------------------------- |
| `packages/database/src/constants/index.ts`             | Added question.constants export |
| `packages/database/src/schema/index.ts`                | Added new schema exports        |
| `packages/database/src/index.ts`                       | Added types export              |
| `packages/database/src/schema/assessment-templates.ts` | Added TODO for types migration  |

### Quality Assurance

- ✅ `pnpm build` - All packages build successfully
- ✅ `pnpm typecheck` - Zero TypeScript errors
- ✅ `pnpm lint` - Zero warnings

---

## Completed: FFP-130 - Submit Assessment API

**Branch**: `feature/ffp-130-submit-assessment-api`
**Story Points**: 5
**Status**: ✅ All Sub-tasks Complete (4/4) - Ready for Manual Testing

### Implementation Plan

Single PR covering all sub-tasks (logical grouping for cohesive feature):

| Order | Sub-task | Summary                                                | Status      |
| ----- | -------- | ------------------------------------------------------ | ----------- |
| 1     | FFP-169  | Add request/response schemas for submission            | ✅ Complete |
| 2     | FFP-171  | Implement `submitAssessment()` service                 | ✅ Complete |
| 3     | FFP-173  | Add unit tests for submission flow                     | ✅ Complete |
| 4     | FFP-172  | Create `submit-assessment.ts` Lambda handler           | ✅ Complete |
| -     | FFP-170  | Required question validation → **Deferred to FFP-233** | N/A         |

### Key Implementation Decisions

| Decision                         | Choice                                                                            |
| -------------------------------- | --------------------------------------------------------------------------------- |
| **Job Payload**                  | Full payload with responses array (scoring job doesn't need to re-fetch)          |
| **Required Question Validation** | Included in FFP-171 (validates all required questions have answers before submit) |
| **Transaction Support**          | All writes in single transaction for atomicity (rollback on failure)              |
| **Batch Template Query**         | `findTemplatesByIds` with `inArray` instead of sequential queries                 |

### Completed Work

**FFP-169: Zod Schemas**

- `submitAssessmentRequestSchema` - validates answers object
- `submitAssessmentResponseSchema` - `{ jobId: uuid, message: string }`
- Types exported: `SubmitAssessmentRequest`, `SubmitAssessmentResponse`

**FFP-171: Service Implementation**

- `submitAssessment()` in `assessment.service.ts`
- Validates assessment exists and not already submitted
- Fetches flow and validates required questions
- Merges answers, transitions status, enqueues job
- All writes in single `withRLS` transaction for atomicity
- Returns `{ jobId, message }`

**FFP-173: Unit Tests**

- 9 new unit tests for `submitAssessment()` in `assessment.service.test.ts`
- Test cases: successful submission, already-submitted rejection, completed rejection, missing required questions, job payload verification, assessment not found, flow not found, no questions template, optional questions handling
- Mocked dependencies: user-assessment.repository, flow.repository, template.repository, job-queue.service, context, database

**Supporting Changes:**

- `findTemplatesByIds()` batch query in `template.repository.ts`
- Transaction support added to `updateProgress()`, `transitionStatus()`, `queueJob()`
- `Transaction` type exported from `lib/database.ts`

### Files Modified

| Action | File                                                                         |
| ------ | ---------------------------------------------------------------------------- |
| Modify | `packages/core/src/schemas/user-assessment.schema.ts`                        |
| Modify | `packages/core/src/assessments/assessment.service.ts`                        |
| Modify | `packages/core/src/assessments/template.repository.ts`                       |
| Modify | `packages/core/src/assessments/user-assessment.repository.ts`                |
| Modify | `packages/core/src/jobs/job-queue.service.ts`                                |
| Modify | `packages/core/src/lib/database.ts`                                          |
| Create | `packages/functions/src/assessments/submit-assessment.ts`                    |
| Modify | `packages/functions/src/assessments/index.ts`                                |
| Modify | `postman/FFP-API-Collection.postman_collection.json`                         |
| Create | `project-documentation/sprint-planning/outputs/ffp-130-test-instructions.md` |

### Testing

**Manual testing via Postman**: See `project-documentation/sprint-planning/outputs/ffp-130-test-instructions.md`

**Test Scenarios**:

- Happy path submission with merged answers
- Already submitted rejection (400)
- Missing required questions (400 with missingQuestionIds)
- Non-existent assessment (404)
- Unauthenticated request (401)
- Multi-tenant isolation

---

## Upcoming: Sprint 4 - Backend APIs + Frontend Foundation (23 pts remaining)

**Starts**: 5th January 2026
**Sprint Plan**: `project-documentation/sprint-planning/outputs/assessment-engine-sprint-plan.md`

| Order | Key     | Story                           | Pts | Status                            |
| ----- | ------- | ------------------------------- | --- | --------------------------------- |
| 1     | FFP-129 | Save Assessment Progress API    | 3   | ✅ Complete (done in Sprint 3)    |
| 2     | FFP-130 | Submit Assessment API           | 5   | ✅ Complete (pending manual test) |
| 3     | FFP-133 | Scoring Service Implementation  | 8   | Pending                           |
| 4     | FFP-135 | Assessment Context & State Mgmt | 5   | Pending                           |
| 5     | FFP-126 | Assessment Template Admin API   | 5   | Pending                           |

**Sprint Goal**: Complete assessment lifecycle APIs, scoring logic implemented, frontend state ready.
**Progress**: 8/26 pts complete (31%) - FFP-129 done early, FFP-130 complete (pending manual testing)

---

## Assessment Engine Overview (FFP-2)

**Total**: 86 story points across 4 sprints (~25 pts velocity)
**Full Sprint Plan**: `project-documentation/sprint-planning/outputs/assessment-engine-sprint-plan.md`

### Key Architecture Decisions

| Area              | Decision                                               |
| ----------------- | ------------------------------------------------------ |
| Template Storage  | Database (PostgreSQL), not S3 JSON                     |
| Job Queue         | Database-driven polling (`process_job` table), not SQS |
| Scoring           | Multi-dimensional (Strength, Balance, Risk Level)      |
| Frontend State    | TanStack Query + React Context                         |
| Conditional Logic | Deferred post-MVP (linear flow only)                   |

### Sprint 5: Results + Frontend Core (23 pts)

| Order | Key     | Story                                | Pts |
| ----- | ------- | ------------------------------------ | --- |
| 1     | FFP-131 | Get Assessment Results API           | 3   |
| 2     | FFP-134 | Programme Generation Service         | 5   |
| 3     | FFP-136 | TanStack Query Hooks for Assessments | 5   |
| 4     | FFP-139 | Question Renderer Components         | 8   |
| 5     | FFP-138 | Assessment Progress Bar Component    | 2   |

**Goal**: Full backend complete, frontend can render questions.

#### Sprint 6: Frontend Completion (14 pts + buffer)

| Order | Key     | Story                           | Pts |
| ----- | ------- | ------------------------------- | --- |
| 1     | FFP-137 | Assessment Navigation Component | 3   |
| 2     | FFP-140 | Assessment Step Screens         | 5   |
| 3     | FFP-141 | Video Player Component          | 5   |
| 4     | -       | Integration & Polish            | ~5  |

**Goal**: End-to-end assessment flow working, demo-ready MVP.

### Critical Path

```
FFP-124 → FFP-125 → FFP-127 → FFP-128 → FFP-129 → FFP-130 → FFP-131
(Template)  (Flow)   (User)   (Start)   (Save)   (Submit)  (Results)
   ✅         ✅        ✅        ✅        ✅        ✅
```

### Parallel Workstreams

1. **Job Queue**: FFP-132 ✅ → FFP-133 → FFP-134
2. **Frontend**: FFP-135 → FFP-138/139 (Sprint 4+)

---

## Completed EPIC: FFP-1 - Application Setup & Foundation

**Duration**: Sprint 1 & 2 (20th October - 30th November 2025)
**Status**: ✅ COMPLETE

### Delivered Capabilities

**Infrastructure**:

- SST v3 Ion deployed to dev environment
- Cognito User Pool with JWT authorizer
- S3 + CloudFront for static assets
- API Gateway with domain proxy routing
- Local PostgreSQL with Drizzle ORM and RLS

**Authentication**:

- Admin-only business onboarding (invite-only, no self-registration)
- JWT with custom claims (tenantId, customerId, role)
- Login, refresh token, and invite-user endpoints
- First-time password setup flow

**Web Application**:

- React 18 with Vite, TailwindCSS v4, TypeScript strict mode
- Component library (forms, icons, motion, layout)
- Role-based navigation (SideMenu, MobileMenu)
- Protected routing with RBAC
- AWS Amplify auth integration

**Testing**:

- Vitest with 185 passing tests
- 16 RLS integration tests (critical tenant isolation)
- 8% coverage target achieved
- Test helpers for database RLS testing

**Monorepo**:

- Turborepo with 4 packages (@ffp/web, @ffp/functions, @ffp/core, @ffp/database)
- Domain-organised backend architecture
- Build caching (30-100x faster rebuilds)

### Deferred from EPIC FFP-1

| Item                          | Reason                               | When              |
| ----------------------------- | ------------------------------------ | ----------------- |
| FFP-14: CloudWatch Monitoring | Nice-to-have for MVP                 | Post-MVP          |
| FFP-32: Secrets Manager       | Cognito uses public key verification | When RDS deployed |
| FFP-91: Registration Form     | Admin-only onboarding                | Phase 2           |
| FFP-67-70: Playwright/MSW     | Unit tests sufficient for Phase 1    | Post-MVP          |

---

## Key Architectural Decisions

These decisions apply across all EPICs and should be referenced when implementing new features.

### Backend Architecture

**Domain-Organised Pattern**: `Handler → Service → Entity → Repository → Schema`

- **Handler**: HTTP/Lambda interface only, zero business logic
- **Service**: Business logic orchestration, validates input
- **Entity**: Complex business behaviour (optional)
- **Repository**: Data access with RLS context
- **Schema**: Zod validation schemas

**Request Context Pattern**:

```typescript
// Unified RequestContext combines db + tenant context
interface RequestContext {
  db: DrizzleClient;
  tenantId: string;
  customerId: string;
  userId: string;
  role: UserRole;
}
```

**Admin Operations**: Use privileged database connection (BYPASSRLS permission)

### Frontend Architecture

**React Component Pattern** (Session 49):

```typescript
// All React components use arrow function with explicit FC typing
const Component: React.FC<Props> = ({ prop }) => {
  return <div>{prop}</div>;
};
```

**Schema-First Types** (Session 50):

- Zod schemas are single source of truth for all types
- Types exported via `z.infer<typeof schema>`
- Prevents type/validation drift

**Component Library**:

- Atomic design with domain directories (`form/`, `icons/`, `ui/`, `layout/`, `motion/`)
- Barrel exports for clean imports
- British English prop names (`colour`, `initialise`, `optimise`)
- Dev-only showcases at `/components/*` (excluded from production)

**Bundle Decisions**:

- Framer Motion accepted (~50KB for animation quality)
- 650KB uncompressed (190KB gzipped) acceptable for Phase 1
- Route-level code splitting deferred to post-MVP

### Multi-Tenant Security (Critical)

**RLS Pattern**:

```typescript
// CORRECT: Set RLS context in transaction
await db.transaction(async (tx) => {
  await setRLSContext(tx, context.tenantId);
  return await tx.query.users.findMany();
});

// WRONG: Direct query without RLS context
await db.query.users.findMany(); // Leaks all tenants!
```

**JWT Claims**:

- `custom:tenantId` - Tenant isolation
- `custom:customerId` - Customer scope
- `custom:role` - RBAC (program_user, customer_admin, system_admin)

**User Role Hierarchy**:

- `program_user` - End users (physiotherapy patients)
- `customer_admin` - Business administrators
- `system_admin` - Platform administrators

### Authentication

- Admin-only business onboarding (no self-registration)
- Three-tier: tenant → customer → users
- Invite-only user creation via admin API
- Super admin bootstrap for initial setup

---

## Working Infrastructure

**Deployed to Dev Environment**:

- ✅ SST v3 Ion infrastructure
- ✅ Cognito User Pool with JWT authorizer
- ✅ S3 + CloudFront CDN
- ✅ API Gateway with domain proxy routing
- ✅ PostgreSQL (local) with RLS policies

**Monorepo Packages**:

- `@ffp/web` - React frontend (Vite + TailwindCSS)
- `@ffp/functions` - Lambda handlers
- `@ffp/core` - Shared business logic & schemas
- `@ffp/database` - Drizzle schemas & migrations

**Quality Gates**:

- TypeScript strict mode (zero errors)
- ESLint + Prettier (zero warnings)
- 466 tests passing (16 RLS integration tests, 57 flow schema tests)
- 8% coverage target

---

## Quick Reference

**Jira Project**: FFP (Fit For Purpose)
**Site**: https://ctregaskis.atlassian.net
**Project Key**: FFP

**Sprint Status**: Sprint 3 ✅ Complete | Sprint 4 starts 5th Jan 2026
**Velocity**: ~25 story points per sprint
**Capacity**: 8 hours/week (solo developer)

**EPICs**:

- ✅ FFP-1: Application Setup & Foundation (Complete)
- 🚀 FFP-2: Assessment Engine (Sprints 3-6, 86 pts)
- ⏳ FFP-3: Programme Generation (Future)
- ⏳ FFP-4: Video Management (Future)

---

**For detailed session history, see `progress-log.md`**
**For implementation details, see domain-specific docs in `project-documentation/`**
