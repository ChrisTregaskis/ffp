# FFP - Project State

**Last Updated**: 21st February 2026
**Current EPIC**: FFP-2 wrapping up, FFP-3 (Video Management) next
**Sprint Status**: Sprint 6 - Frontend Completion (nearly complete)

---

## Current: Sprint 6 - Frontend Completion (~26 pts)

**Dates**: 16th February - 8th March 2026
**Sprint Goal**: End-to-end assessment flow working, demo-ready MVP.

| Key     | Story                                        | Pts | Type  | Status                                   |
| ------- | -------------------------------------------- | --- | ----- | ---------------------------------------- |
| FFP-137 | Assessment Navigation Component              | 3   | Story | ✅ Done                                  |
| FFP-140 | Assessment Step Screens                      | 5   | Story | ✅ Done                                  |
| FFP-272 | E2E Assessment Flow Integration              | 5   | Story | ✅ Done                                  |
| FFP-273 | ToastAlert Notification Component            | 3   | Task  | ✅ Done                                  |
| FFP-229 | Assessment Engine Epic Clean Up              | 8   | Story | ✅ Done                                  |
| FFP-279 | Update deterministic seed UUIDs to RFC 4122  | -   | Task  | ✅ Done                                  |
| FFP-280 | Align Zod versions across monorepo (v3 → v4) | -   | Task  | ✅ Done                                  |
| FFP-233 | Backend Required Question Validation         | 3   | Story | ✅ Done (already implemented in FFP-130) |
| FFP-230 | Stale Job Detection                          | 2   | Story | ✅ Done                                  |
| FFP-254 | FFP-3 Epic Planning & Sprint Definition      | 5   | Story | To Do                                    |

### Remaining

1. **FFP-254** - FFP-3 Epic planning (documentation, prepares next phase)

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

**RLS exclusions**: `process_jobs`, `assessment_templates`, `assessment_flows`, `questions`, `template_questions` (system-managed, cross-tenant by design)

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
**Velocity**: ~25 pts/sprint
**Capacity**: 8 hours/week

**EPICs**:

- ✅ FFP-1: Application Setup & Foundation
- ✅ FFP-2: Assessment Engine (Sprints 3-6) — wrapping up
- ⏳ FFP-3: Video Management — next
- ⏳ FFP-4: User Dashboards and Progress Tracking

---

**For session history**: `progress-log.md`
**For implementation details**: domain-specific docs in `project-documentation/`
