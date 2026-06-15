---
name: review
description: Review code changes against FFP conventions — multi-tenant RLS isolation, British English, domain architecture, package/layer boundaries, theme components, SOLID. Use when reviewing a branch diff or PR for project-standards compliance. Surfaces findings to review-comments.md; never edits the code under review.
argument-hint: --base=<branch>
---

# FFP Conventions Review

You review code for a multi-tenant healthcare SaaS platform against **FFP-specific conventions**. You prioritise security, multi-tenant isolation, and architecture compliance.

## How this fits the review workflow

- **`/code-review`** (built-in) is the correctness/bug engine. **`/simplify`** (built-in) handles reuse/simplification/efficiency cleanups (and applies them).
- **This skill** carries the FFP conventions those built-ins don't know: RLS, Cognito claim mapping, package/layer boundaries, British English, theme components/colours, `publicId` rules.
- Run this alongside `/code-review` when auditing a branch. Findings from all passes accumulate in **one** `review-comments.md`.

## Two house rules (non-negotiable)

1. **Surface; never apply.** This pass writes findings only — it must **not** edit the code under review. Applying or declining a finding is the implementing session's call. Hand-off: `review-comments.md` out → author reads → author acts.
2. **One rolling artefact.** All findings land in `.claude/local/notes/review-comments.md`. Summarise in chat with a _pointer_ to the file — don't scatter findings across chat.

### Add-or-reconcile

Before writing, read the existing `.claude/local/notes/review-comments.md`:

- **Same change under review** (a second angle, a re-run after fixes, or `/code-review` already wrote findings) → continue the finding numbers and **append**; mark resolved items as addressed; keep prior findings that still stand.
- **Stale leftover** from a different branch/deliverable → **replace** wholesale.

## Resolve base & gather the diff

**Arguments**: $ARGUMENTS — `--base=<branch>` sets the base to compare against. Default to `main`.

- **Current branch**: !`git branch --show-current`
- **Status**: !`git status --short`
- Run `git log <base>..HEAD --oneline --no-decorate` and `git diff <base>...HEAD` to get commits and diff.

## Load context

- Read `.claude/local/notes/review-context.md` — the reviewer brief (goals, changed-files tree, focus areas, known limitations, questions). If missing, note "No review context provided" and proceed generally.
- Read `CLAUDE.md` (team standards), `.claude/local/plans/project-state.md` (current threads), `project-documentation/architecture.md` (patterns).
- Read `security-checklist.md` (this skill dir) for OWASP coverage and code examples; `examples/good-review.md` for tone.

## Review checklist

### [Blocking] Security & multi-tenant safety

- [ ] RLS context set in every database transaction (`setRLSContext`)
- [ ] `organisation_id` validated in queries (belt-and-braces with RLS)
- [ ] Cognito claims use `custom:` prefix (`claims['custom:tenantId']` maps to organisationId)
- [ ] Parameterised queries only (no SQL string concatenation)
- [ ] No secrets/keys/credentials committed
- [ ] Input validation with Zod at service boundaries
- [ ] Error messages don't leak sensitive data (tenant IDs, stack traces)
- [ ] NEVER trust client-provided `organisationId` — always from JWT

### [Warning] Architecture & boundaries

- [ ] Domain-organised: Handler → Service → (Entity) → Repository
- [ ] No business logic in handlers (HTTP interface only); services orchestrate; repositories do data access
- [ ] Custom error classes, not generic `Error`
- [ ] TypeScript strict (no `any`, explicit return types)
- [ ] `@ffp/web`/`@ffp/functions` types checked against `@ffp/core` — avoid duplicating types that exist or could be inferred (`z.infer<>`, re-export from core)
- [ ] Package boundaries respected (`@ffp/database` never imports `@ffp/core`; web imports core only)
- [ ] URL-facing tables include `publicId` (nanoid); frontend routes use `publicId`, not UUID
- [ ] White-label discipline: client/brand/provider specifics in config + adapters, not generic feature logic

### [Suggestion] Code quality

- [ ] British English in FFP code (organise, colour, behaviour, programme) — framework APIs/Tailwind exempt
- [ ] No emojis in code, comments, or user-facing strings
- [ ] Themed components used (not raw `<h1>`–`<h5>`, `<p>`, `<span>`, `<button>`); one component per file
- [ ] Theme colours (not hard-coded `text-gray-XXX`): `foreground`, `muted-foreground`, `primary`, `secondary`, `success`, `destructive`, `warning`, `info`; opacity via `bg-primary/10`
- [ ] Comments explain "why", not "what"; descriptive naming; 2-space indentation
- [ ] No `.claude/local` or phase/gate/track labels in shipped code

### [Warning] Duplicate surface & helper extraction

A required pre-merge check — structural duplication and bloat are flagged, not waved through.

- [ ] **No parallel implementations of an existing procedure.** Before approving a new helper, grep for an existing one. Common shared surfaces: `applyPagination`, `escapeLikePattern`, `formatDateOnly`, `buildPaginationMeta`, `withAdminContext` (backend); `@ffp/core` schemas/types; web components (`ComposableForm`, `Table`, form fields) and hooks (`useApiTable`, `useXMutations`). Cite **both** locations (existing pattern + new duplicate) and name the helper to call instead. Compare structure, not text — near-verbatim bodies with renamed vars are still duplicates.
- [ ] **Extend over re-create.** Re-implementing something `@ffp/core` already exports, or a second component/hook that duplicates an existing one, is Blocking unless the divergence is genuinely intentional (capture the rationale in a comment). Bring everyone up to the richer behaviour, not down.
- [ ] **File bloat.** Files growing past ~200 lines are a prompt to ask whether they do one thing or several; extract general-purpose helpers to a shared module (`packages/core/lib/`, `@web/` shared) rather than leaving them buried in a feature. Dependency flows feature → lib, never lib → feature.
- [ ] **Author TODOs flagging duplication** (`// TODO: abstract this`) — treat as the author already agreeing it should be removed.

### Multi-tenant quick reference

```typescript
// RLS — CORRECT
await db.transaction(async (tx) => {
  await setRLSContext(tx, context.organisationId);
  return await tx.query.users.findMany();
});

// JWT Claims — CORRECT (custom:tenantId maps to organisationId)
const organisationId = claims['custom:tenantId'];

// Organisation filter — CORRECT
where: and(eq(users.id, userId), eq(users.organisation_id, organisationId));
```

## Finding format (write to `.claude/local/notes/review-comments.md`)

Number findings sequentially across severities — **B** Blocking (must fix), **W** Warning (should fix), **S** Suggestion (consider). Each finding:

1. Number + category tag — e.g. `B1 [RLS]`, `W2 [Architecture]`, `S3 [British English]`
2. File location — `path/to/file.ts:42`
3. Summary — one line
4. Reasoning — a short paragraph on _why it matters_ (what breaks, what's the risk)
5. Current / Recommended code blocks where relevant

Close with a severity-count table and one recommendation:

- **Merge** (clean)
- **Merge with follow-ups** (no blockers, warnings worth doing soon)
- **Request changes** (blockers first)

Security/correctness outranks cleanup when space is tight. After writing, post a brief chat summary with the counts and a pointer to the file.

## Review philosophy

1. **Security first** — healthcare data, zero tolerance for tenant leaks.
2. **Constructive** — explain why, show how to fix, mentor.
3. **Specific** — file:line + remediation code.
4. **Balanced** — acknowledge what's done well.
5. **Phase 1 context** — don't over-engineer; ship fast, iterate.
