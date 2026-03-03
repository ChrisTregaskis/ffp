# FFP - Project State

**Last Updated**: 2nd March 2026
**Current EPIC**: FFP-3 Video Management
**Sprint Status**: Sprint 7 - Video Infrastructure & APIs (in progress)

---

## Current: Sprint 7 - Video Infrastructure & APIs (~28 pts)

**Dates**: 23rd February 2026 onwards
**Sprint Goal**: Video catalogue schema, CloudFront signed URLs, video APIs, programme-video relationships.
**Epic**: FFP-3 Video Management

**Key documents**:

- `.claude/research/video-management-research.md` - Video infrastructure research & confirmed decisions
- `.claude/research/ffp-3-epic-plan.md` - Final epic plan (stories, ACs, subtasks, sprint allocation)
- `.claude/research/programme-data-model-research.md` - Authoritative programme data model

### Completed Story: FFP-282 — Video Catalogue Database Schema (5 pts) ✅

**Branch**: `feature/ffp-282-video-cat-database-schema` (merged to main)
**All 5 sub-tasks complete**: Drizzle schema + enums + GIN indexes, index exports, migration (0017), Zod schemas, seed data (10 videos).

### Completed Story: FFP-288 — CloudFront OAC & Signed URL Infrastructure (5 pts) ✅

**Branch**: `feature/ffp-288-cloudfront-oac-signed-url-infrastructure` (merged to main)
**All 4 sub-tasks complete**: RSA key pair setup script, SST OAC + Key Group config, deployment verification, documentation.

### Completed Story: FFP-294 — Signed URL Generation Service (5 pts) ✅

**Branch**: `feature/ffp-294-signed-url-generation-service` (merged to main)
**All 5 sub-tasks complete**: AWS SDK deps, signing key caching, `video-signing.service.ts` + `video.repository.ts` (findVideoById only), `get-signed-url.ts` handler + router, audit logging.

**Foundation created for FFP-300**: `video.repository.ts`, `video-signing.service.ts`, barrel exports (`videos/index.ts`, `server.ts`), router (`functions/src/videos/index.ts`), SST route (`ANY /videos/{proxy+}`), Zod schemas (`video.schema.ts`).

### Completed Story: FFP-300 — Video Catalogue APIs (5 pts) ✅

**Branch**: `feature/ffp-300-vid-cat-apis` (merged to main)
**All 6 sub-tasks complete**: Extended video repository, created video service, list + get handlers, router routes, Postman collection updated.

### Active Story: FFP-307 — Programme-Video Relationship Schema & Service Evolution (8 pts)

**Branch**: `feature/ffp-307-programme-video-schema`
**Status**: Planning
**Blocked by**: FFP-282 ✅ (videos table for session_exercises FK)
**Blocks**: FFP-4 stories (Programme Execution & Progress)

**Summary**: Create template-layer tables (template_phases, template_sessions, session_exercises) that define workout plan structure, the user-layer table (programme_phases with RLS) that tracks individual progress, and evolve `generateProgramme()` to create phase instances at assignment time.

**Authoritative data model reference**: `.claude/research/programme-data-model-research.md`

**Sub-tasks (execution order)**:

| #   | Key     | Sub-task                                                                             | Status  | Notes                                                                                     |
| --- | ------- | ------------------------------------------------------------------------------------ | ------- | ----------------------------------------------------------------------------------------- |
| 1   | FFP-312 | Add phase_status enum type                                                           | ✅ Done | `PHASE_STATUSES` constant + `phaseStatusEnum`. `difficultyEnum` reused from videos.ts     |
| 2   | FFP-308 | Create Drizzle schemas for template_phases, template_sessions, session_exercises     | ✅ Done | 3 new schema files, system-managed, no RLS. Follows confirmed data model                  |
| 3   | FFP-309 | Create Drizzle schema for programme_phases (RLS-enforced)                            | ✅ Done | RLS with tenant_id. FKs to programmes + template_phases. phaseStatusEnum                  |
| 4   | FFP-310 | Add columns to programme_templates (total_phases, sessions_per_phase, difficulty)    | ✅ Done | NOT NULL with defaults (decision: 12, 3, 'beginner'). difficultyEnum imported from videos |
| 5   | FFP-311 | Add columns to programmes (started_at, completed_at, archived_at, etc.)              | ✅ Done | 7 nullable columns. Self-referential FK with AnyPgColumn + onDelete: set null             |
| 6   | FFP-316 | Update database schema index exports                                                 | ✅ Done | 4 new exports in schema/index.ts                                                          |
| 7   | FFP-313 | Generate and apply database migration                                                | Pending | Single migration covering all new tables + column additions + enums                       |
| 8   | FFP-314 | Create Zod validation schemas for new and updated tables                             | Pending | New schemas in `@ffp/core`, update existing programme schemas                             |
| 9   | FFP-315 | Create seed data for at least 1 complete programme template                          | Pending | Full hierarchy: phases → sessions → exercises referencing seeded videos                   |
| 10  | FFP-318 | Update programme.repository.ts with createProgrammePhases() and findTemplatePhases() | Pending | New repository functions for phase creation within RLS transactions                       |
| 11  | FFP-317 | Update generateProgramme() to create programme_phases rows                           | Pending | Evolve existing service to eagerly create phase rows at assignment                        |

