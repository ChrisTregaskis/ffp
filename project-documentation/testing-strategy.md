# FFP - Testing Strategy Documentation

## Overview

FFP uses a **pragmatic testing approach** optimised for solo development (8h/week): fast unit tests with Vitest, and critical RLS integration tests running against the dev database. This balances development speed with security validation for our multi-tenant healthcare application.

## Testing Philosophy

### Phase 1 Goals (Current)

- **8% code coverage** - Focus on critical paths only
- **Security first** - Multi-tenant isolation must be tested
- **Speed matters** - Fast feedback loop for solo dev
- **Unit tests only** - No E2E or complex mocking frameworks in Phase 1
- **Pragmatic approach** - Test what matters, defer edge cases to post-MVP

### Non-Negotiable Tests

1. **RLS multi-tenant isolation** - Prevents cross-tenant data leakage (integration tests)
2. **Authentication/authorisation flows** - JWT parsing, role validation (unit tests)
3. **Input validation** - All Zod schemas (unit tests)
4. **Assessment scoring logic** - Core business value (unit tests, when implemented)
5. **Program generation** - Critical user journey (unit tests, when implemented)

## Testing Stack

### Phase 1 (Current)

- **Vitest** - Test runner (fast, TypeScript-native)
- **Real Dev Database** - RLS integration tests (critical validation)
- **Transaction Rollbacks** - Test isolation without pollution

### Post-MVP (Deferred)

- **@testing-library/react** - Component testing (when web UI is built)
- **@testing-library/user-event** - User interaction simulation
- **Playwright** - E2E tests (critical paths only)
- **MSW (Mock Service Worker)** - API mocking (if needed)

## Test Types & Distribution

### Phase 1 (Current)

```
Unit Tests (Vitest with mocks - 90% of tests)
├── Service layer business logic
├── Validation logic (Zod schemas)
├── Utility functions (context, errors, logger)
├── Authentication logic
└── Lambda handlers

Integration Tests (Real DB - 10% of tests)
├── RLS policies (multi-tenant isolation) ⭐ CRITICAL
├── Database queries with constraints
└── Transaction rollback patterns
```

### Post-MVP (Future)

```
E2E Tests (Playwright - deferred)
├── Authentication flow
├── Assessment completion
├── Video playback
└── Business portal workflows
```

## Setup Instructions

### Phase 1 Dependencies (Installed)

```bash
# Already installed and configured
pnpm add -D vitest @vitest/ui
```

### Vitest Configuration (Current)

```typescript
// vitest.config.ts (root - monorepo tests)
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.{test,spec}.{ts,tsx}'],
    exclude: ['**/node_modules/**', '**/dist/**', 'packages/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['packages/*/src/**/*.{ts,tsx}'],
      exclude: [
        'node_modules/',
        'tests/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/dist/**',
        'packages/eslint-config/**',
        'packages/prettier-config/**',
      ],
      // Phase 1: 8% coverage target
      thresholds: {
        lines: 8,
        functions: 8,
        branches: 8,
        statements: 8,
      },
    },
  },
});
```

**Package-specific configs**: Each package (`@ffp/core`, `@ffp/database`, `@ffp/functions`, `@ffp/web`) has its own `vitest.config.ts` for package-level tests.

### Post-MVP Dependencies (Deferred)

```bash
# Install when web UI is built and E2E testing is needed
pnpm add -D @testing-library/react @testing-library/user-event @testing-library/jest-dom
pnpm add -D jsdom
pnpm add -D @playwright/test
pnpm add -D msw  # If API mocking needed
```

## Backend Testing

### 1. Unit Tests with Vitest (Fast - 90% of tests)

**Use for:** Business logic, validation, utility functions, service layer operations

**Current test files:**

