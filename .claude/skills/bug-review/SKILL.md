---
name: bug-review
description: Correctness-focused review of the current diff for FFP — multi-angle bug hunt (line-by-line, removed-behaviour, cross-file, plus reuse/simplification/efficiency/altitude cleanup) with a verify pass, written to review-comments.md. Complements the `review` skill (conventions, boundaries, RLS, British English). Surfaces findings only; never edits the code.
argument-hint: [effort: low|medium|high|max] [PR/branch/path]
---

# Bug Review

A correctness-first review of the diff under change. The bug-hunting counterpart to the `review` skill: `review` checks conventions, package boundaries, multi-tenant/RLS discipline and British English; `bug-review` hunts defects a careful reviewer would catch in one sitting, plus reuse/simplification/efficiency/altitude cleanups in the changed code.

Forked from the methodology of the bundled `/code-review` so we own it and bind it to FFP conventions. Two non-negotiable house rules differ from the upstream tool:

1. **Output goes to `.claude/local/notes/review-comments.md`** in our finding format, using the add-or-reconcile rules below — not a JSON dump to chat.
2. **This skill never edits the code under review.** No `--fix` behaviour. Applying or declining a finding is the implementing session's call — it holds the deliverable context. Review surfaces; the author acts. (See `CLAUDE.local.md` → Review Workflow.)

## Effort

Accepts an effort level (`low` / `medium` / `high` / `max`); default **high**. Low/medium → fewer, high-confidence findings (fewer finder angles, single verify). High/max → broader coverage, recall-biased — catching a real bug matters more than the occasional false positive; surface it and let the verify pass and the author filter.

## Phase 0 — Gather the diff

Run `git diff @{upstream}...HEAD` (or `git diff main...HEAD` / `git diff HEAD~1` if there's no upstream). If there are uncommitted changes, or the range diff is empty, also run `git diff HEAD` and include the working-tree changes — the review often runs before the commit. If a PR number, branch, or path was passed as an argument, review that target instead. That diff is the review scope.

## Phase 1 — Find candidates (run angles as independent agents via the Agent tool)

Run the finder angles as independent agents (use `Explore` for read-only finders). Each returns up to ~6 candidates with `file`, `line`, a one-line `summary`, and a concrete `failure_scenario`. Pass every candidate with a nameable failure scenario through to verification — finders that silently drop half-believed candidates are the dominant cause of misses. At low/medium effort, run the correctness angles only.

**Correctness angles:**

- **A — line-by-line diff scan.** Read every hunk, then Read the enclosing function (bugs in unchanged lines of a touched function are in scope — the change re-exposes them). For each line: what input, state, timing makes it wrong? Inverted/wrong conditions, off-by-one, null/undefined deref, missing `await` (async Lambda handlers, Drizzle calls), falsy-zero checks, wrong-variable copy-paste, swallowed errors, unescaped `LIKE` metachars (use `escapeLikePattern`), pagination math.
- **B — removed-behaviour auditor.** For every deleted/replaced line, name the invariant it enforced, then find where the new code re-establishes it. If you can't, that's a candidate. **FFP-critical removals:** a dropped `setRLSContext` in a transaction, a removed `system_admin` gate on an admin write, a narrowed Zod schema, a deleted guard, a removed `organisation_id` filter.
- **C — cross-file tracer.** For each changed function, Grep its callers and check whether the change breaks a call site (new precondition, changed return shape, new exception, ordering). Trace the FFP layers: Handler ↔ Service ↔ Repository signature drift; a changed `@ffp/core` Zod schema or type breaking `@ffp/web`/`@ffp/functions` consumers; a changed API route/response shape breaking the web client (or Postman flows).

**FFP correctness checklist (fold into A–C):**

- RLS context set inside the transaction for every new/changed repository query (user-layer tables); never query outside one. (`.claude/rules/rls.md`)
- `organisationId` from the actor context (JWT), never from request body/params.
- Admin writes to system-managed catalogue tables gated by `system_admin`.
- Zod validation at the service/handler boundary; no `c.req.json()`-equivalent unvalidated input.
- Migrations: `db:generate`→`db:migrate`, both DBs, no `db:push`; backfills handle existing rows; `publicId` used in URLs not UUID.
- Job-queue / transaction correctness (status transitions, retry/backoff, `FOR UPDATE SKIP LOCKED`) where touched.
- React: hook dependency arrays, TanStack Query key correctness/staleness, no state derived-but-duplicated.

**Cleanup angles** (hunt the changed code for quality, not crashes — state the concrete cost in `failure_scenario`):

- **Reuse.** New code re-implementing something the repo already has. Grep shared surfaces (`applyPagination`, `escapeLikePattern`, `formatDateOnly`, `buildPaginationMeta`, `withAdminContext`; `@ffp/core` schemas/types; web components/hooks) and name the existing helper to call instead.
- **Simplification.** Redundant/derivable state, copy-paste with slight variation, deep nesting, dead code. Name the simpler form.
- **Efficiency.** Redundant computation/repeated I/O, N+1 queries, sequential independent awaits that could be `Promise.all`, blocking work on hot paths. Name the cheaper alternative.

**Altitude angle:**

- Is each change at the right layer and depth, or a fragile bandaid? Business logic in a handler instead of a service; a special case bolted onto shared infrastructure instead of generalising the mechanism. State what becomes harder to maintain.

## Phase 2 — Verify (recall-biased)

Dedup near-duplicates (same defect, same location, same reason → keep one). For each remaining candidate, run one verifier agent with the diff, the relevant file(s), and the candidate. It returns exactly one of:

- **CONFIRMED** — constructible from the code.
- **PLAUSIBLE** (default) — realistic state makes it reachable (nil/undefined on a rare-but-reachable path, falsy-zero treated as missing, off-by-one on a non-excluded boundary, a missing RLS context reachable via a system actor, a retry storm). Do **not** refute for being "speculative" when the state is realistic.
- **REFUTED** — only when constructible: factually wrong (quote the line), provably impossible (cite the type/constant/invariant), already handled in this diff (cite the guard), or pure style with no observable effect.

Keep CONFIRMED and PLAUSIBLE; drop REFUTED. At low/medium effort, a single verify pass; at high/max, prefer a second independent verifier for anything security/RLS-shaped.

## Output — reconcile into review-comments.md

Write findings to `.claude/local/notes/review-comments.md` using the **same finding format and add-or-reconcile rules as the `review` skill** (see `.claude/skills/review/SKILL.md` → "Finding format"):

- **Add-or-reconcile by scope.** Read the existing file first. If it already holds findings for **this same change** (a `review` conventions pass ran first, or this is a re-run), **continue the existing numbers and append** — so conventions and correctness accumulate into one artefact. If it's a **stale leftover** from a different branch/deliverable, replace wholesale.
- **Finding format.** Sequential numbering across severities (`B1`, `W1`, `S1`, …), each with: number + category tag, `file:line`, one-line summary, a short reasoning paragraph, Current/Recommended code where relevant.
- **Severity mapping for correctness:** breaks functionality on a reachable path → **Blocking**; likely/edge-case bug or dropped guard → **Warning**; reuse/simplification/efficiency/altitude cleanup → **Suggestion** (Blocking only if it overlaps a real defect). Correctness outranks cleanup when space is tight. A dropped RLS context or auth gate is **Blocking**.
- Update the severity-count table and the `Merge` / `Merge with follow-ups` / `Request changes` recommendation to reflect the combined file.

Then summarise in chat with a pointer to the file. **Do not edit the reviewed code** — list the fixes; the implementing session applies them.
