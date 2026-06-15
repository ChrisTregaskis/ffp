---
name: full-review
description: Run a complete review of the current diff in one go — coordinates the `review` skill (FFP conventions, package/layer boundaries, multi-tenant/RLS discipline, British English, duplicate surface, file bloat) and the `bug-review` skill (correctness bug hunt + reuse/simplification/efficiency/altitude) into a single review-comments.md. Use when you want the full pass without invoking each skill separately.
argument-hint: [effort: low|medium|high|max] [PR/branch/path]
---

# Full Review

A wrapper that runs both review passes against the current diff so the author doesn't have to invoke each by hand. It coordinates — it does not itself review. The two passes are complementary:

- **`review`** — conventions and shape: package/layer boundaries (`Handler → Service → Repository`; `@ffp/database` never imports `@ffp/core`; web imports core only), multi-tenant/RLS discipline, theme components/colours, British English, duplicate surface, file bloat / helper extraction.
- **`bug-review`** — correctness: multi-angle bug hunt (line-by-line, removed-behaviour, cross-file) plus reuse/simplification/efficiency/altitude cleanups, with a verify pass.

## How to run

Run the two passes **sequentially**, in this order, against the same diff:

1. **Invoke the `review` skill first** (via the Skill tool). It establishes `.claude/local/notes/review-comments.md` with the conventions/shape findings, numbered from `B1`/`W1`/`S1`.
2. **Then invoke the `bug-review` skill.** Per its output rules it reads the existing file, sees the conventions findings are for **this same change**, and **continues the numbering** — appending its correctness findings rather than overwriting. The two passes accumulate into one artefact.

Pass any effort argument through to `bug-review` (default high). If a PR/branch/path argument was given to `full-review`, hand the same target to both passes so they review identical scope.

Order matters: `review` writes the file, `bug-review` reconciles into it. Running them the other way also works (add-or-reconcile is symmetric), but conventions-first keeps the numbering intuitive.

## After both passes

Read the final `.claude/local/notes/review-comments.md` and give **one** combined chat summary:

- A single severity-count table (Blocking / Warning / Suggestion) across both passes.
- One or two sentences on the dominant themes (e.g. "clean except one missing RLS context in the new repository and two British-English slips").
- A single `Merge` / `Merge with follow-ups` / `Request changes` recommendation for the whole change.
- A pointer to `.claude/local/notes/review-comments.md`.

## House rules (inherited from both passes)

- **Review surfaces; it never applies.** Neither pass edits the code under review — the combined findings are for the implementing session to act on. Do not apply fixes from this wrapper. (See `CLAUDE.local.md` → Review Workflow; for _applying_ cleanups deliberately, that's the built-in `/simplify`, or `/code-review --fix`, run only when the user asks.)
- **One rolling artefact.** Everything lands in the single `review-comments.md`; do not scatter findings across chat only.
