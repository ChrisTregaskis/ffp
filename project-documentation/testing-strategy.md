# FFP - Testing Strategy Documentation

## Overview

FFP uses a **hybrid testing approach** optimized for solo development: fast mocked unit tests for business logic, with critical RLS integration tests running against the dev database. This balances speed with security validation for our multi-tenant healthcare application.

## Testing Philosophy

### Phase 1 Goals

- **30% code coverage** - Focus on critical paths
- **Security first** - Multi-tenant isolation must be tested
- **Speed matters** - Fast feedback loop for solo dev
- **Pragmatic approach** - Test what matters, skip edge cases initially

### Non-Negotiable Tests

1. **RLS multi-tenant isolation** - Prevents cross-tenant data leakage
2. **Authentication/authorization flows** - JWT parsing, role validation
3. **Input validation** - All Zod schemas
4. **Assessment scoring logic** - Core business value
5. **Program generation** - Critical user journey

## Testing Stack

### Frontend

- **Vitest** - Test runner (fast, TypeScript-native)
- **@testing-library/react** - Component testing
- **@testing-library/user-event** - User interaction simulation
- **Playwright** - E2E tests (critical paths only)

### Backend

- **Vitest** - Test runner
- **Mocked DB Client** - Fast unit tests (95% of tests)
- **Real Dev Database** - RLS integration tests (critical validation)
- **Transaction Rollbacks** - Test isolation without pollution

## Test Types & Distribution

```
Unit Tests (Mocked - 70% of tests)
├── Service layer business logic
├── Repository operations
├── Validation logic (Zod schemas)
├── Utility functions
└── Frontend components

Integration Tests (Real DB - 25% of tests)
├── RLS policies (multi-tenant isolation)
├── Database queries with constraints
├── API endpoint flows
└── Frontend + API integration

E2E Tests (Playwright - 5% of tests)
├── Authentication flow
├── Assessment completion
├── Video playback
└── Business portal workflows
```

## Setup Instructions

### Install Dependencies

```bash
npm install -D vitest @vitest/ui
npm install -D @testing-library/react @testing-library/user-event @testing-library/jest-dom
npm install -D jsdom
npm install -D @playwright/test
```

### Vitest Configuration

```typescript
// vitest.config.ts
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default {
  plugins: [react()],
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./tests/setup.ts"],
    include: ["**/*.{test,spec}.{ts,tsx}"],
    exclude: ["**/node_modules/**", "**/dist/**", "**/*.integration.test.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      include: ["src/**/*.{ts,tsx}", "packages/**/*.{ts,tsx}"],
      exclude: [
        "node_modules/",
        "tests/",
        "**/*.d.ts",
        "**/*.config.*",
        "**/dist/**",
      ],
      thresholds: {
        lines: 30,
        functions: 30,
        branches: 30,
        statements: 30,
      },
    },
  },
};
```

### Test Setup

```typescript
// tests/setup.ts
import "@testing-library/jest-dom";
import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

// Cleanup after each test
afterEach(() => {
  cleanup();
});
```

## Backend Testing

### 1. Unit Tests with Mocked Database (Fast)

**Use for:** Business logic, validation, service layer operations

```typescript
// tests/mocks/db.mock.ts
import { vi } from "vitest";

export interface MockQueryResult<T = any> {
  rows: T[];
  rowCount: number;
}

export const createMockDbClient = () => {
  const mockQuery = vi.fn<[string, any[]], Promise<MockQueryResult>>();

  return {
    query: mockQuery,
    connect: vi.fn(),
    release: vi.fn(),
    end: vi.fn(),
  };
};
```

**Example Test:**