- `packages/core/src/lib/context.test.ts` - Tenant context extraction (60 tests)
- `packages/core/src/lib/errors.test.ts` - Custom error hierarchy
- `packages/core/src/lib/logger.test.ts` - Structured logging
- `packages/core/src/lib/lambda-wrapper.test.ts` - Error handling middleware
- `packages/core/src/lib/cognito.test.ts` - Cognito service wrapper
- `packages/core/src/schemas/auth.schema.test.ts` - Zod validation schemas
- `packages/core/src/schemas/user.schema.test.ts` - User schemas

**Example Test (from actual codebase):**

```typescript
// packages/core/src/lib/context.test.ts
import { describe, it, expect } from 'vitest';
import { extractUserContext } from './context';
import type { APIGatewayProxyEventV2 } from 'aws-lambda';

describe('extractUserContext', () => {
  it('extracts valid user context from JWT claims', () => {
    const event = {
      requestContext: {
        authorizer: {
          jwt: {
            claims: {
              sub: 'user-123',
              'custom:tenantId': 'tenant-abc',
              'custom:customerId': 'customer-xyz',
              'custom:role': 'programme_user',
              email: 'test@example.com',
            },
          },
        },
        requestId: 'req-123',
        timeEpoch: 1699999999000,
      },
    } as unknown as APIGatewayProxyEventV2;

    const context = extractUserContext(event);

    expect(context.actor.type).toBe('user');
    expect(context.actor.userId).toBe('user-123');
    expect(context.tenantId).toBe('tenant-abc');
    expect(context.customerId).toBe('customer-xyz');
    expect(context.role).toBe('programme_user');
  });

  it('throws ValidationError when tenantId is missing', () => {
    const event = {
      requestContext: {
        authorizer: {
          jwt: {
            claims: {
              sub: 'user-123',
              'custom:role': 'programme_user',
              email: 'test@example.com',
            },
          },
        },
        requestId: 'req-123',
        timeEpoch: 1699999999000,
      },
    } as unknown as APIGatewayProxyEventV2;

    expect(() => extractUserContext(event)).toThrow('Missing required JWT claim: custom:tenantId');
  });
});
```

### 2. RLS Integration Tests (Real Database - 10% of tests)

**Use for:** Multi-tenant isolation validation (CRITICAL for security)

**Current test files:**

- `packages/database/__tests__/integration.test.ts` - Database integration tests
- `packages/database/src/lib/rls.test.ts` - RLS helper function tests (16 tests)
- `packages/database/src/client.test.ts` - Database client tests

**Test helpers location:**

- `packages/database/__tests__/helpers.ts` - Contains `withTestDb`, `withRLS`, `createTestTenant`, `createTestUser`

**Example RLS Test (from actual codebase):**

```typescript
// packages/database/src/lib/rls.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { withTestDb, withRLS, createTestTenant, createTestUser } from '../../__tests__/helpers';
import { getTenantContext } from './rls';

describe('RLS Multi-Tenant Isolation', () => {
  it('prevents cross-tenant access to users table', async () => {
    await withTestDb(async (db) => {
      // Create two tenants
      const tenant1 = await createTestTenant(db, 'individual');
      const tenant2 = await createTestTenant(db, 'individual');

      // Create users in each tenant
      await createTestUser(db, tenant1.id, 'user1@test.com');
      await createTestUser(db, tenant2.id, 'user2@test.com');

      // Set RLS context to tenant1
      await withRLS(db, tenant1.id, async () => {
        const users = await db.query.users.findMany();

        // Should only see tenant1's user
        expect(users).toHaveLength(1);
        expect(users[0].email).toBe('user1@test.com');
        expect(users[0].tenant_id).toBe(tenant1.id);
      });
    });
  });

  it('allows tenant to see own data', async () => {
    await withTestDb(async (db) => {
      const tenant = await createTestTenant(db, 'individual');
      const user = await createTestUser(db, tenant.id, 'test@example.com');

      await withRLS(db, tenant.id, async () => {
        const users = await db.query.users.findMany();

        expect(users).toHaveLength(1);
        expect(users[0].id).toBe(user.id);
      });
    });
  });
});
```

