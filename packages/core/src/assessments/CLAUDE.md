# Assessment domain (`@ffp/core`)

Local map for the assessment domain. High-level engine design: `project-documentation/assessment-engine.md`. Standards: the `backend` and `database` skills, and `.claude/rules/rls.md`. Read this before editing here, and update it when the domain's structure or contracts change.

## What this domain is

Two distinct halves living side by side:

1. **User-facing lifecycle** (per-member, RLS-enforced) — starting/resuming an assessment, saving progress with branching, submitting, scoring, results.
2. **System catalogue** (cross-organisation, RLS-excluded) — the flows, steps, templates and question bank that define _what_ an assessment is. Authored by system admins.

The wider domain spans three packages: business logic here (`@ffp/core`), handlers in `packages/functions/src/assessments/` (+ admin handlers in `packages/functions/src/admin/`), and the UI in `packages/web` (`components/assessment/`, `hooks/assessments/`, `contexts/assessments/`, consumer pages under `pages/protected/programme-user/`).

## Data model (catalogue)

```
assessment_flows (scoring_config: jsonb, is_active)
  └─ flow_steps (order, type, config: jsonb, next_step_rules: jsonb, default_next_step_id)
       └─ assessment_templates (version auto-increments)   ← optional per step (templateId)
            └─ template_questions (display_order, config_overrides)
                 └─ questions (slug, type, options: jsonb, validation: jsonb, score_dimension)
```

- `scoring_config` is **flow-level jsonb** (`dimensions[]` + `programmeMappings[]`), not per template. A question's score comes from `QuestionOption.score`.
- Branching lives in `flow_steps.next_step_rules` (`NextStepRule[]`: priority → conditions → action). Actions: `goto_step`, `show_warning`, `end_assessment`. Linear fallback is `default_next_step_id`.
- Schemas: `packages/database/src/schema/{assessment-flows,flow-steps,assessment-templates,template-questions,questions}.ts`. Types/constants under `packages/database/src/{types,constants}/`.

## Files here

| File                                                               | Purpose                                                                                                                                                                            |
| ------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `assessment.service.ts`                                            | User lifecycle: `startAssessment`, `saveProgress` (runs branching), `submitAssessment`, `getAssessmentResults`, `getUserAssessmentStatus`                                          |
| `template.service.ts` / `template.repository.ts`                   | Admin CRUD for **templates** (the repository also holds the `template_questions` join queries)                                                                                     |
| `template-question.service.ts`                                     | The `template_questions` join lifecycle: assign / unassign / reorder / list-assignable. Split from `template.service.ts`, mirroring `flow-step.service.ts`                         |
| `child-payload.ts`                                                 | Shared validation for payloads addressing a parent's children by public identifier (distinctness, whole-sequence reorders)                                                         |
| `flow.repository.ts`                                               | Read queries for `assessment_flows` + `flow_steps`                                                                                                                                 |
| `flow.service.ts` / `flow-step.service.ts`                         | Admin CRUD for **flows** and their **steps** (publicId-keyed, `system_admin`-gated)                                                                                                |
| `user-assessment.repository.ts` / `answer.repository.ts`           | **RLS-enforced** user-layer data                                                                                                                                                   |
| `branching/branch-evaluator.service.ts` / `condition-evaluator.ts` | Evaluate `next_step_rules` → next step + warnings + terminate                                                                                                                      |
| `scoring/scoring.service.ts` (+ `helpers/`)                        | Pure: responses + questions + `ScoringConfig` → scores, risk level, recommended programme                                                                                          |
| `index.ts`                                                         | Namespaced re-exports: `assessmentService`, `templateService`, `templateQuestionService`, `flowService`, `flowStepService`, `flowRepository`, `scoringService`, `branchingService` |

## Local contracts