```typescript
// services/__tests__/assessment.service.test.ts
import { describe, it, expect, beforeEach, vi } from "vitest";
import { AssessmentServiceImpl } from "../assessment.service.impl";
import { createMockDbClient } from "../../tests/mocks/db.mock";

describe("AssessmentService", () => {
  let service: AssessmentServiceImpl;
  let mockDb: ReturnType<typeof createMockDbClient>;
  let mockRepo: any;

  beforeEach(() => {
    mockDb = createMockDbClient();
    mockRepo = {
      create: vi.fn(),
      getById: vi.fn(),
      update: vi.fn(),
    };
    service = new AssessmentServiceImpl(mockRepo, mockDb as any);
  });

  it("creates assessment with correct tenant context", async () => {
    const mockAssessment = {
      id: "assessment-123",
      tenant_id: "tenant-abc",
      user_id: "user-xyz",
      template_id: "template-001",
      status: "in_progress",
    };

    mockRepo.create.mockResolvedValue(mockAssessment);

    const result = await service.create(
      "user-xyz",
      "tenant-abc",
      "template-001"
    );

    expect(mockRepo.create).toHaveBeenCalledWith({
      userId: "user-xyz",
      tenantId: "tenant-abc",
      templateId: "template-001",
      status: "in_progress",
      startedAt: expect.any(Date),
    });
    expect(result).toEqual(mockAssessment);
  });

  it("validates answers before saving", async () => {
    const invalidAnswers = { q1: "invalid-option" };

    await expect(
      service.saveProgress("assessment-123", invalidAnswers, {
        tenantId: "tenant-abc",
        userId: "user-xyz",
        role: "individual_user",
      })
    ).rejects.toThrow("Invalid option");
  });
});
```

### 2. RLS Integration Tests (Real Database)

**Use for:** Multi-tenant isolation, RLS policy validation

#### Test Helper Utilities

```typescript
// tests/integration/helpers/db-test-helper.ts
import { Pool, PoolClient } from "pg";

let pool: Pool | null = null;

export async function getTestDbPool(): Promise<Pool> {
  if (!pool) {
    pool = new Pool({
      host: process.env.DB_HOST || "localhost",
      port: parseInt(process.env.DB_PORT || "5432"),
      database: process.env.DB_NAME || "ffp_dev",
      user: process.env.DB_USER || "postgres",
      password: process.env.DB_PASSWORD || "postgres",
    });
  }
  return pool;
}

export async function closeTestDbPool() {
  if (pool) {
    await pool.end();
    pool = null;
  }
}

/**
 * Runs test within a transaction that rolls back after completion.
 * Ensures RLS tests don't pollute the database.
 */
export async function withTransaction<T>(
  fn: (client: PoolClient) => Promise<T>
): Promise<T> {
  const pool = await getTestDbPool();
  const client = await pool.connect();

  try {
    await client.query("BEGIN");
    const result = await fn(client);
    await client.query("ROLLBACK"); // Always rollback
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function createTestTenant(
  client: PoolClient,
  data: { type: "individual" | "business"; name: string }
) {
  const result = await client.query(
    `INSERT INTO tenants (type, name) VALUES ($1, $2) RETURNING *`,
    [data.type, data.name]
  );
  return result.rows[0];
}

export async function createTestUser(
  client: PoolClient,
  data: {
    tenantId: string;
    email: string;
    role: string;
    cognitoSub?: string;
  }
) {
  const result = await client.query(
    `INSERT INTO users (id, tenant_id, email, cognito_sub, first_name, last_name, role)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
    [
      data.cognitoSub || `test-${Date.now()}`,
      data.tenantId,
      data.email,
      data.cognitoSub || `cognito-${Date.now()}`,
      "Test",
      "User",
      data.role,
    ]
  );
  return result.rows[0];
}

export async function setRLSContext(
  client: PoolClient,
  tenantId: string,
  userId?: string
) {
  await client.query("SELECT set_config($1, $2, true)", [
    "app.tenant_id",
    tenantId,
  ]);
  if (userId) {
    await client.query("SELECT set_config($1, $2, true)", [
      "app.user_id",
      userId,
    ]);
  }
}
```

#### RLS Test Examples

```typescript
// tests/integration/rls.test.ts
import { describe, it, expect, afterAll } from "vitest";
import {
  withTransaction,
  createTestTenant,
  createTestUser,
  setRLSContext,
  closeTestDbPool,
} from "./helpers/db-test-helper";