**Key Features:**

- ✅ All tests run in transactions (automatic rollback)
- ✅ No database pollution
- ✅ RLS context automatically set and cleared
- ✅ Test helpers ensure consistent patterns
- ✅ 68 total database tests, including 16 RLS-specific tests

## Frontend Testing (Post-MVP)

**Status:** Deferred until web UI is built (FFP-16 and beyond)

**Rationale:**

- Current web package has minimal starter template only
- Solo developer with 8h/week capacity
- Better ROI focusing on backend/API testing in Phase 1
- React component testing will be added when UI features are implemented

**Future approach:**

- Vitest + @testing-library/react for component tests
- Focus on critical user interactions only
- Test accessibility (aria labels, keyboard navigation)
- Defer visual regression testing to Phase 2+

## E2E Testing with Playwright (Post-MVP)

**Status:** Deferred to post-MVP

**Rationale:**

- High setup/maintenance cost for solo developer
- Web UI not built yet (requires FFP-16 completion)
- Manual testing sufficient for MVP validation
- E2E tests provide most value with stable UI and multiple user flows

**When to implement:**

- After FFP-16 (Web Login Interface) is complete
- When assessment flow is implemented
- Before hiring additional team members
- When preparing for beta users

**Future critical E2E flows:**

1. Authentication (login, password reset)
2. Assessment completion (start to program generation)
3. Video playback and progress tracking
4. Business portal workflows (multi-user)

## Test Execution

### NPM Scripts (Current)

```json
{
  "scripts": {
    "test": "turbo test",
    "test:root": "vitest run tests/",
    "test:root:watch": "vitest tests/",
    "test:root:ui": "vitest --ui tests/",
    "test:unit": "vitest run --exclude='**/*.integration.test.ts'",
    "test:coverage": "vitest run --coverage"
  }
}
```

**Package-specific test commands:**

```bash
# Test specific package
turbo test --filter=@ffp/core
turbo test --filter=@ffp/database
turbo test --filter=@ffp/functions

# Test with coverage
pnpm test:coverage
```

### Running Tests (Phase 1)

```bash
# All tests (unit + RLS integration) - Default
pnpm test

# Watch mode for TDD
pnpm test:root:watch

# Interactive UI mode
pnpm test:root:ui

# Coverage report (HTML + terminal)
pnpm test:coverage

# Package-specific tests
turbo test --filter=@ffp/core      # 125 tests (context, errors, logger, cognito, schemas)
turbo test --filter=@ffp/database  # 68 tests (RLS, integration, client)
```

### Test Output

```
 RUN  v2.1.4 /Users/.../ffp

 ✓ packages/core/src/lib/context.test.ts (60 tests)
 ✓ packages/core/src/lib/errors.test.ts (22 tests)
 ✓ packages/core/src/lib/logger.test.ts (15 tests)
 ✓ packages/core/src/lib/cognito.test.ts (12 tests)
 ✓ packages/core/src/schemas/auth.schema.test.ts (8 tests)
 ✓ packages/database/src/lib/rls.test.ts (16 tests)
 ✓ packages/database/__tests__/integration.test.ts (30 tests)

 Test Files  7 passed (7)
      Tests  185 passed (185)
   Duration  2.3s (transform 45ms, setup 0ms, collect 234ms, tests 1.8s)
```

## Sprint Planning Requirements (Phase 1)

### User Story Test Requirements

**MANDATORY:** When creating user stories during sprint planning, a **minimum of 2 unit tests** are required per story.

**Test Types by Story Size (Phase 1 - Unit Tests Only):**

- **Small story** (1-3 points): 2 unit tests minimum
- **Medium story** (4-6 points): 3-5 unit tests
- **Large story** (7+ points): 5+ unit tests

**RLS Integration Tests:** Only add when story modifies database schema or queries.

