# FFP - Testing Strategy

## Overview

Pragmatic testing approach optimised for solo development (8h/week): fast unit tests with Vitest, critical RLS integration tests against the dev database.

## Philosophy

- **Security first** — multi-tenant RLS isolation is non-negotiable
- **Speed matters** — fast feedback loop for solo dev
- **Test behaviour, not implementation** — focus on what code does, not how
- **Pragmatic** — test critical paths, defer edge cases to post-MVP

## Non-Negotiable Tests

1. **RLS multi-tenant isolation** — prevents cross-tenant data leakage (integration tests)
2. **Authentication/authorisation** — JWT parsing, role validation, context extraction (unit tests)
3. **Input validation** — all Zod schemas (unit tests)
4. **Assessment scoring logic** — core business value (unit tests)
5. **Programme generation** — critical user journey (unit tests)

## Test Distribution

```
Unit Tests (Vitest with mocks — 90%)
├── Service layer business logic
├── Validation logic (Zod schemas)
├── Utility functions (context, errors, logger)
├── Authentication logic
└── Lambda handlers

Integration Tests (Real DB — 10%)
├── RLS policies (multi-tenant isolation)
├── Database queries with constraints
└── Transaction rollback patterns
```

## Commands

```bash
pnpm test                          # All tests (unit + integration)
pnpm test:root:watch               # Watch mode (TDD)
pnpm test:root:ui                  # Interactive browser UI
pnpm test:coverage                 # Coverage report
turbo test --filter=@ffp/core      # Package-specific
turbo test --filter=@ffp/database  # Package-specific
```

## Test File Locations

```
packages/core/src/
├── lib/
│   ├── context.test.ts            # Tenant context extraction
│   ├── errors.test.ts             # Custom error hierarchy
│   ├── logger.test.ts             # Structured logging
│   ├── cognito.test.ts            # Cognito service wrapper
│   └── lambda-wrapper.test.ts     # Error handling middleware
└── schemas/
    ├── auth.schema.test.ts        # Auth validation schemas
    └── user.schema.test.ts        # User validation schemas

packages/database/
├── __tests__/
│   ├── helpers.ts                 # withTestDb, withRLS, createTestTenant, createTestUser
│   ├── integration.test.ts        # Database integration tests
│   └── drizzle.test.ts            # Smoke tests
└── src/
    ├── lib/rls.test.ts            # RLS-specific tests
    └── client.test.ts             # Client connection tests
```

## Test Helpers

Located in `packages/database/__tests__/helpers.ts`:

- `withTestDb(fn)` — runs test in transaction with automatic rollback
- `withRLS(db, tenantId, fn)` — sets RLS context for test block
- `createTestTenant(db, type)` — creates test tenant
- `createTestUser(db, tenantId, email)` — creates test user
- `createTestCustomer(db, tenantId)` — creates test customer

All integration tests run in transactions — no database pollution.

## Sprint Planning Requirements

| Story Size          | Minimum Tests  |
| ------------------- | -------------- |
| Small (1-3 points)  | 2 unit tests   |
| Medium (4-6 points) | 3-5 unit tests |
| Large (7+ points)   | 5+ unit tests  |

Add RLS integration tests when story modifies database schema or queries.

## Coverage Goals

| Target                                  | Status   |
| --------------------------------------- | -------- |
| 8% overall, critical paths covered      | Achieved |
| 30% overall, 80%+ critical paths        | Future   |
| 60%+ overall, E2E for critical journeys | Future   |

## Best Practices

**Do:**

- Descriptive test names (`it('prevents cross-tenant data access')`)
- Arrange-Act-Assert pattern
- One assertion focus per test
- Use `vi.fn()` / `vi.mock()` for external dependencies
- Use test helpers for consistent patterns

**Don't:**

- Test framework/library code (Vitest, Drizzle, AWS SDK)
- Skip RLS tests (non-negotiable)
- Use `any` types in tests
- Use production database for tests
- Over-engineer — simple readable tests > clever tests

---

_Frontend component tests (testing-library/react) and E2E tests (Playwright) deferred until web UI is built. CI/CD integration (GitHub Actions with PostgreSQL service) planned for future sprint._
