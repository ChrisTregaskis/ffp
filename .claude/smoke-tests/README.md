# Smoke Tests

Manual E2E smoke tests executed via Claude Code + Puppeteer MCP. These serve as regression tests before staging/production deployments during MVP phase.

## Prerequisites

- Frontend running (`pnpm dev:web`)
- Backend running (`pnpm sst dev` or equivalent)
- Database seeded with test data
- Puppeteer MCP server configured

## Auth Approach

1. Claude launches Puppeteer with `{ headless: false, args: ["--window-size=1440,900"] }`
2. Navigates to `http://localhost:3000`
3. **User logs in manually** (Cognito auth requires human interaction)
4. User confirms when logged in — Claude takes over from there

## Running a Smoke Test

Pass the relevant guide as a prompt to Claude Code:

```
Run the smoke test in .claude/smoke-tests/sprint-9-programme-templates.md
```

For full pre-deployment regression:

```
Run all smoke tests in .claude/smoke-tests/ sequentially
```

## Puppeteer Tips (Learned from Sessions)

- **Viewport**: Set via `launchOptions` on first `puppeteer_navigate` — `{ headless: false, defaultViewport: { width: 1440, height: 900 }, args: ["--window-size=1440,900"] }`
- **Custom selects**: FFP uses custom `<button>` dropdowns, not native `<select>`. Click the trigger button, then find the `<li>` option by text content.
- **Action menus**: Table row "Actions" and card "..." menus render as positioned dropdowns. Use tree walker to find menu items by exact text content.
- **Form submission**: Prefer finding `button[type="submit"]` by text content rather than index, as button order varies.
- **Async waits**: Puppeteer MCP doesn't support `await` in `evaluate`. Use `setTimeout` for delays, or just take a screenshot to check state.
- **Variable scoping**: `puppeteer_evaluate` shares a global scope across calls — avoid redeclaring `const` variables with the same name.

## Test Guides

| Guide                             | Sprint   | Coverage                                                                                                  |
| --------------------------------- | -------- | --------------------------------------------------------------------------------------------------------- |
| `sprint-9-programme-templates.md` | Sprint 9 | Template CRUD, phase/session/exercise hierarchy, video selection, cascade deletes, seed data verification |
