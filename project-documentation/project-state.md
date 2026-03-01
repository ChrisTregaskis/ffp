# FFP - Project State

**Last Updated**: 28th February 2026
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

### Active Story: FFP-300 — Video Catalogue APIs (5 pts)

**Branch**: `feature/ffp-300-vid-cat-apis`
**Status**: Planning
**Blocked by**: FFP-282 ✅, FFP-288 ✅, FFP-294 ✅ — all dependencies resolved
**Blocks**: FFP-320 (Admin Video Upload)

**Summary**: Create read-only APIs to list, filter, and retrieve exercise video metadata. Two endpoints: `GET /videos` (list/filter) and `GET /videos/{id}` (detail). Videos are system-managed content — no RLS required, but JWT authentication enforced.

**Sub-tasks (execution order)**:

| #   | Key     | Sub-task                                           | Status           | Notes                                                                                                                                                         |
| --- | ------- | -------------------------------------------------- | ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | FFP-301 | Create video repository with list, get, and filter | ✅ Done          | **Extended** `video.repository.ts` — added `findAllActive()`, `findByFilters()` with `VideoFilters` interface. `arrayOverlaps` for GIN-indexed array columns. |
| 2   | FFP-302 | Create video service layer                         | ✅ Done          | **Created** `video.service.ts` with `listVideos()`, `getVideo()`, `listVideosByFilter()`. Added `videoFilterSchema` to Zod schemas. Barrel exports updated.   |
| 3   | FFP-303 | Create GET /videos Lambda handler (list + filter)  | To Do            | New `packages/functions/src/videos/list.ts`. Parse query params, call service                                                                                 |
| 4   | FFP-304 | Create GET /videos/{id} Lambda handler             | To Do            | New `packages/functions/src/videos/get.ts`. Extract path param, call service, 404 on not found                                                                |
| 5   | FFP-305 | Add video routes to API Gateway in SST config      | **Already done** | SST already has `ANY /videos/{proxy+}` — just update router `index.ts` with new route entries                                                                 |
| 6   | FFP-306 | Update Postman collection with video endpoints     | To Do            | Add requests via `/postman` skill after handlers are working                                                                                                  |

**Amended requirements** (ticket vs current codebase):

1. **FFP-301 — Extend, not create** — `video.repository.ts` already exists with `findVideoById()` from FFP-294. This sub-task adds `findAllActive()` and `findByFilters()` to the same file. Array filtering uses Drizzle `arrayOverlaps` with GIN-indexed columns.
2. **FFP-302 — Separate service file** — `video-signing.service.ts` handles signed URL generation. Catalogue operations go in a new `video.service.ts` to maintain single responsibility. Service validates filters, calls repository, returns Zod-validated responses.
3. **FFP-305 — Effectively complete** — SST config already routes `ANY /videos/{proxy+}` to the video router (set up in FFP-294/FFP-298). Only the router `index.ts` needs new route entries for `GET /` and `GET /{id}`. No SST changes required.
4. **No RLS** — Videos are system-managed (in RLS exclusions list). Repository queries use `db` directly, not `withRLS()`. JWT authentication still required for all routes.
5. **Barrel exports** — `packages/core/src/videos/index.ts` and `packages/core/src/server.ts` already export the videos domain. New service just needs adding to the barrel.
6. **Zod schemas already exist** — `videoListResponseSchema`, `videoDetailResponseSchema` defined in `packages/core/src/schemas/video.schema.ts` from FFP-282.

**Implementation grouping** (single branch `feature/ffp-300-vid-cat-apis`, single PR):

- **Pass 1**: FFP-301 — Extend `video.repository.ts` with `findAllActive()` and `findByFilters()`
- **Pass 2**: FFP-302 — Create `video.service.ts` with `listVideos()`, `getVideo()`, `listVideosByFilter()`; update barrel exports
- **Pass 3**: FFP-303 + FFP-304 + FFP-305 — Create `list.ts` and `get.ts` handlers; update router `index.ts` with new routes
- **Pass 4**: FFP-306 — Update Postman collection via `/postman` skill

**Key files to modify/create**:

- Modify: `packages/core/src/videos/video.repository.ts` (add functions)
- Create: `packages/core/src/videos/video.service.ts` (new service)
- Modify: `packages/core/src/videos/index.ts` (add service export)
- Create: `packages/functions/src/videos/list.ts` (new handler)
- Create: `packages/functions/src/videos/get.ts` (new handler)
- Modify: `packages/functions/src/videos/index.ts` (add routes to router)

**Skill**: `/backend` for Passes 1-3, `/postman` for Pass 4

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

- Confirmed: Programme → Weeks → Sessions → Exercises (flexible days, not prescriptive)
- Phases as metadata on weeks (`phase_label`/`phase_number`), not a separate entity
- Hybrid instantiation: weeks created eagerly at assignment, sessions/completions lazily
- Normalised `exercise_completions` table (not JSONB)
- `programme_weeks` (user-layer, RLS) created in FFP-3; `user_sessions` and `exercise_completions` deferred to FFP-4

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