- **RLS:** user-layer tables (`user_assessments`, `user_assessment_answers`) are RLS-enforced — always set context in a transaction (see `.claude/rules/rls.md`). Catalogue tables (flows, steps, templates, template_questions, questions) are **RLS-excluded by design**; protect every catalogue endpoint — **reads as well as writes** — with a `system_admin` role check in the handler, not RLS. `/admin/` means system admin only; the member-facing reads of the same catalogue go through `packages/functions/src/assessments/`, which is ungated by design.
- **Scoring and branching are pure functions** — no side effects, no DB. Keep them that way; they're reusable for preview/dry-run. Persisting belongs in services/repositories.
- **Extend, don't fork:** new catalogue admin work should mirror the template-CRUD layering here (schema → repository → service → handler) and, on the web side, the programme-template patterns (`SessionCard`, `swapAdjacentItem`, mutation hooks) together with the shared UI those screens draw on (`InlineFormPanel` in `components/layout/`, `DeleteConfirmModal` in `components/modal/`, `reorderableItemActions` in `components/dropdown-menu/`).
- **A parent and its children get a service each:** `flow.service.ts` / `flow-step.service.ts` and `template.service.ts` / `template-question.service.ts`. The child service owns the `resolve<Parent>` lookup; the parent service does not import the child.
- **Wellness positioning:** prefer wellness-neutral language in new copy; avoid introducing clinical/medical framing. (The existing `show_warning` `seek_medical` type predates this — don't rely on or extend clinical phrasing in new work.)

## Gotchas

- **The admin flow list is paginated and carries a step count.** `GET /admin/assessment-flows` takes `page`, `pageSize`, `sortBy`, `sortDirection`, `search` (name + description) and `isActive`, and returns `{ data, pagination }` built from the shared `applyPagination` / `escapeLikePattern` / `buildPaginationMeta` helpers. `stepCount` comes from a left join restricted to active steps, so a soft-deleted step does not inflate it. With no `sortBy` the underlying helper applies no ordering, so a caller paging without a sort gets no stable row order.
- **A flow's `description` clears on an explicit `null`** and survives omission, mirroring the question update contract. Nothing else on the flow update shape is nullable.
- `flow_steps.order` is **not unique** per flow (parallel branches share a value) — reorder logic must account for that; it's not a `sort_order` swap like programme templates.
- **Step updates are validated against the merged row, not the payload**, the same way question updates are. `updateStepService` applies the template clean-up, then checks the type and link the row _will_ carry: only `questions` and `video-assessment` link a template, and an update leaving either of them without one is refused with a 400. So `templateId` clears on an explicit `null` and survives omission, but a `null` sent against a step that still renders a template is rejected rather than stranding a member on a step with no questions. The clean-up fires on **any** update that resends a non-linking type, not only a type change, so a save self-heals a stale `template_id` left by the old contract; a `templateId` the payload sends explicitly still wins over it. **`createStepService` is not policed** — it will happily store a template on an `intro` step, or none on a `questions` one — so a freshly created step is the one case where `type` and `template_id` can still disagree.
- **The flow detail read serves both admin surfaces.** `GET /admin/assessment-flows/:publicId` returns metadata plus the ordered active steps, each carrying `branchingRuleCount`; `assessmentFlowWithStepsSchema` in `schemas/assessment-flow.schema.ts` is the browser-side parse contract for it, so the metadata form and the step builder share one query and one cache entry.
- **Reorder refuses on a branching flow with a 409**, and the seeded flow branches — so the primary flow in `ffp_dev` is exactly the one reorder rejects. `flowHasBranching` is the server's rule; the web builder keeps its own copy (`packages/web/src/utils/flow-branching.ts`) to disable the controls up front, with the server staying authoritative.
- `template_questions` is the mirror image: **`UNIQUE(template_id, display_order)` is enforced**, so a reorder cannot write final positions directly. `reorderTemplateQuestions` parks every row on a temporary negative order first, then writes the positives (the same idiom as `programme-templates/template-session.repository.ts`). Don't copy the flow-step reorder here, or the other way round.
- **Question updates are validated against the merged row, not the payload.** `updateQuestionService` loads the stored question, applies the type-change clean-up, then runs `questionShapeSchema` over the result — so a partial cannot reach a state a create would be refused. `description`, `videoId` and `scoreDimension` clear on an explicit `null` and survive omission; nothing else on the update shape is nullable. Do not put a Zod `.default()` on the shared write base: `.partial()` keeps field defaults, and that is how an omitted `isActive` once reactivated soft-deleted questions.
- A unique-constraint violation that escapes a service's own guard is translated centrally in `lib/database-errors.ts` (called from `lib/lambda-wrapper.ts`), so a lost race answers 409 rather than 500. Domains do not need their own driver-error handling. The constraint name goes to the log, never to the caller. **Only `23505` is mapped** — every other SQLSTATE still reaches the 500 branch.
- **`video-response` questions carry a `min`/`max` duration**, which `VideoResponseQuestion` passes to `NumericQuestion` as the bounds of the result input. An earlier rule treated them as completion-only and rejected the range; it contradicted both the seed data and the renderer, and has been removed.
- `aggregate` branching condition is a **stub** (`condition-evaluator.ts` always returns false) — don't depend on it.
- `scoring_config.programmeMappings[].programmeTemplateId` holds a **slug** in seed data, not a UUID — confirm the lookup contract before building a picker.
- No referential integrity between `scoring_config.dimensions[].questionIds` and the questions table — deleting/deactivating a question silently drops it from scoring. Validate on write if you add scoring-config editing.

## Authoring & testing

- The catalogue ships with seed data — `packages/database/seed/seed{Questions,AssessmentTemplates,AssessmentFlows,FlowSteps}.ts` (idempotent, deterministic UUIDs) — and is also authored through the admin API under `packages/functions/src/admin/` (`assessment-flows/`, `questions/`, `templates/`). Those routes are keyed on `publicId` and gated on `system_admin`; the pre-existing programme-template routes read by `publicId` but write by UUID, and their child resources (phases, sessions, exercises) are UUID-keyed throughout. The catalogue is `publicId` on the read and on every write, so a page here passes its route parameter straight through; `.claude/rules/identifiers.md` covers where that splits elsewhere.
- Tests: `pnpm --filter=@ffp/core test`. Scoring/branching are pure and unit-test cleanly; user-lifecycle tests need RLS context.
