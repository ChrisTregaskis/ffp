# Kickoff Track — Hand a Track to a Track Principal

Epic-principal action. Refine **one** track and draft the **track-principal handover** that spins up a dedicated session to orchestrate it. **Orchestrate, don't implement.** One track at a time — don't kick off the next track until this one's completion summary is back.

**Arguments**: $ARGUMENTS — a track id or name (e.g. `Track 1`, `T1`, or its slug). If absent, infer the next un-started track from `roadmap.md`.

---

## Phase 1 — Load & check readiness

1. Read `.claude/local/plans/project-state.md`, `.claude/local/plans/roadmap.md`, and the epic plan `.claude/local/plans/epics/<slug>.md` — focus on the named track: its stories, effort, dependencies, sequencing, and the cross-cutting concerns + open questions that touch it.
2. Confirm the track's prerequisites are met (check the roadmap working notes for completed dependency tracks/stories). If the track is blocked, say so and **stop** — don't hand off blocked work.

## Phase 2 — Refine the track

3. Finalise the **story sequence** within the track and the **branch strategy** (one story/one branch, or a shared feature branch for tightly-coupled stories landing in one PR).
4. Pull the epic plan's open questions that touch this track and note **which story resolves each**.
5. Note the **reuse pointers** (existing files/patterns to model on) relevant to this track.

## Phase 3 — Draft the track-principal handover

6. Write the handover to `.claude/local/plans/prompts/<track-slug>-track-principal.md`, using this shape:

   ```markdown
   You are the **track principal** for **<Track N — name>** of the **<Epic>** epic. Suggest renaming this session to `<Track N name> — Track Principal`.

   Orchestrate, don't implement. You own this track's stories, draft one implementation kickoff at a time, hold the completion gate, absorb each story's completion summary, and roll the track up into a track-completion summary for the epic principal.

   ## Read first

   project-state.md → roadmap.md → epic plan (this track's section) → spike/domain map → relevant `.claude/rules/`.

   ## This track

   <goal in the epic's context> · <ordered story list with effort + dependencies> · <branch strategy>

   ## Decisions inherited (do not relitigate)

   <the epic-level decisions that bind this track>

   ## Open questions to resolve (with a recommendation, when the owning story is picked up)

   <question → owning story>

   ## How to run

   - `/pick-up <story-id>` one story at a time → hand me (the user) the impl kickoff to paste into an implementation session.
   - Completion gate: the impl session stops after demonstrating work; I review and ask for wrap-up. Then absorb its `.claude/local/notes/<story-id>-completion-summary.md`, append a dated entry to `roadmap.md`, mark the story done, and sequence the next story.
   - Don't pre-draft beyond the next story.

   ## On track completion

   Write a track-completion summary to `.claude/local/notes/<track-slug>-completion-summary.md` (what shipped across the track, deltas from scope, carry-forwards grouped by destination track, open items) and tell me it's ready to hand up to the epic principal.

   ## Guardrails

   Orchestrate, don't implement · git history writes are mine (checkout/branch fine) · British English · wellness vocabulary · no `.claude/local` or phase/gate labels in shipped code · RLS unchanged · Jira dormant.

   ## First action

   Confirm context, summarise the track, then `/pick-up <first story-id>`.
   ```

7. Update `roadmap.md`: note in the working-notes journal that `<Track N>` is kicked off.

## Output

Give me the track-principal handover to paste into a fresh session (the track-principal / bottom-left pane). Remind me the epic principal **waits** for this track's completion summary before kicking off the next track.

## Constraints

- British English throughout.
- **Orchestrate, don't implement** — no feature code, no story-level scoping (that's the track principal's `/pick-up`).
- **One track at a time.** Don't draft handovers for tracks whose prerequisites aren't complete.
- **Do not run git mutations** — I control git. Reads + branch creation are fine.
- Jira is dormant — `.claude/local/` is the source of truth.
