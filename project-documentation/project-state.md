# FFP - Project State

**Last Updated**: 26th January 2026
**Current EPIC**: FFP-2 - Assessment Engine
**Sprint Status**: Sprint 5 🚀 In Progress
**Previous**: Sprint 4 ✅ Complete

---

## In Progress: Sprint 5 - Results & Frontend Core (23 pts)

**Dates**: 26th January - 15th February 2026
**Branch**: `feature/sprint5` (story branches off main)
**Sprint Goal**: Assessment results API, programme generation, frontend components for assessment flow.
**Analysis**: See `sprint-planning/outputs/sprint-5-analysis-report.md`

### Sprint 5 Stories

| Key     | Story                                | Pts | Status      | Dependencies           |
| ------- | ------------------------------------ | --- | ----------- | ---------------------- |
| FFP-138 | Assessment Progress Bar Component    | 2   | ✅ Complete | FFP-135 ✅             |
| FFP-131 | Get Assessment Results API           | 3   | ✅ Complete | FFP-133 ✅             |
| FFP-136 | TanStack Query Hooks for Assessments | 5   | ✅ Complete | FFP-135 ✅, FFP-131 ✅ |
| FFP-134 | Programme Generation Service         | 5   | 📋 Ready    | FFP-131 ✅             |
| FFP-139 | Question Renderer Components         | 8   | ✅ Complete | FFP-135 ✅, FFP-136 ✅ |

### Current Progress: 18/23 pts (78%) - FFP-139 complete

### Recommended Next Steps

1. ~~**FFP-138** (2 pts) - Independent, quick win~~ ✅ Complete
2. ~~**FFP-131** (3 pts) - Unblocks FFP-134 and FFP-136, critical path~~ ✅ Complete
3. ~~**FFP-136** (5 pts) - TanStack setup, unblocks FFP-139~~ ✅ Complete
4. ~~**FFP-139** (8 pts) - Question renderers~~ ✅ Complete
5. **FFP-134** (5 pts) - Programme Generation Service 📋 **NEXT UP**

---

## FFP-139 Implementation Plan: Question Renderer Components

**Branch**: `feature/ffp-139-question-renderers`
**PR Strategy**: Single PR for all sub-tasks (cohesive component library)

### Overview

Create question renderer components for all MVP question types. Each component receives question data and dispatches answers to AssessmentContext.

**Key Types** (from `@ffp/core`):

- `AssessmentQuestion` - question definition with `type`, `options`, `validation`
- `UserAnswer` - contains `questionId`, `answerValue`, `answeredAt`
- `AnswerValue` - `string | number | boolean | string[]`

### Folder Structure

```
packages/web/src/components/assessment/
├── questions/
│   ├── QuestionRenderer.tsx      # Factory router
│   ├── SingleChoiceQuestion.tsx  # Radio buttons
│   ├── MultiChoiceQuestion.tsx   # Checkboxes
│   ├── NumericQuestion.tsx       # Number input
│   ├── ScaleQuestion.tsx         # 1-10 button group
│   ├── TextQuestion.tsx          # Textarea
│   ├── VideoResponseQuestion.tsx # Video + response input
│   └── index.ts                  # Barrel exports
├── AssessmentProgress.tsx        # (move from current location)
├── utils.ts
└── index.ts
```

### Sub-task Execution Order

| #   | Key     | Task                                       | Status      |
| --- | ------- | ------------------------------------------ | ----------- |
| 1   | FFP-213 | SingleChoiceQuestion (establishes pattern) | ✅ Complete |
| 2   | FFP-214 | MultiChoiceQuestion (similar to single)    | ✅ Complete |
| 3   | FFP-217 | TextQuestion + barrel exports setup        | ✅ Complete |
| 4   | FFP-215 | NumericQuestion + ScaleQuestion            | ✅ Complete |
| 5   | FFP-216 | VideoResponseQuestion (HTML5 placeholder)  | ✅ Complete |
| 6   | FFP-212 | QuestionRenderer factory (ties together)   | ✅ Complete |

### Implementation Notes

**Common Props Interface**:

```typescript
interface QuestionComponentProps {
  question: AssessmentQuestion;
  value: AnswerValue | undefined;
  onChange: (value: AnswerValue) => void;
  disabled?: boolean;
  error?: string;
}
```

**Integration with AssessmentContext**:

```typescript
const { assessmentState, assessmentDispatch } = useAssessment();

const handleChange = (questionId: string, value: AnswerValue) => {
  assessmentDispatch({
    type: ASSESSMENT_ACTION.SET_ANSWER,
    payload: { questionId, answer: { questionId, answerValue: value } },
  });
};
```

**FFP-216 VideoResponseQuestion**:

- Uses basic HTML5 `<video>` element as placeholder
- TODO: Integrate with VideoPlayer component (FFP-141) when available

### Acceptance Criteria (from parent FFP-139)

| AC  | Component             | Requirement                             |
| --- | --------------------- | --------------------------------------- |
| AC1 | SingleChoiceQuestion  | Radio button group with all options     |
| AC2 | MultiChoiceQuestion   | Checkbox group, multiple selections     |
| AC3 | NumericQuestion       | Number input with min/max validation    |
| AC4 | TextQuestion          | Textarea displayed                      |
| AC5 | ScaleQuestion         | 1-10 scale with labels                  |
| AC6 | VideoResponseQuestion | Video player + rep count input          |
| AC7 | All components        | Dispatch SET_ANSWER on change           |
| AC8 | All components        | Display validation errors when provided |

### Dependencies

