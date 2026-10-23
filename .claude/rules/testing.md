---
paths:
  - '**/*.test.ts'
  - '**/*.test.tsx'
  - '**/tests/**'
  - '**/__tests__/**'
---

# Contract: writing tests

Loads when editing any test file. A green test is evidence only if it would go red when the code it guards is wrong; these rules exist because many tests on the security path did not.

## Must hold

1. **A test must fail when its title is false.** Before calling a test done, break the line it guards once and watch it go red. If you can't name that line, the test doesn't have a target.
2. **Never assert on a mock of the unit under test.** Never assert that a mock returned what you told it to return. Mock the unit's dependencies, and assert on what the unit did with them: the arguments it passed, the value it returned.
3. **Literals for external contracts.** Cognito claim and attribute names, HTTP status codes, SQLSTATEs and URL shapes go in tests as literals, never via the constant under test.
4. **Assert the value that matters, not its neighbour.**
   - No bare `toHaveBeenCalled()`, `toBeDefined()` or `toBeTruthy()` where a specific value is knowable.
   - Use `objectContaining` only when you can say which ignored field doesn't matter.
   - Assert the config a library receives (e.g. Pool `ssl`), not the log line that describes it.
5. **Errors: assert the detail, not just the class.** `rejects.toMatchObject({ details: { … } })`, because several paths throw the same class.
6. **Security rules are tested in the denying direction.** Every access rule (RLS policy, route role, ownership check, invite role) needs a case where the wrong actor is refused. A case where the right actor is admitted proves nothing about the rule.
7. **Integration over mocks for repository and RLS behaviour.** SQL, unique indexes, RLS and transactions are tested against `ffp_test`.
   - Set RLS context only with `SET LOCAL` inside a transaction.
   - Scope clean-up and assertions to the rows the test created.
   - Never swallow a clean-up failure.
8. **Build fixtures through the real path.** Use a factory or the schema's `.parse`, never a hand-built literal behind `as unknown as` or `as never`. Test files are typechecked by `pnpm typecheck`; keep them clean.
9. **Don't test the platform or the config file.**
   - No tests of Zod's own `required`, `.omit()`, `.partial()` or enum behaviour.
   - No tests of `JSON.stringify` or `crypto.randomUUID`.
   - No tests that restate a config file's text.
   - Test our rule, the refinement or transform we wrote.
10. **No assertions only inside `if`, loops or callbacks** unless guarded by `expect.assertions(n)`. Assert the discriminant unconditionally first.
11. **Don't assert Tailwind classes** unless the class _is_ the behaviour (e.g. `sr-only`, `hidden`). Prefer roles, names and states.
12. **Reproduce library callback ordering with the real library.** For a TanStack, react-hook-form or router interaction, one test drives the real `useMutation` / `mutateAsync` / navigation, not a hand-written `Promise.resolve().then(...)`. jsdom passing is not evidence a same-tick race is safe; check it in a browser.
13. **No environment-gated assertions.** If behaviour depends on time zone, `LOG_LEVEL`, `dist` existing or seed rows, pin that input inside the test.
14. **One rule, one home.** Assert a rule at the lowest level that owns it. Higher levels get one wiring case, not a copy of the permutations.