describe("RLS Multi-Tenant Isolation", () => {
  afterAll(async () => {
    await closeTestDbPool();
  });

  it("prevents cross-tenant data access in user_assessments", async () => {
    await withTransaction(async (client) => {
      // Create two separate tenants
      const tenant1 = await createTestTenant(client, {
        type: "individual",
        name: "Tenant 1",
      });
      const tenant2 = await createTestTenant(client, {
        type: "individual",
        name: "Tenant 2",
      });

      const user1 = await createTestUser(client, {
        tenantId: tenant1.id,
        email: "user1@test.com",
        role: "individual_user",
      });
      const user2 = await createTestUser(client, {
        tenantId: tenant2.id,
        email: "user2@test.com",
        role: "individual_user",
      });

      // Create assessment for tenant1
      await client.query(
        `INSERT INTO user_assessments (tenant_id, user_id, template_id, status)
         VALUES ($1, $2, $3, $4)`,
        [tenant1.id, user1.id, "template-001", "in_progress"]
      );

      // Set RLS context to tenant2
      await setRLSContext(client, tenant2.id, user2.id);

      // Try to query assessments - should NOT see tenant1's data
      const result = await client.query("SELECT * FROM user_assessments");

      expect(result.rows).toHaveLength(0); // Critical: Must be empty!
    });
  });

  it("allows business sub-users to see shared tenant data", async () => {
    await withTransaction(async (client) => {
      const businessTenant = await createTestTenant(client, {
        type: "business",
        name: "Acme Corp",
      });

      const owner = await createTestUser(client, {
        tenantId: businessTenant.id,
        email: "owner@acme.com",
        role: "business_owner",
      });

      const subUser = await createTestUser(client, {
        tenantId: businessTenant.id, // Same tenant!
        email: "employee@acme.com",
        role: "business_user",
      });

      // Owner creates assessment
      await setRLSContext(client, businessTenant.id, owner.id);
      await client.query(
        `INSERT INTO user_assessments (tenant_id, user_id, template_id, status)
         VALUES ($1, $2, $3, $4)`,
        [businessTenant.id, owner.id, "template-001", "completed"]
      );

      // Sub-user queries assessments
      await setRLSContext(client, businessTenant.id, subUser.id);
      const result = await client.query("SELECT * FROM user_assessments");

      expect(result.rows).toHaveLength(1); // Can see owner's assessment
      expect(result.rows[0].user_id).toBe(owner.id);
    });
  });
});
```

## Frontend Testing

### Component Tests

```typescript
// components/__tests__/AssessmentCard.test.tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { AssessmentCard } from "../AssessmentCard";

describe("AssessmentCard", () => {
  const mockAssessment = {
    id: "assessment-123",
    template: {
      name: "Fitness Assessment",
      description: "Basic fitness evaluation",
    },
    status: "in_progress",
  };

  it("renders assessment information", () => {
    render(<AssessmentCard assessment={mockAssessment} onStart={vi.fn()} />);

    expect(screen.getByText("Fitness Assessment")).toBeInTheDocument();
    expect(screen.getByText("Basic fitness evaluation")).toBeInTheDocument();
  });

  it("calls onStart when button clicked", () => {
    const onStart = vi.fn();
    render(<AssessmentCard assessment={mockAssessment} onStart={onStart} />);

    fireEvent.click(screen.getByText("Start Assessment"));
    expect(onStart).toHaveBeenCalledWith("assessment-123");
  });

  it("conditionally renders delete button", () => {
    const { rerender } = render(
      <AssessmentCard assessment={mockAssessment} onStart={vi.fn()} />
    );

    expect(screen.queryByText("Delete")).not.toBeInTheDocument();

    rerender(
      <AssessmentCard
        assessment={mockAssessment}
        onStart={vi.fn()}
        onDelete={vi.fn()}
      />
    );

    expect(screen.getByText("Delete")).toBeInTheDocument();
  });
});
```

## E2E Testing with Playwright

### Setup

```bash
npm install -D @playwright/test
npx playwright install
```

### Playwright Configuration

```typescript
// playwright.config.ts
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false, // Sequential for data integrity
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1, // Single worker for DB consistency
  reporter: "html",
  use: {
    baseURL: process.env.E2E_BASE_URL || "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
  },
});
```

### E2E Test Example

```typescript
// tests/e2e/assessment-flow.spec.ts
import { test, expect } from "@playwright/test";

