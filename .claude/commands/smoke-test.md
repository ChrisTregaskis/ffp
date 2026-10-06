# Smoke Test — E2E Verification

Run an E2E smoke test against the running application using the Claude in Chrome browser tools (`mcp__claude-in-chrome__*`). Invoke the `claude-in-chrome` skill before the first browser call.

**Arguments**: $ARGUMENTS — an epic slug, a feature area (e.g. `assessment-flow-admin`), or `all` for a full-system pass. If absent, infer the most recently delivered work from `.claude/local/plans/roadmap.md`.

---

## Session Setup

Rename the session to `Smoke Test — <area>` via `/rename`.

## Phase 1 — Gather context

1. Read `.claude/local/plans/project-state.md` and `.claude/local/plans/roadmap.md` to understand what was delivered, the pages/endpoints involved, key decisions, and what was explicitly out of scope.
2. Read the relevant epic plan in `.claude/local/plans/epics/` and any completion summaries in `.claude/local/notes/` for the full story breakdown.
3. Check `.claude/local/smoke-tests/` for existing guides — avoid duplicating coverage. Read `.claude/local/smoke-tests/README.md` for browser-driving tips (custom selects, action menus, token-lean page reading).

## Phase 2 — Generate the test plan

4. Design journeys covering: list pages (load, pagination, search/filter, column visibility, empty states); create flows (render, validation, submit, redirect + toast); edit flows (pre-populate, read-only fields, diff-based update); error handling (invalid input, 409 duplicate, 404 not-found); navigation (sidebar, context nav, route protection); cross-feature relationships.
5. Organise journeys by feature area with numbered steps and expected outcomes.
6. Write the guide to `.claude/local/smoke-tests/<area>-<slug>.md`:

   ```markdown
   # <Area> Smoke Test

   **Epic:** <epic name>
   **Covers:** <story IDs>
   **Last run:** <date> — <status>

   ## Prerequisites

   - Frontend + backend running; DB state; logged in as system admin

   ## Test Journeys

   ### Journey 1: <Name>

   1. Step…
      **Expected:** <outcome>
   ```

7. Update `.claude/local/smoke-tests/README.md`'s index with the new guide (create it if absent).

## Phase 3 — Execute

8. Call `tabs_context_mcp`, open a **new** tab with `tabs_create_mcp` (never reuse one of my tabs), and navigate it to `http://localhost:3000`.
9. **Ask me to log in** — Cognito needs human interaction. Wait for my confirmation before proceeding.
10. Execute each journey sequentially. **Navigate by text, verify by eye:** locate and act on elements with `find` / `read_page` (filtered to interactive elements) and `form_input`, and group consecutive actions into one `browser_batch` call where possible. Take a screenshot (`computer` → screenshot) only at key verification points where the visual result matters — layout, spacing, colour, state changes — not to find the next click target. Use `read_console_messages` / `read_network_requests` (with a `pattern` filter) when a step misbehaves. If a step fails, screenshot the failure and continue to the next journey.

## Phase 4 — Report

11. Provide a summary table (Journey | Steps | Passed | Failed | Notes), screenshots of key states, and bugs found.
12. Update the guide with run date and overall status.
13. **Record bugs as findings**, not as fixes — add them to the roadmap backlog (durable), or to `.claude/local/notes/review-comments.md` only when a review of this same branch is already in flight (so they append rather than get replaced). Include file locations and suggested fixes. Surfacing is this command's job; fixing happens in an implementation session.

## Constraints

- British English throughout.
- **Do not run git mutations** — I control git.
- Screenshot key points, not every click. Continue past a failed journey.
- Happy paths + key error cases (smoke test, not exhaustive).
- Browser tools are deferred: load everything the run needs in **one** `ToolSearch` call (`tabs_context_mcp`, `tabs_create_mcp`, `navigate`, `computer`, `read_page`, `find`, `form_input`, `browser_batch`, `read_console_messages`, `read_network_requests`), not one call per tool.
- Prefer text snapshots over screenshots for navigation; an unfiltered `read_page` on a large page is itself expensive, so filter to interactive elements or use `find`.
- FFP uses custom `<button>` dropdowns (not native `<select>`), action menus as positioned dropdowns, and `button[type="submit"]` for form submission.
- Never trigger native `alert`/`confirm` dialogs — they block the extension. Warn me first if a journey must click something that raises one.
- If the extension stops responding after 2–3 attempts, stop and ask rather than retrying.
- Jira is dormant — don't fetch from it; `.claude/local/` is the source of truth.
