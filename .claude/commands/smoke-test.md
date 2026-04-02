# Smoke Test — Sprint E2E Verification

Run an E2E smoke test for a sprint's deliverables using Puppeteer MCP against the running application.

**Arguments**: $ARGUMENTS

## Argument Parsing

The argument should be the sprint number (e.g., `10`) or sprint name (e.g., `Sprint 10`). If no argument is provided, infer the current sprint from `.claude/local/project-state.md` or Jira.

---

## Phase 1: Gather Sprint Context

1. **Read project state** from `.claude/local/project-state.md` if it exists, to understand:
   - What stories were delivered in this sprint
   - What features, pages, and API endpoints were added
   - Key design decisions and patterns
   - What was explicitly out of scope

   If the file does not exist, fetch sprint details from **Jira** using Atlassian MCP tools: `project = FFP AND sprint = "Sprint <N>"`.

2. **Read the execution plan** from `.claude/local/plans/sprint-<N>-execution-plan.md` if it exists, for the full subtask breakdown.

3. **Check for existing smoke tests** in `.claude/local/smoke-tests/` — avoid duplicating tests that already exist for prior sprints. If the directory does not exist, create it.

4. **Read Puppeteer tips** from `.claude/local/smoke-tests/README.md` if it exists, for MCP-specific guidance (custom selects, action menus, variable scoping, etc.).

---

## Phase 2: Generate Test Plan

5. **Design test journeys** covering:
   - **List pages**: Table loads, pagination works, search filters, column visibility, empty states
   - **Create flows**: Form renders, validation works, submission creates record, redirect + toast
   - **Edit flows**: Form pre-populates, read-only fields correct, diff-based update, redirect + toast
   - **Error handling**: Invalid input, duplicate records (409), not-found pages (404)
   - **Navigation**: Sidebar links, context nav (back buttons), route protection
   - **Cross-feature**: Relationships between entities (e.g., user → customer association)

6. **Organise journeys** by feature area (e.g., Customer Management, User Management), with numbered steps and expected outcomes.

7. **Write the test guide** to `.claude/local/smoke-tests/sprint-<N>-<slug>.md` following the established format:

   ```markdown
   # Sprint <N> — <Feature> Smoke Test

   **Epic**: <epic key and name>
   **Covers**: <story keys>
   **Last run**: <date> — <status>

   ## Prerequisites

   - Frontend + backend running
   - Database state requirements
   - User logged in as system admin

   ## Test Journeys

   ### Journey 1: <Name>

   1. Step...
   2. Step...

   **Expected**: <outcome>
   ```

8. **Update the README** table in `.claude/local/smoke-tests/README.md` with the new test guide (create it if it doesn't exist).

---

## Phase 3: Execute Smoke Test

9. **Launch Puppeteer** — navigate to `http://localhost:3000`

10. **Ask the user to log in** — the user will authenticate manually (Cognito requires human interaction). Wait for the user to confirm they are logged in before proceeding.

11. **Execute each journey** sequentially:
    - Take screenshots at key verification points (not every click)
    - Use `puppeteer_evaluate` to check DOM state when visual verification is ambiguous
    - If a step fails, screenshot the failure state and continue to the next journey
    - Note any bugs or unexpected behaviour

12. **Report results** after each journey:
    - **Pass/Fail** for each step
    - Screenshots of key states
    - Any bugs found

---

## Phase 4: Summary

13. **Provide a full summary table** of all journeys with pass/fail status:

    ```markdown
    | Journey | Steps | Passed | Failed | Notes |
    | ------- | ----- | ------ | ------ | ----- |
    | ...     | ...   | ...    | ...    | ...   |
    ```

14. **Update the test guide** with the run date and overall status.

15. **Flag any bugs** that need fixing before merge, with file locations and suggested fixes.

---

## Constraints

- Use **British English** throughout
- Do not run `git add`, `git commit`, or `git push`
- Take screenshots at key verification points, not every click
- If a journey fails, continue to the next — don't stop the entire test
- Focus on happy paths with key error cases (this is a smoke test, not exhaustive)
- Use Puppeteer MCP tools: `puppeteer_navigate`, `puppeteer_screenshot`, `puppeteer_click`, `puppeteer_fill`, `puppeteer_evaluate`
- Remember: FFP uses custom `<button>` dropdowns (not native `<select>`), action menus as positioned dropdowns, and `button[type="submit"]` for form submission
- Variable scoping: `puppeteer_evaluate` shares a global scope — avoid redeclaring `const` variables with the same name across calls