test("complete assessment and generate program", async ({ page }) => {
  // Login
  await page.goto("/login");
  await page.fill('[data-testid="email"]', "test@example.com");
  await page.fill('[data-testid="password"]', "TestPass123!");
  await page.click('[data-testid="login-btn"]');
  await expect(page).toHaveURL("/dashboard");

  // Start assessment
  await page.click('[data-testid="start-assessment"]');
  await expect(page).toHaveURL(/\/assessments\/.+/);

  // Answer questions
  await page.click('[data-testid="goal-lose-weight"]');
  await page.click('[data-testid="next-question"]');

  await page.click('[data-testid="frequency-3-4"]');
  await page.click('[data-testid="next-question"]');

  await page.click('[data-testid="equipment-basic"]');
  await page.click('[data-testid="submit-assessment"]');

  // Verify program generated
  await expect(page.locator('[data-testid="program-title"]')).toBeVisible();
  await expect(page.locator('[data-testid="session-list"]')).toContainText(
    "Week 1"
  );
});
```

## Test Execution

### NPM Scripts

```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest run --coverage",
    "test:unit": "vitest run --exclude='**/*.integration.test.ts'",
    "test:rls": "vitest run tests/integration/rls.test.ts",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:e2e:debug": "playwright test --debug"
  }
}
```

### Running Tests

```bash
# Fast unit tests (mocked DB) - Run during development
npm run test:unit

# Watch mode for TDD
npm run test:watch

# RLS integration tests (uses dev DB) - Run before commits
npm run test:rls

# All backend tests
npm test

# Coverage report
npm run test:coverage

# E2E tests - Run before deployments
npm run test:e2e

# E2E with UI (for debugging)
npm run test:e2e:ui
```

## Sprint Planning Requirements

### User Story Test Requirements

**MANDATORY:** When creating user stories during sprint planning, a **minimum of 2 functional tests** are required per story.

**Test Types by Story Size:**

- **Small story** (1-3 points): 2 unit tests minimum
- **Medium story** (4-6 points): 2 unit tests + 1 integration test
- **Large story** (7+ points): 3 unit tests + 1 integration test + 1 E2E test

**Example User Story:**

```
As a user, I want to submit an assessment so that I can receive a personalized program.

Acceptance Criteria:
- User can answer all required questions
- Validation prevents invalid submissions
- Program is generated upon completion

Required Tests:
1. Unit: Assessment validation logic rejects invalid answers
2. Unit: Program generator creates correct session structure
3. Integration: RLS prevents cross-tenant program access
4. E2E: Complete assessment flow from start to program view
```

## Test Data Management

### Test Fixtures

```typescript
// tests/fixtures/assessment.fixtures.ts
export const mockAssessmentTemplate = {
  id: "template-001",
  name: "Fitness Assessment",
  version: 1,
  questions: [
    {
      id: "q1",
      type: "single-choice",
      question: "What is your primary goal?",
      options: [
        { value: "lose_weight", label: "Lose weight", score: 1 },
        { value: "build_muscle", label: "Build muscle", score: 2 },
      ],
      validation: { required: true },
    },
  ],
  scoringConfig: {
    strategy: "weighted",
    weights: { q1: 1 },
  },
};