**Example User Story (Phase 1):**

```
As a user, I want to submit an assessment so that I can receive a personalised program.

Acceptance Criteria:
- User can answer all required questions
- Validation prevents invalid submissions
- Program is generated upon completion

Required Tests (Phase 1):
1. Unit: Assessment validation logic rejects invalid answers
2. Unit: Program generator creates correct session structure
3. Unit: Service orchestrates validation → generation flow
4. RLS Integration: Prevents cross-tenant program access (if new DB queries added)
```

**Post-MVP Test Requirements:**

- Add E2E tests for critical user journeys
- Add frontend component tests when UI is built
- Increase coverage targets incrementally

## Test Data Management

### Test Helpers (Actual Implementation)

Test helpers are located in `packages/database/__tests__/helpers.ts`:

```typescript
// Simplified example from actual codebase
export const withTestDb = async <T>(fn: (db: ExtendedDb) => Promise<T>): Promise<T>;
export const withRLS = async <T>(
  db: ExtendedDb,
  tenantId: string,
  fn: () => Promise<T>
): Promise<T>;
export const createTestTenant = async (
  db: ExtendedDb,
  type: 'individual' | 'business'
): Promise<Tenant>;
export const createTestUser = async (
  db: ExtendedDb,
  tenantId: string,
  email: string
): Promise<User>;
export const createTestCustomer = async (db: ExtendedDb, tenantId: string): Promise<Customer>;
```

**Key features:**

- Automatic transaction rollback (no database pollution)
- RLS context management
- Type-safe with Drizzle schemas
- Consistent test data patterns

### Environment Configuration

```bash
# .env (used for local dev and tests)
DB_HOST=localhost
DB_PORT=5432
DB_NAME=ffp_dev          # Use ffp_test for separate test DB (optional)
DB_USER=root_user
DB_PASSWORD=root_password
LOG_LEVEL=error          # Reduce noise in test output
```

**Note:** All tests run in transactions that rollback, so no separate test database required in Phase 1.

## CI/CD Integration (Future)

**Status:** Deferred to Sprint 3+

**Phase 1 Approach:**

- Manual test execution before commits (`pnpm test`)
- Manual code review and deployment
- GitHub repository (no automated CI/CD yet)

**Future GitHub Actions Workflow:**

```yaml
# .github/workflows/test.yml (example for future implementation)
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: ffp_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432

    steps:
      - uses: actions/checkout@v3

      - uses: pnpm/action-setup@v2
        with:
          version: 9

      - uses: actions/setup-node@v3
        with:
          node-version: '20'
          cache: 'pnpm'

      - run: pnpm install

      - name: Run all tests
        env:
          DB_HOST: localhost
          DB_PORT: 5432
          DB_NAME: ffp_test
          DB_USER: postgres
          DB_PASSWORD: postgres
        run: pnpm test

      - name: Upload coverage
        uses: codecov/codecov-action@v3
```

## Best Practices (Phase 1)

### DO ✅

- **Test behaviour, not implementation** - Focus on what the code does, not how
- **Use descriptive test names** - `it('prevents cross-tenant data access')` not `it('works')`
- **Arrange-Act-Assert pattern** - Clear test structure
- **Test one thing per test** - Easier to debug failures
- **Use Vitest mocks for external dependencies** - `vi.fn()`, `vi.mock()`
- **Use test helpers** - Consistent patterns in `packages/database/__tests__/helpers.ts`
- **Transaction rollbacks** - All RLS tests automatically rollback
- **Write tests for new code** - Before or during implementation

### DON'T ❌

- **Don't test framework code** - Vitest, Drizzle, AWS SDK already tested
- **Don't test implementation details** - Test public interfaces only
- **Don't skip RLS tests** - Critical for multi-tenant security (non-negotiable)
- **Don't commit commented-out tests** - Delete or fix them
- **Don't use production database for tests** - Always use dev database
- **Don't test every edge case** - Focus on critical paths in Phase 1
- **Don't use `any` types in tests** - Maintain strict TypeScript
- **Don't over-engineer tests** - Simple, readable tests > clever tests