- ✅ FFP-135 (Assessment Context) - provides `useAssessment`, `SET_ANSWER`
- ✅ FFP-136 (TanStack Hooks) - provides save/submit mutations
- ⏸️ FFP-141 (VideoPlayer) - future; using HTML5 placeholder

### Verification

```bash
pnpm typecheck --filter=@ffp/web
pnpm lint --filter=@ffp/web
pnpm build
```

---

## Completed This Sprint

### FFP-136: TanStack Query Hooks ✅

**Branch**: `feature/ffp-136-tanstack-hooks` (merged)
**Key deliverables**: API client infrastructure, assessment hooks
**Files**: `lib/api/client/`, `lib/api/endpoints/`, `hooks/assessments/`

### FFP-131: Get Assessment Results API ✅

**Endpoint**: `GET /assessments/:id/results`
**Pattern**: Simple nullable approach - `scores` and `programmeId` null until scoring completes

---

## Completed: Sprint 4 - APIs & FE Foundation (23 pts) ✅

**Status**: ✅ Complete (merged)

| Key     | Story                           | Pts | Summary                                       |
| ------- | ------------------------------- | --- | --------------------------------------------- |
| FFP-130 | Submit Assessment API           | 5   | POST /assessments/:id/submit, job enqueue     |
| FFP-133 | Scoring Service Implementation  | 8   | Multi-dimensional scoring, flow-level config  |
| FFP-126 | Assessment Template Admin API   | 5   | CRUD endpoints for system admins              |
| FFP-135 | Assessment Context & State Mgmt | 5   | React Context + useReducer, branching support |

### Key Patterns Established

| Area               | Decision                                                         |
| ------------------ | ---------------------------------------------------------------- |
| **Scoring**        | Multi-dimensional with weighted dimensions, flow-level config    |
| **Branching**      | `goto_step`, `show_warning` actions with condition evaluators    |
| **Frontend State** | React Context + useReducer pattern, typed actions                |
| **Admin API**      | Thin service layer, repository handles logic                     |
| **Type Imports**   | `@ffp/web` imports from `@ffp/core` only (never `@ffp/database`) |

---

## Completed: Sprint 3 - Backend Foundation (24 pts) ✅

**Status**: ✅ Complete (merged)

| Key     | Story                                      | Pts |
| ------- | ------------------------------------------ | --- |
| FFP-124 | Assessment Template Schema & Repository    | 5   |
| FFP-132 | Process Jobs Schema & Queue Infrastructure | 8   |
| FFP-125 | Assessment Flow Schema & Configuration     | 3   |
| FFP-127 | User Assessment Schema & State Machine     | 5   |
| FFP-128 | Start Assessment API                       | 3   |
| FFP-129 | Save Assessment Progress API               | 3   |

### Key Patterns Established

| Area               | Decision                                                                     |
| ------------------ | ---------------------------------------------------------------------------- |
| **State Machine**  | `not_started → in_progress → submitted → scored → completed` (+ `abandoned`) |
| **Job Queue**      | Database-driven polling with `FOR UPDATE SKIP LOCKED`, exponential backoff   |
| **Flow Steps**     | `intro`, `questions`, `transition`, `video-assessment`, `results`            |
| **RLS Pattern**    | Tenant isolation via `app.tenant_id` session variable                        |
| **User Ownership** | Service-layer `userId` check (RLS enforces tenant, not user isolation)       |

---

## Assessment Engine Overview (FFP-2)

**Total**: 86 story points across 4 sprints (~25 pts velocity)

### Critical Path

```
FFP-124 → FFP-125 → FFP-127 → FFP-128 → FFP-129 → FFP-130 → FFP-133 → FFP-131
(Template)  (Flow)   (User)   (Start)   (Save)   (Submit)  (Score)  (Results)
   ✅         ✅        ✅        ✅        ✅        ✅        ✅      (next)
```

### Sprint Overview

| Sprint | Focus                | Pts | Status      |
| ------ | -------------------- | --- | ----------- |
| 3      | Backend Foundation   | 24  | ✅ Complete |
| 4      | APIs & FE Foundation | 23  | ✅ Complete |
| 5      | Results & FE Core    | 23  | 📋 Ready    |
| 6      | FE Completion        | 14  | Future      |

---

## Key Architectural Decisions

### Backend Architecture

**Domain-Organised Pattern**: `Handler → Service → Repository → Schema`

### Multi-Tenant Security (Critical)

**RLS Pattern**:

```typescript
await db.transaction(async (tx) => {
  await setRLSContext(tx, context.tenantId);
  return await tx.query.users.findMany();
});
```

**JWT Claims**: `custom:tenantId`, `custom:customerId`, `custom:role`

### Frontend Architecture

- React 18 with arrow function components
- Zod schemas as single source of truth
- TanStack Query for server state
- React Context + useReducer for form state

---

## Working Infrastructure

**Deployed**: SST v3 Ion, Cognito, S3 + CloudFront, API Gateway, PostgreSQL (local) with RLS

**Packages**: `@ffp/web`, `@ffp/functions`, `@ffp/core`, `@ffp/database`

**Quality Gates**: TypeScript strict, ESLint (0 warnings), 504 tests passing

---

## Quick Reference

**Jira**: FFP project at ctregaskis.atlassian.net
**Sprint**: 5 of 6 (Assessment Engine)
**Velocity**: ~25 pts/sprint
**Capacity**: 8 hours/week

**EPICs**:

- ✅ FFP-1: Application Setup & Foundation
- 🚀 FFP-2: Assessment Engine (Sprints 3-6)
- ⏳ FFP-3: Programme Generation
- ⏳ FFP-4: Video Management

---

**For session history**: `progress-log.md`
**For implementation details**: domain-specific docs in `project-documentation/`