export const mockUserContext = {
  tenantId: "tenant-abc",
  userId: "user-xyz",
  role: "individual_user" as const,
};
```

### Environment Configuration

```bash
# .env.test
SKIP_RLS_TESTS=false
DB_HOST=localhost
DB_PORT=5432
DB_NAME=ffp_dev
DB_USER=postgres
DB_PASSWORD=postgres
LOG_LEVEL=error
```

## CI/CD Integration

### GitHub Actions Example

```yaml
# .github/workflows/test.yml
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

      - uses: actions/setup-node@v3
        with:
          node-version: "18"
          cache: "npm"

      - run: npm ci

      - name: Run unit tests
        run: npm run test:unit

      - name: Run RLS tests
        env:
          DB_HOST: localhost
          DB_PORT: 5432
          DB_NAME: ffp_test
          DB_USER: postgres
          DB_PASSWORD: postgres
        run: npm run test:rls

      - name: Run E2E tests
        run: npm run test:e2e

      - name: Upload coverage
        uses: codecov/codecov-action@v3
```

## Best Practices

### DO ✅

- **Test behavior, not implementation** - Focus on what the code does, not how
- **Use descriptive test names** - `it('prevents cross-tenant data access')` not `it('works')`
- **Arrange-Act-Assert pattern** - Clear test structure
- **Test one thing per test** - Easier to debug failures
- **Mock external dependencies** - Database, APIs, file system
- **Use test fixtures** - Consistent, reusable test data
- **Clean up after tests** - Transaction rollbacks, mocked function resets
- **Write failing tests first** (TDD when possible)

### DON'T ❌

- **Don't test framework code** - React, PostgreSQL already tested
- **Don't test implementation details** - Internal function names, state
- **Don't write brittle tests** - Avoid testing CSS classes, DOM structure
- **Don't skip RLS tests** - Critical for multi-tenant security
- **Don't commit commented-out tests** - Delete or fix them
- **Don't use production database for tests** - Always use dev/test DB
- **Don't test everything** - Focus on critical paths in Phase 1

## Coverage Goals

### Phase 1 (Current)

```
Overall: 30%
Critical paths: 80%+
  - RLS policies: 100%
  - Authentication: 100%
  - Assessment scoring: 80%
  - Input validation: 80%
```

### Phase 2 (Future)

```
Overall: 60%
Critical paths: 90%+
```

### Phase 3 (Future)

```
Overall: 80%+
All paths: 70%+
```

## Debugging Tests

### Vitest UI

```bash
npm run test:ui
```

Opens interactive browser UI for running/debugging tests.

### Playwright Inspector

```bash
npm run test:e2e:debug
```

Step through E2E tests with visual debugging.

### Common Issues

**RLS tests fail with "connection refused":**

- Ensure dev database is running
- Check `.env.test` has correct DB credentials
- Try `psql -h localhost -U postgres -d ffp_dev` to verify connection

**Tests pass locally but fail in CI:**

- Check environment variables are set in CI
- Ensure database is provisioned in CI workflow
- Verify Node version matches local environment

**Flaky E2E tests:**

- Add explicit waits: `await page.waitForSelector('[data-testid="element"]')`
- Use `toBeVisible()` instead of `toBeInTheDocument()` for timing issues
- Run tests sequentially (`workers: 1`) to avoid DB conflicts

## Resources

### Documentation

- [Vitest Docs](https://vitest.dev/)
- [Testing Library Docs](https://testing-library.com/docs/react-testing-library/intro/)
- [Playwright Docs](https://playwright.dev/)

### Internal Docs

- `database-schema.md` - RLS policy details
- `coding-standards.md` - Test code standards
- `security.md` - Security testing requirements

---

**Last Updated:** October 2025  
**Version:** 1.0  
**Status:** Phase 1 Implementation