## Coverage Goals

### Phase 1 (Current - Achieved ✅)

```
Overall: 8%+ ✅ (Target achieved with 185 tests)
Critical paths tested:
  - RLS policies: 16 tests ✅
  - Authentication: JWT parsing, context extraction ✅
  - Error handling: Custom error hierarchy ✅
  - Input validation: Zod schemas ✅
  - Logging: Structured logging with actor context ✅
```

### Phase 2 (Future)

```
Overall: 30%
Critical paths: 80%+
  - Assessment scoring
  - Program generation
  - Video management
```

### Phase 3+ (Future)

```
Overall: 60%+
E2E coverage for critical user journeys
Frontend component coverage
```

## Debugging Tests

### Vitest UI (Installed)

```bash
pnpm test:root:ui
```

Opens interactive browser UI for running/debugging tests with visual feedback.

### Vitest Watch Mode

```bash
pnpm test:root:watch
```

Automatically re-runs tests on file changes (great for TDD).

### Common Issues (Phase 1)

**RLS tests fail with "connection refused":**

- Ensure dev database is running (`docker ps` or check PostgreSQL service)
- Check `.env` has correct DB credentials
- Verify connection: `psql -h localhost -U root_user -d ffp_dev`

**Tests pass locally but fail on different machine:**

- Ensure `.env` file exists with database credentials
- Check Node version (`node -v` should be 20+)
- Run `pnpm install` to ensure dependencies match
- Verify database migrations applied (`pnpm db:push` or `pnpm db:migrate`)

**"Module not found" errors:**

- Run `pnpm build` to build `@ffp/core` and `@ffp/database` packages
- Check Turborepo cache: `pnpm clean` then `pnpm install`
- Verify workspace dependencies use `workspace:*` protocol

**Vitest doesn't find test files:**

- Check `vitest.config.ts` `include` patterns
- Ensure test files match `*.test.ts` or `*.spec.ts` naming
- Package tests should be in `src/**/*.test.ts` or `__tests__/*.ts`

## Resources

### Documentation

- [Vitest Docs](https://vitest.dev/) - Test runner and coverage
- [Drizzle ORM Docs](https://orm.drizzle.team/) - Database queries in tests
- [Zod Docs](https://zod.dev/) - Schema validation testing

### Internal Docs

- `database-schema.md` - RLS policy details and schema
- `coding-standards.md` - Test code standards and patterns
- `security.md` - Security testing requirements
- `authentication.md` - JWT and context extraction patterns

### Test File Locations

```
packages/
├── core/
│   └── src/
│       ├── lib/
│       │   ├── context.test.ts          # 60 tests
│       │   ├── errors.test.ts           # 22 tests
│       │   ├── logger.test.ts           # 15 tests
│       │   ├── cognito.test.ts          # 12 tests
│       │   └── lambda-wrapper.test.ts   # 8 tests
│       └── schemas/
│           ├── auth.schema.test.ts      # 8 tests
│           └── user.schema.test.ts      # Additional tests
│
├── database/
│   ├── __tests__/
│   │   ├── helpers.ts                   # Test helper utilities
│   │   ├── integration.test.ts          # 30 tests
│   │   └── drizzle.test.ts              # Basic smoke tests
│   └── src/
│       ├── lib/
│       │   └── rls.test.ts              # 16 RLS-specific tests
│       └── client.test.ts               # Client connection tests
│
└── functions/
    └── tests/
        └── index.test.ts                # Basic package tests
```

---

**Last Updated:** November 2025
**Version:** 2.0 (Phase 1 Pragmatic Approach)
**Status:** Phase 1 Complete - Unit + RLS Testing Operational ✅