**Amended requirements** (ticket vs current codebase):

1. **Terminology: "phases" not "weeks"** — Sub-tasks were created 23rd Feb before the 1st March terminology update. All references to `template_weeks`, `programme_weeks`, `week_status`, `week_number`, `total_weeks`, `sessions_per_week` must use the confirmed "phases" terminology: `template_phases`, `programme_phases`, `phase_status`, `phase_number`, `total_phases`, `sessions_per_phase`.
2. **FFP-312 — `difficulty` enum already exists** — Created in FFP-282 (`videos.ts`). Import and reuse `difficultyEnum` from videos schema; only `phase_status` enum is new. The sub-task's `week_status` → `phase_status` with values: `not_started`, `in_progress`, `completed`.
3. **FFP-308 — Table names updated** — `template_weeks` → `template_phases`, `template_week_id` → `template_phase_id`. The sub-task still references `phase_label` and `phase_number` columns; per the confirmed data model, template_phases has only `phase_number` + `name` (the name serves as the label). No separate `phase_label` column.
4. **FFP-309 — Table name updated** — `programme_weeks` → `programme_phases`, `week_status` → `phase_status`, `week_number` → `phase_number`. No `phase_label` column — `name` is copied from template.
5. **FFP-310 — Column names updated** — `total_weeks` → `total_phases`, `sessions_per_week` → `sessions_per_phase`. Per data model research, these should be NOT NULL with defaults (not nullable as ticket suggests) — `total_phases` default 12, `sessions_per_phase` default 3, `difficulty` default 'beginner'. **Decision needed**: nullable for migration safety vs NOT NULL with defaults (both are safe for existing rows if defaults are provided).
6. **FFP-311 — Column names updated** — `total_weeks` → `total_phases`, `sessions_per_week` → `sessions_per_phase`. The data model research suggests `total_phases` and `sessions_per_phase` as NOT NULL on programmes, but these are snapshot values copied at assignment time — nullable is correct here since existing programmes won't have them.
7. **FFP-317/FFP-318 — Function names updated** — `findTemplateWeeks()` → `findTemplatePhases()`, `createProgrammeWeeks()` → `createProgrammePhases()`. Service creates `programme_phases` rows (not `programme_weeks`).
8. **RLS exclusions update needed** — New template tables (`template_phases`, `template_sessions`, `session_exercises`) are system-managed and should be added to RLS exclusions list. `programme_phases` IS RLS-enforced.

**Implementation grouping** (single branch `feature/ffp-307-programme-video-schema`, single PR):

- **Pass 1** (FFP-312 + FFP-308 + FFP-309 + FFP-310 + FFP-311 + FFP-316): All Drizzle schema definitions — new enum, 4 new tables, 2 table modifications, index exports
- **Pass 2** (FFP-313): Generate and apply single database migration
- **Pass 3** (FFP-314 + FFP-315): Zod validation schemas + seed data
- **Pass 4** (FFP-318 + FFP-317): Repository functions + evolve `generateProgramme()` service

**Key files to modify/create**:

- Create: `packages/database/src/schema/template-phases.ts` (new schema)
- Create: `packages/database/src/schema/template-sessions.ts` (new schema)
- Create: `packages/database/src/schema/session-exercises.ts` (new schema)
- Create: `packages/database/src/schema/programme-phases.ts` (new schema, RLS)
- Modify: `packages/database/src/schema/programme-templates.ts` (add columns)
- Modify: `packages/database/src/schema/programmes.ts` (add columns)
- Modify: `packages/database/src/schema/index.ts` (export new schemas)
- Modify: `packages/database/src/constants/programme.constants.ts` (add phase statuses)
- Create/Modify: Zod schemas in `packages/core/src/schemas/`
- Modify: `packages/database/seed/` (new seed data for template hierarchy)
- Modify: `packages/core/src/programmes/programme.repository.ts` (add functions)
- Modify: `packages/core/src/programmes/programme.service.ts` (evolve generateProgramme)

**Skill**: `/database` for Passes 1-2, `/backend` for Passes 3-4

---

## Completed: Sprint 6 - Frontend Completion (~26 pts)

**Dates**: 16th February - 22nd February 2026
**Sprint Goal**: End-to-end assessment flow working, demo-ready MVP.

| Key     | Story                                        | Pts | Type  | Status  |
| ------- | -------------------------------------------- | --- | ----- | ------- |
| FFP-137 | Assessment Navigation Component              | 3   | Story | ✅ Done |
| FFP-140 | Assessment Step Screens                      | 5   | Story | ✅ Done |
| FFP-272 | E2E Assessment Flow Integration              | 5   | Story | ✅ Done |
| FFP-273 | ToastAlert Notification Component            | 3   | Task  | ✅ Done |
| FFP-229 | Assessment Engine Epic Clean Up              | 8   | Story | ✅ Done |
| FFP-279 | Update deterministic seed UUIDs to RFC 4122  | -   | Task  | ✅ Done |
| FFP-280 | Align Zod versions across monorepo (v3 → v4) | -   | Task  | ✅ Done |
| FFP-233 | Backend Required Question Validation         | 3   | Story | ✅ Done |
| FFP-230 | Stale Job Detection                          | 2   | Story | ✅ Done |
| FFP-254 | FFP-3 Epic Planning & Sprint Definition      | 5   | Story | ✅ Done |

### FFP-3 Planning Outcomes (from Sprint 6)

**FFP-3 scope**: 2 sprints, ~55 pts (Sprint 7: 28 pts, Sprint 8: 27 pts)

- Sprint 7: Video catalogue schema, CloudFront OAC + signed URLs, video catalogue APIs, programme-video relationship schema
- Sprint 8: Admin video upload/management UI, video player component, integration verification, docs update

**Programme data model research complete** (`.claude/research/programme-data-model-research.md`):

- Confirmed: Programme → Phases → Sessions → Exercises (status-driven, not calendar-based)
- "Phases" replace "weeks" as the structural unit (co-founder decision, 1st March 2026) — avoids implying weekly cadence
- Hybrid instantiation: phases created eagerly at assignment, sessions/completions lazily
- Normalised `exercise_completions` table (not JSONB)
- `programme_phases` (user-layer, RLS) created in FFP-3; `user_sessions` and `exercise_completions` deferred to FFP-4

**FFP-4 epic updated** in Jira with confirmed data model, prerequisites from FFP-3, and design decisions.

---

## Completed: FFP-2 Assessment Engine (Sprints 3-6, 96 pts)

**86 story points** across 4 sprints. E2E assessment flow working and tested.

| Sprint | Focus                | Pts | Key Deliverables                                                      |
| ------ | -------------------- | --- | --------------------------------------------------------------------- |
| 3      | Backend Foundation   | 24  | Schemas, job queue, state machine, Start/Save APIs                    |
| 4      | APIs & FE Foundation | 23  | Submit API, scoring service, admin API, React Context state           |
| 5      | Results & FE Core    | 23  | Results API, programme generation, TanStack Query, question renderers |
| 6      | FE Completion        | 26  | Navigation, step screens, E2E integration, stale job detection        |

### Key Patterns & Decisions (Assessment Engine)

