# Task Standards

## Purpose

Tasks represent technical work without direct user-facing value (infrastructure, refactoring, technical debt).

**When to use:**

- Infrastructure setup
- DevOps configuration
- Refactoring
- Documentation updates

---

## Required Fields

| Field            | Value                                                   |
| ---------------- | ------------------------------------------------------- |
| **Issue Type**   | Task (10008)                                            |
| **Summary**      | [Action]: [Outcome]                                     |
| **Story Points** | 1, 2, 3, 5, 8                                           |
| **Labels**       | `infrastructure`, `refactor`, `devops`, `documentation` |

---

## Template

```markdown
## Objective

[What needs to be done and why?]

## Technical Details

### Steps

1. [Step 1]
2. [Step 2]
3. [Step 3]

### Files Modified

- [List files to create/modify]

## Acceptance Criteria

- [ ] Criterion 1
- [ ] Criterion 2

## Verification

[How to verify complete]
```

---

## Examples

### Example 1: SST Infrastructure (5 points)

````markdown
**Summary**: Configure SST infrastructure for API Gateway and Lambda
**Story Points**: 5

## Objective

Setup SST infrastructure for API Gateway + Lambda, enabling serverless backend deployment.

## Technical Details

### Steps

1. Create `stacks/ApiStack.ts`
2. Configure JWT authorizer with Cognito
3. Define routes for auth endpoints
4. Create Lambda handlers in `packages/functions/auth/`
5. Configure environment variables
6. Test deployment to dev

### Files Modified

- `stacks/ApiStack.ts` (new)
- `sst.config.ts` (modified)
- `packages/functions/auth/register.ts` (new)

## Acceptance Criteria

- [ ] SST deploys ApiStack to dev
- [ ] API Gateway endpoint accessible via HTTPS
- [ ] JWT authorizer validates Cognito tokens
- [ ] Lambda functions invokable via API Gateway
- [ ] CloudWatch logs capture invocations

## Verification

```bash
npm run sst deploy -- --stage dev
curl https://<api-id>.execute-api.eu-west-2.amazonaws.com/dev/health
```
````

````

### Example 2: Testing Framework (3 points)

```markdown
**Summary**: Setup Vitest and Playwright testing framework
**Story Points**: 3

## Objective

Configure Vitest (unit) and Playwright (E2E), including MSW for API mocking.

## Technical Details

### Steps
1. Install: vitest, playwright, msw
2. Create vitest.config.ts with coverage settings
3. Configure playwright.config.ts
4. Setup MSW handlers
5. Add example unit test
6. Add example E2E test
7. Configure coverage thresholds (15%)

### Files Modified
- `vitest.config.ts` (new)
- `playwright.config.ts` (new)
- `packages/core/src/mocks/handlers.ts` (new)
- Example test files

## Acceptance Criteria

- [ ] Vitest runs unit tests
- [ ] Playwright runs E2E tests in headless mode
- [ ] MSW intercepts API requests in tests
- [ ] Coverage report generated (8% threshold)
- [ ] Example tests pass

## Verification

```bash
npm run test
npm run test:coverage
npm run test:e2e
````

```

---

## See Also

- **story-points.md** - Estimation guidelines
- **definition-of-done.md** - Task DoD checklist
```
