# Work On Story — Implementation Session

You are an **implementation session**: implement **one story on one branch**, then stop at the completion gate for review. This is the only session type that writes feature code.

**Arguments**: $ARGUMENTS — the story ID (e.g. `T1-2`).

---

## Setup

1. **Read the kickoff** `.claude/local/plans/prompts/<story-id>-kickoff.md` — this is your brief: intent, read-first order, scope, constraints, definition of done. If it's missing, ask me for it (the track principal should have produced it via `/pick-up`).
2. **Read the story file** `.claude/local/plans/user-stories/<track-slug>/us-*.md` and `.claude/local/plans/project-state.md` for context. The story file + kickoff are the source of truth; flag any conflict before proceeding.
3. **Read `.claude/local/notes/review-context.md`** to see what's already on this branch:
   - First story on the branch → you'll **replace** this file with a fresh reviewer brief on completion.
   - Continuation → build on the existing content.
4. **Rename the session** to the kickoff's session name (e.g. `T1-2 Assessment Flow Builder`) via `/rename`.
5. **Confirm the branch.** Create it off the stated base if it doesn't exist (`git checkout -b <branch> <base>` is allowed). Never commit/push.
6. **Load the relevant skill(s)** the kickoff names: `/database`, `/backend`, `/frontend`, `/infrastructure`.

## Implementation

7. **Follow existing patterns** — read 2–3 existing files in the same pattern before writing new ones.
   - **Backend**: layer order Schema → Repository → Service → Handler. Reuse shared utilities (`applyPagination`, `escapeLikePattern`, `formatDateOnly`, `buildPaginationMeta`, `withAdminContext`). Set RLS context in every transaction. Match existing signatures, error classes, logging.
   - **Frontend**: use existing components, never raw HTML elements when a component exists (`FormTextInput`, `FormSelect`, `FormRow`, `FormActions`, `ComposableForm`, `PageContainer`, `PageHeader`, `ContentPanel`, `Table`, `TableControls`, `StatusResult`, `Button`, `Icon`, `Text`, `StaticAlert`, `PageState`). Follow the hook patterns (`useApiTable`, `useAdminXQuery`, `useXDetailQuery`, `useXMutations`), `ffpClient` + `parseApiResponse` + Zod, and the hierarchical query-key factory. One component per file.
   - **General**: prefer extending existing files/utilities over new abstractions. If a new component variant or pattern is needed, **ask before inventing it**.
8. **Implement to the acceptance criteria.** Apply the loaded skill's standards and the constraints in the kickoff (British English; no `.claude/local`/phase-gate jargon in shipped code; package boundaries; RLS; theme components/colours).
9. **Defer tests** unless critical for the feature to function.
10. **Run the gates** before presenting: `pnpm typecheck`, `pnpm lint`, `pnpm test` (as relevant), `pnpm build` if package boundaries changed.

## Completion gate

11. **Demonstrate the work and present status, then STOP.** Do **not** write the completion summary, set the story to done, or wrap up until I review and explicitly ask. If the story has multiple discrete chunks, check in between them and give me time for a light review before continuing.

## On wrap-up (only after I ask)

12. **Replace `.claude/local/notes/review-context.md`** with a reviewer brief: a changed-files tree with M/A markers + one clause per file, the story's goals, acceptance criteria checklist, areas to focus, known limitations, and any questions for the reviewer.
13. **Write the completion summary** to `.claude/local/notes/<story-id>-completion-summary.md`: what shipped, deltas from scope, carry-forwards (grouped by destination track), open items.
14. **Update** the story file status (→ done) and append a dated entry to `roadmap.md`; refresh `project-state.md` active threads.
15. Tell me it's ready for review (`/full-review`, or `/code-review` for a quick correctness-only pass) and for commit — **do not open the PR**.

## Constraints

- British English throughout.
- **Do not run `git add`, `git commit`, `git push`, merge, or open a PR** — I control git. Branch creation + checkout are fine.
- Stop at the completion gate; don't self-approve wrap-up.
- Defer tests unless critical.
- Jira is dormant — the story file + kickoff are the source of truth.