| Area                    | Decision                                                                       |
| ----------------------- | ------------------------------------------------------------------------------ |
| **State Machine**       | `not_started → in_progress → submitted → scored → completed` (+ `abandoned`)   |
| **Job Queue**           | DB-driven polling, `FOR UPDATE SKIP LOCKED`, exponential backoff, 2 job types  |
| **Stale Job Detection** | Per-type configurable thresholds, EventBridge cron (5 min), staging/prod only  |
| **Scoring**             | Multi-dimensional with weighted dimensions, flow-level config                  |
| **Branching**           | `goto_step`, `show_warning` actions with condition evaluators                  |
| **Flow Steps**          | `intro`, `questions`, `transition`, `video-assessment`, `results`              |
| **Programme Gen**       | `score_assessment` → `generate_programme` job chain, retakes skip creation     |
| **Question Renderers**  | Factory pattern with `QuestionComponentProps`, dispatches `SET_ANSWER`         |
| **Frontend State**      | React Context + useReducer (audited 2026, kept over Zustand/XState/Jotai)      |
| **API Client**          | TanStack Query with typed hooks in `hooks/assessments/`                        |
| **Zod Transforms**      | Backend → frontend shape mapping at parse time (configOverrides applied)       |
| **Assessment Route**    | `/assessment` fullscreen (excludeLayout), orchestrator pattern                 |
| **Submit Flow**         | User-initiated (no useEffect), "Complete Assessment" on final submittable step |
| **Results Polling**     | `useAssessmentResultsQuery` polls every 2s, stops on scores                    |
| **First Login**         | Redirect programme users without programme to assessment via user-status API   |
| **Admin API**           | Thin service layer, repository handles logic                                   |

### Deferred to Backlog

| Key     | Story                  | Reason                                                                           |
| ------- | ---------------------- | -------------------------------------------------------------------------------- |
| FFP-231 | Job Status Polling     | `GET /assessments/:id/results` already supports polling (scores null → complete) |
| FFP-252 | Scoring E2E Validation | Waiting on co-founder's question/scoring config spreadsheet (post-sprint 6)      |
| FFP-141 | Video Player Component | Defer to FFP-3 (Video Management) to avoid premature implementation              |

---

## Key Architectural Decisions

### Backend Architecture

**Domain-Organised Pattern**: `Handler → Service → Entity (optional) → Repository → Schema`

### Multi-Tenant Security (Critical)

**RLS Pattern**:

```typescript
await db.transaction(async (tx) => {
  await setRLSContext(tx, context.tenantId);
  return await tx.query.users.findMany();
});
```

**JWT Claims**: `custom:tenantId`, `custom:customerId`, `custom:role`

**RLS exclusions**: `process_jobs`, `assessment_templates`, `assessment_flows`, `questions`, `template_questions`, `programme_templates`, `videos` (system-managed, cross-tenant by design)

### Frontend Architecture

- React 18 with arrow function components
- Zod schemas as single source of truth
- TanStack Query for server state
- React Context + useReducer for page-scoped form state
- Component library: `cards/` vs `screens/` split, shared `StepCard` layout
- ToastAlert notification system (4 variants, auto-dismiss)

### Import Rules

- `@ffp/web` imports from `@ffp/core` only (never `@ffp/database`)
- Cross-package: `workspace:*` protocol, resolve to `dist/`
- Intra-package: namespace aliases (`@core/`, `@web/`)

---

## Working Infrastructure

**Deployed**: SST v3 Ion, Cognito, S3 + CloudFront, API Gateway, PostgreSQL (local) with RLS

**Packages**: `@ffp/web`, `@ffp/functions`, `@ffp/core`, `@ffp/database`

**Quality Gates**: TypeScript strict, ESLint (0 warnings), 504 tests passing

**Postman**: API collection + test flows managed via MCP server (`/postman` skill)

---

## Quick Reference

**Jira**: FFP project at ctregaskis.atlassian.net
**Velocity**: ~25-30 pts/sprint
**Capacity**: 8-12 hours/week

**EPICs**:

- ✅ FFP-1: Application Setup & Foundation
- ✅ FFP-2: Assessment Engine (Sprints 3-6)
- 🏃 FFP-3: Video Management (Sprint 7-8) — in progress
- ⏳ FFP-4: Programme Execution & Progress
- ⏳ FFP-109: Deployment Readiness (staging + production)
- ⏳ FFP-6: Customer & User Onboarding

---

**For session history**: `progress-log.md`
**For implementation details**: domain-specific docs in `project-documentation/`
