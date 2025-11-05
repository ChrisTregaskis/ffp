# FFP - Jira Ticket Standards

## Overview

This document defines comprehensive standards for creating Jira tickets in the FFP (Fit For Purpose) project. These standards ensure consistency, clarity, and traceability across all development work for our multi-tenant physiotherapy SaaS platform.

**Project Context:**

- **Solo Developer**: Standards emphasize clarity for future reference and external collaboration
- **Multi-Tenant Healthcare SaaS**: Security and data isolation are critical
- **Tech Stack**: React, TypeScript (strict), SST, PostgreSQL, Drizzle, Cognito, Turborepo
- **Testing Focus**: Minimum 2 functional tests per User Story, 15% coverage Phase 1 target

**Jira Configuration:**

- **Cloud ID**: `46fa81a7-bfe9-41ca-90f8-b11f80b8c2bf`
- **Project Key**: `FFP`
- **Available Issue Types**: Epic (10011), Story (10010), Task (10008), Subtask (10012), Bug (10006)

---

## Table of Contents

1. [Epic Standards](#epic-standards)
2. [User Story Standards](#user-story-standards)
3. [Task Standards](#task-standards)
4. [Sub-task Standards](#sub-task-standards)
5. [Bug Standards](#bug-standards)
6. [Story Point Reference](#story-point-reference)
7. [Definition of Done Checklists](#definition-of-done-checklists)
8. [Jira Field Mappings](#jira-field-mappings)
9. [Linking & Hierarchy](#linking--hierarchy)

---

## Epic Standards

### Purpose

Epics represent large bodies of work that span multiple sprints and deliver significant business value. In FFP, epics typically align with major feature areas or architectural components.

**When to use:**

- Work requires multiple sprints (4+ weeks)
- Contains 5+ User Stories
- Delivers a complete feature set to end users
- Represents a major system component

### Required Jira Fields

| Field           | Value                                                           |
| --------------- | --------------------------------------------------------------- |
| **Issue Type**  | Epic (10011)                                                    |
| **Summary**     | Epic: [Feature Area]                                            |
| **Description** | See template below                                              |
| **Epic Name**   | Short descriptor (e.g., "Application Setup")                    |
| **Project**     | FFP                                                             |
| **Priority**    | Highest, High, Medium, Low                                      |
| **Labels**      | `phase-1`, `infrastructure`, `security`, `frontend`, `backend`  |
| **Components**  | `Authentication`, `Assessment Engine`, `Video Management`, etc. |

### Description Template

```markdown
## Business Value

[Why is this epic important? What problem does it solve for users?]

## Scope

### In Scope

- [Major feature 1]
- [Major feature 2]
- [Major feature 3]

### Out of Scope

- [Explicitly exclude items that might cause scope creep]
- [Future phase enhancements]

## Technical Approach

[High-level architectural decisions and patterns]

## Security Considerations

[OWASP compliance, data protection, multi-tenant isolation concerns]

## Dependencies

- [External dependencies]
- [Other epics or infrastructure requirements]

## Success Metrics

- [Measurable outcomes]
- [User adoption or performance metrics]

## User Stories

[List of linked stories - will be populated as stories are created]

## Documentation Updates Required

- [Architecture diagrams]
- [API documentation]
- [Security documentation]
```

### Acceptance Criteria (Epic Level)

Epics should have high-level acceptance criteria that define completion:

```markdown
## Acceptance Criteria

- [ ] All child User Stories marked as Done
- [ ] Integration tests passing for complete feature set
- [ ] Documentation updated in project-documentation/
- [ ] Security review completed (if applicable)
- [ ] Performance benchmarks met (if applicable)
- [ ] Deployed to staging and validated
```

### Story Point Guidelines

**Not estimated.** Epics contain estimated User Stories, which roll up to epic totals.

### Examples

#### Example 1: Sprint 1 Epic

```markdown
**Summary**: Epic: Application Setup & Foundation

**Epic Name**: Application Setup

**Description**:

## Business Value

Establish the core infrastructure and development environment for FFP, enabling rapid feature development with security, scalability, and maintainability built-in from day one. This epic delivers a production-ready foundation for the multi-tenant healthcare SaaS platform.

## Scope

### In Scope

- Turborepo monorepo configuration with packages for web, api, core, and database
- SST infrastructure deployment (API Gateway, Lambda, RDS PostgreSQL)
- AWS Cognito authentication with custom attributes for multi-tenancy
- PostgreSQL schema with Row-Level Security (RLS) policies
- Drizzle ORM setup with type-safe migrations
- CI/CD pipelines (GitHub Actions) for dev, staging, production
- Testing framework (Vitest + Playwright) with MSW for API mocking
- CloudWatch logging and basic monitoring
- Security headers and OWASP compliance baseline

### Out of Scope

- Advanced monitoring (X-Ray, DataDog) - deferred to Phase 2
- Multi-AZ RDS - can upgrade later
- MFA/SSO features - Phase 2
- Load testing - not needed at Phase 1 scale

## Technical Approach

- **Monorepo**: Turborepo with shared packages for type safety and code reuse
- **Infrastructure as Code**: SST for all AWS resources
- **Database**: PostgreSQL 14+ with Drizzle ORM and RLS for tenant isolation
- **Authentication**: Cognito User Pool with custom attributes (`tenantId`, `role`, `customerId`)
- **API**: API Gateway + Lambda with JWT authorizers
- **Testing**: Unit (Vitest), E2E (Playwright), API mocking (MSW)

## Security Considerations

- Row-Level Security (RLS) enforced at database level for all tenant-scoped tables
- JWT validation on all protected API routes
- Zod schema validation for all API inputs
- Secrets stored in AWS Secrets Manager
- Encryption at rest (RDS KMS) and in transit (TLS 1.3)
- CloudWatch audit logging with tenant/user context
- Security Group rules: Private subnets for Lambda/RDS, no public RDS access

## Dependencies

- AWS account with appropriate permissions
- Domain name for production deployment
- GitHub repository for version control
- Cognito User Pool creation
- RDS instance provisioning (t3.small, Single AZ for Phase 1)

## Success Metrics

- [ ] Application deploys to dev, staging, and production environments
- [ ] User can register, login, and receive JWT token with tenant context
- [ ] Database migrations run successfully across environments
- [ ] Unit tests achieve 15% coverage on core business logic
- [ ] E2E tests cover authentication flow
- [ ] CloudWatch logs capture all API requests with tenant context
- [ ] API response time <500ms (p95)
- [ ] Zero critical security vulnerabilities in npm audit

## User Stories

- FFP-1: Setup Turborepo monorepo structure
- FFP-2: Configure SST infrastructure stack
- FFP-3: Implement Cognito authentication with custom attributes
- FFP-4: Create PostgreSQL schema with RLS policies
- FFP-5: Setup Drizzle ORM with migrations
- FFP-6: Configure CI/CD pipelines
- FFP-7: Implement testing framework (Vitest + Playwright + MSW)
- FFP-8: Configure CloudWatch logging and monitoring

## Documentation Updates Required

- architecture.md (infrastructure diagram update)
- authentication.md (Cognito setup details)
- database-schema.md (schema and RLS policies)
- deployment.md (CI/CD workflow)
- coding-standards.md (testing patterns)
```

#### Example 2: Sprint 2 Epic

```markdown
**Summary**: Epic: Assessment Engine Core

**Epic Name**: Assessment Engine

**Description**:

## Business Value

Enable FFP to deliver personalized workout programs through dynamic, JSON-driven assessments. This is the core value proposition: assessing users' fitness levels, goals, and limitations to generate tailored physiotherapy programs. Without this feature, FFP cannot provide personalized recommendations.

## Scope

### In Scope

- JSON-driven question schema with Zod validation
- Multiple question types: single-choice, multi-choice, numeric, scale, text
- Conditional question logic (show/hide based on previous answers)
- Assessment save & resume functionality
- Pluggable scoring strategies: weighted, categorical, rule-based
- Program generation based on assessment results
- Assessment history and versioning
- Multi-tenant data isolation for assessments
- Frontend assessment wizard with progress tracking

### Out of Scope

- Visual question editor (Phase 2)
- A/B testing framework (Phase 2)
- Assessment analytics dashboard (Phase 2)
- AI-powered scoring (Phase 3)

## Technical Approach

- **Question Schema**: Zod schemas for type-safe question definitions stored in PostgreSQL JSONB columns
- **Conditional Logic**: JSONPath-style expressions evaluated at runtime
- **Scoring Engine**: Strategy pattern for pluggable scoring algorithms
- **Program Generation**: Rule-based exercise selection from video library
- **Frontend**: React wizard component with react-hook-form for validation
- **State Management**: Assessment progress saved to database on every question

## Security Considerations

- Assessment responses contain PHI (health information) - treat with high security
- No PHI in CloudWatch logs
- RLS enforced on `user_assessments` table
- Tenant context validation on all assessment queries
- Zod validation on all assessment submission payloads

## Dependencies

- Video library schema (for program generation)
- User authentication system (tenant context)
- PostgreSQL JSONB support
- Assessment templates defined by physiotherapist partner

## Success Metrics

- [ ] User can complete assessment from start to finish
- [ ] Assessment progress auto-saves every 30 seconds
- [ ] User can resume incomplete assessment
- [ ] Scoring algorithms correctly categorize users
- [ ] Program generation selects appropriate exercises based on score
- [ ] Assessment history displays previous attempts
- [ ] Multi-tenant isolation verified (integration tests)
- [ ] Assessment completion rate >70% (no abandonment due to bugs)

## User Stories

- FFP-10: Define assessment question Zod schemas
- FFP-11: Implement conditional question logic engine
- FFP-12: Create assessment service layer with save/resume
- FFP-13: Implement weighted scoring strategy
- FFP-14: Implement categorical scoring strategy
- FFP-15: Build program generation algorithm
- FFP-16: Create frontend assessment wizard component
- FFP-17: Implement assessment history view
- FFP-18: Add integration tests for multi-tenant isolation

## Documentation Updates Required

- assessment-engine.md (question schema, scoring algorithms)
- database-schema.md (assessment tables)
- coding-standards.md (service layer patterns for assessments)
```

---

## User Story Standards

### Purpose

User Stories describe features from the end-user perspective, delivering tangible value. Each story should be completable within a single sprint (1-2 weeks) and independently deployable.

**When to use:**

- Delivers user-facing value
- Can be completed in 1 sprint (5-13 story points)
- Has clear acceptance criteria
- Can be tested independently

### Required Jira Fields

| Field            | Value                                                    |
| ---------------- | -------------------------------------------------------- |
| **Issue Type**   | Story (10010)                                            |
| **Summary**      | As a [user type], I want [action] so that [benefit]      |
| **Description**  | See template below                                       |
| **Epic Link**    | Link to parent Epic                                      |
| **Story Points** | Fibonacci: 1, 2, 3, 5, 8, 13                             |
| **Priority**     | Highest, High, Medium, Low                               |
| **Labels**       | `frontend`, `backend`, `database`, `security`, `testing` |
| **Components**   | Specific component area                                  |
| **Assignee**     | Christopher Tregaskis (solo)                             |
| **Sprint**       | Current sprint                                           |

### Description Template

```markdown
## User Story

As a [user type],  
I want [action/feature],  
So that [benefit/value].

## Background / Context

[Why is this needed? What problem does it solve?]

## Acceptance Criteria

Given [precondition],  
When [action],  
Then [expected outcome].

- [ ] AC1: [Specific, testable criterion]
- [ ] AC2: [Specific, testable criterion]
- [ ] AC3: [Specific, testable criterion]

## Technical Notes

### Implementation Approach

[High-level technical approach, key decisions]

### Database Changes

- [Schema changes if any]
- [Migrations required]

### API Endpoints

- `POST /api/endpoint` - Description
- `GET /api/endpoint/:id` - Description

### Security Considerations

- [RLS validation required]
- [Zod schema for input validation]
- [Auth requirements]

## Testing Requirements

### Unit Tests (Minimum 2)

- [ ] Test case 1: [Description]
- [ ] Test case 2: [Description]

### Integration Tests

- [ ] Test case: [Multi-tenant isolation verification]

### E2E Tests

- [ ] Test case: [Critical user flow]

## Definition of Done

- [ ] Code implemented and follows TypeScript strict mode
- [ ] Zod validation schemas defined and tested
- [ ] Unit tests written and passing (min 2)
- [ ] Integration test for multi-tenant isolation
- [ ] E2E test for critical path (if applicable)
- [ ] Code reviewed (self-review for solo dev)
- [ ] Deployed to dev environment and manually tested
- [ ] Documentation updated (if new pattern introduced)
- [ ] No linting errors
- [ ] No `any` types used

## Dependencies

[List any blockers or dependencies on other stories]

## Out of Scope

[Explicitly state what's NOT included to prevent scope creep]
```

### Acceptance Criteria Format

Use **Given-When-Then** format for clarity:

```markdown
## Acceptance Criteria

**AC1: User can successfully authenticate**  
Given a registered user with valid credentials,  
When they submit the login form,  
Then they should receive a JWT token with tenant context and be redirected to dashboard.

**AC2: Invalid credentials show error**  
Given a user with invalid credentials,  
When they submit the login form,  
Then they should see "Invalid email or password" error message.

**AC3: Multi-tenant isolation enforced**  
Given two users from different tenants,  
When User A queries their data,  
Then User A should only see their own tenant's data (verified by integration test).
```

### Story Point Guidelines

**Fibonacci Scale**: 1, 2, 3, 5, 8, 13

- **1 point**: Trivial (1-2 hours)
  - Update text, fix typo
  - Add simple validation rule
  - Update documentation

- **2 points**: Simple (3-4 hours)
  - New API endpoint with basic CRUD
  - Simple React component
  - Basic Zod schema

- **3 points**: Moderate (5-8 hours)
  - API endpoint with business logic
  - Component with state management
  - Database migration with RLS policy

- **5 points**: Complex (1-2 days)
  - Multiple API endpoints with service layer
  - Complex component with multiple states
  - Integration with external service

- **8 points**: Very Complex (2-3 days)
  - Feature requiring frontend + backend + database
  - Complex business logic with multiple edge cases
  - Significant refactoring

- **13 points**: Too Large (should be split)
  - If a story is 13 points, split into smaller stories

### Examples

#### Example 1: Sprint 1 Story

```markdown
**Summary**: As a new user, I want to register an account so that I can access the FFP platform

**Epic Link**: FFP-EPIC-1 (Application Setup)

**Story Points**: 5

**Description**:

## User Story

As a new user,  
I want to register an account with email and password,  
So that I can access the FFP platform and start creating workout programs.

## Background / Context

This is the first user-facing feature of FFP. User registration must support both individual users and business accounts, with each user assigned a unique `tenantId` at registration time. This story implements the core authentication flow using AWS Cognito.

## Acceptance Criteria

**AC1: Successful registration for individual user**  
Given a new user with valid email and password,  
When they submit the registration form,  
Then a Cognito user is created with custom attributes (`tenantId`, `role`="individual_user"), a database record is created, and they receive a verification email.

**AC2: Registration fails with invalid data**  
Given a user with invalid email format or weak password,  
When they submit the registration form,  
Then they see a validation error message and the form is not submitted.

**AC3: Email already exists**  
Given a user with an email that already exists in Cognito,  
When they submit the registration form,  
Then they see "Email already registered. Please login." error message.

**AC4: Multi-tenant tenantId is unique**  
Given two users registering separately,  
When both registrations complete,  
Then each user should have a unique `tenantId` in their Cognito custom attributes.

## Technical Notes

### Implementation Approach

- Frontend: React form with `react-hook-form` and Zod validation
- Backend: Lambda function `auth/register.ts` that calls Cognito `SignUpCommand`
- Database: Insert user record in `users` table with same `id` as Cognito `sub`
- Cognito: Custom attributes set during signup: `custom:tenantId`, `custom:role`

### Database Changes

- No schema changes (already defined in Epic setup)
- Uses existing `users` table

### API Endpoints

- `POST /auth/register` - Creates Cognito user and database record
  - Request body: `{ email, password, firstName, lastName, accountType }`
  - Response: `{ userId, message: "Registration successful. Check email for verification." }`

### Security Considerations

- Password policy enforced by Cognito: min 8 chars, uppercase, lowercase, digits, symbols
- Zod schema validates email format, password strength, name fields
- Generate `tenantId` server-side using `randomUUID()` - never trust client input
- RLS not applicable during registration (creating new tenant)

## Testing Requirements

### Unit Tests (Minimum 2)

- [ ] Test case 1: Zod schema validates correct registration payload
- [ ] Test case 2: Zod schema rejects invalid email format
- [ ] Test case 3: `randomUUID()` generates unique tenantIds

### Integration Tests

- [ ] Test case: Two registrations create different `tenantId` values
- [ ] Test case: User record in database matches Cognito user attributes

### E2E Tests

- [ ] Test case: End-to-end registration flow from form submission to verification email

## Definition of Done

- [x] Code implemented and follows TypeScript strict mode
- [x] Zod validation schema for registration request
- [x] Unit tests written and passing (3 tests)
- [x] Integration test for unique tenantId generation
- [x] E2E test for registration flow
- [x] Code reviewed (self-review)
- [x] Deployed to dev environment and manually tested
- [x] Documentation updated: authentication.md (registration flow)
- [x] No linting errors
- [x] No `any` types used

## Dependencies

- Cognito User Pool created (from Epic setup)
- Database schema deployed (from Epic setup)

## Out of Scope

- Email verification flow (separate story)
- Business account invitation flow (separate story)
- Social login (Google, Apple) - Phase 2
```

#### Example 2: Sprint 2 Story

```markdown
**Summary**: As a user, I want to answer dynamic assessment questions so that the system can recommend a personalized program

**Epic Link**: FFP-EPIC-2 (Assessment Engine Core)

**Story Points**: 8

**Description**:

## User Story

As a user,  
I want to answer dynamic assessment questions with conditional logic,  
So that the system can generate a personalized workout program based on my responses.

## Background / Context

This story implements the frontend assessment wizard and backend logic to evaluate conditional questions. Users should see only relevant questions based on their previous answers (e.g., if they select "reduce pain" as a goal, they should see additional pain-related questions).

## Acceptance Criteria

**AC1: User can navigate through questions**  
Given a user starts an assessment,  
When they answer a question,  
Then the next relevant question is displayed based on conditional logic, and a progress bar updates.

**AC2: Conditional questions appear correctly**  
Given a user selects "reduce_pain" for goal (q1),  
When they proceed to the next question,  
Then they see the pain level scale question (q2), which was hidden if they selected a different goal.

**AC3: Progress auto-saves**  
Given a user answers 3 questions,  
When the page reloads (or user navigates away),  
Then the user can resume from question 4 with their previous answers preserved.

**AC4: Assessment submission succeeds**  
Given a user completes all required questions,  
When they submit the assessment,  
Then the backend calculates scores, generates a program, and redirects to program view.

## Technical Notes

### Implementation Approach

- Frontend: React wizard component with stepper UI (TailwindCSS)
- State management: `useState` for current question index and answers
- Conditional logic: Evaluate `question.conditionalLogic` rules to determine visible questions
- Auto-save: Debounced API call every 30 seconds or on question change
- Backend: Assessment service validates answers against Zod schema

### Database Changes

- Use existing `user_assessments` table
- Store answers in JSONB `answers` column

### API Endpoints

- `POST /assessments/start` - Creates new assessment instance
- `POST /assessments/{id}/progress` - Saves partial answers
- `POST /assessments/{id}/submit` - Submits final answers, triggers scoring

### Security Considerations

- JWT token required (user must be authenticated)
- Tenant context extracted from JWT and set in RLS
- Zod schema validates all answer payloads
- Assessment answers contain PHI - no logging of answer content

## Testing Requirements

### Unit Tests (Minimum 2)

- [ ] Test case 1: Conditional logic engine correctly shows/hides questions based on answers
- [ ] Test case 2: Progress auto-save debounces correctly (not called on every keystroke)
- [ ] Test case 3: Zod schema validates answer structure

### Integration Tests

- [ ] Test case: Assessment progress saved to database includes correct `tenantId`
- [ ] Test case: Multi-tenant isolation - User A cannot access User B's assessment

### E2E Tests

- [ ] Test case: Complete assessment flow from start to program generation

## Definition of Done

- [ ] Code implemented and follows TypeScript strict mode
- [ ] Zod validation schemas for assessment requests
- [ ] Unit tests written and passing (3 tests)
- [ ] Integration test for multi-tenant isolation
- [ ] E2E test for assessment flow
- [ ] Code reviewed (self-review)
- [ ] Deployed to dev environment and manually tested
- [ ] Documentation updated: assessment-engine.md (conditional logic)
- [ ] No linting errors
- [ ] No `any` types used

## Dependencies

- Assessment template defined in database (from previous story)
- Question schema Zod types defined (from previous story)

## Out of Scope

- Assessment analytics (Phase 2)
- Question branching preview (Phase 2)
- A/B testing different question flows (Phase 2)
```

---

## Task Standards

### Purpose

Tasks represent technical work that doesn't directly deliver user-facing value but is necessary for the project. Tasks are often infrastructure, refactoring, or technical debt.

**When to use:**

- Infrastructure setup
- DevOps configuration
- Refactoring
- Technical debt cleanup
- Documentation updates

### Required Jira Fields

| Field            | Value                                                   |
| ---------------- | ------------------------------------------------------- |
| **Issue Type**   | Task (10008)                                            |
| **Summary**      | [Action]: [Outcome]                                     |
| **Description**  | See template below                                      |
| **Epic Link**    | Link to parent Epic (if applicable)                     |
| **Story Points** | Fibonacci: 1, 2, 3, 5, 8                                |
| **Priority**     | Highest, High, Medium, Low                              |
| **Labels**       | `infrastructure`, `refactor`, `devops`, `documentation` |
| **Components**   | Specific component area                                 |
| **Assignee**     | Christopher Tregaskis (solo)                            |
| **Sprint**       | Current sprint                                          |

### Description Template

```markdown
## Objective

[What needs to be done and why?]

## Technical Details

[Step-by-step implementation approach]

### Steps

1. [Step 1]
2. [Step 2]
3. [Step 3]

### Configuration Changes

- [Config file changes]
- [Environment variables]

### Files Modified

- [List of files to be created/modified]

## Acceptance Criteria

- [ ] Criterion 1
- [ ] Criterion 2
- [ ] Criterion 3

## Verification

[How to verify the task is complete]

## Documentation

[Documentation updates required]

## Dependencies

[Any dependencies or blockers]

## Out of Scope

[What's explicitly not included]
```

### Story Point Guidelines

Same Fibonacci scale as User Stories, but tasks are generally smaller:

- **1 point**: Quick config change (1-2 hours)
- **2 points**: Simple setup (3-4 hours)
- **3 points**: Moderate complexity (5-8 hours)
- **5 points**: Complex infrastructure (1-2 days)
- **8 points**: Very complex (consider splitting)

### Examples

#### Example 1: Sprint 1 Task

````markdown
**Summary**: Configure SST infrastructure stack for API Gateway and Lambda

**Epic Link**: FFP-EPIC-1 (Application Setup)

**Story Points**: 5

**Description**:

## Objective

Setup SST (Serverless Stack) infrastructure configuration for API Gateway and Lambda functions, enabling serverless backend deployment to AWS.

## Technical Details

Create SST stack definitions that provision:

- API Gateway with REST API
- JWT authorizer linked to Cognito User Pool
- Lambda functions for authentication endpoints
- IAM roles with least privilege permissions
- CloudWatch log groups
- Environment variables for all functions

### Steps

1. Create `stacks/ApiStack.ts` with API Gateway configuration
2. Configure JWT authorizer using Cognito User Pool ID
3. Define routes for authentication endpoints (`/auth/register`, `/auth/login`)
4. Create Lambda function handlers in `packages/functions/auth/`
5. Configure function props (runtime, timeout, memory)
6. Set environment variables (DB_HOST, COGNITO_USER_POOL_ID, etc.)
7. Create IAM role with permissions: Cognito, RDS, Secrets Manager
8. Test deployment to dev environment

### Configuration Changes

- Add `stacks/ApiStack.ts`
- Update `sst.config.ts` to include ApiStack
- Add Lambda function code in `packages/functions/auth/register.ts`, `login.ts`

### Files Modified

- `stacks/ApiStack.ts` (new)
- `sst.config.ts` (modified)
- `packages/functions/auth/register.ts` (new)
- `packages/functions/auth/login.ts` (new)

## Acceptance Criteria

- [ ] SST successfully deploys ApiStack to dev environment
- [ ] API Gateway endpoint is accessible via HTTPS
- [ ] JWT authorizer validates Cognito tokens
- [ ] Lambda functions can be invoked via API Gateway
- [ ] CloudWatch logs capture all Lambda invocations
- [ ] Environment variables are correctly injected into Lambda functions
- [ ] IAM roles follow least privilege (no overly broad permissions)

## Verification

```bash
# Deploy SST stack
npm run sst deploy -- --stage dev

# Verify API endpoint
curl https://<api-id>.execute-api.eu-west-2.amazonaws.com/dev/health

# Check Lambda function logs
npm run sst logs -- --stage dev --function auth-register

# Verify environment variables
aws lambda get-function-configuration --function-name ffp-dev-auth-register
```
````

## Documentation

- Update `architecture.md` with API Gateway and Lambda architecture diagram
- Update `deployment.md` with SST deployment commands

## Dependencies

- Cognito User Pool created (from previous task)
- RDS instance created (from previous task)

## Out of Scope

- DynamoDB tables (not used in Phase 1)
- API Gateway usage plans (Phase 2)
- WAF rules (Phase 2)

````

#### Example 2: Sprint 1 Task

```markdown
**Summary**: Setup Vitest and Playwright testing framework

**Epic Link**: FFP-EPIC-1 (Application Setup)

**Story Points**: 3

**Description**:

## Objective

Configure Vitest for unit testing and Playwright for end-to-end testing, including MSW (Mock Service Worker) for API mocking. Establish testing patterns and directory structure for the monorepo.

## Technical Details

Setup comprehensive testing infrastructure:
- Vitest for unit and integration tests
- Playwright for E2E browser testing
- MSW for API request mocking
- Test coverage reporting
- CI integration

### Steps
1. Install dependencies: `vitest`, `@vitest/ui`, `playwright`, `msw`
2. Create `vitest.config.ts` in root with coverage settings
3. Configure Playwright in `playwright.config.ts`
4. Setup MSW handlers in `packages/core/src/mocks/handlers.ts`
5. Create test utilities in `packages/core/src/test/utils.ts`
6. Add example unit test for service layer
7. Add example E2E test for authentication
8. Configure coverage thresholds (15% for Phase 1)
9. Add npm scripts for running tests

### Configuration Changes
- Add `vitest.config.ts` (new)
- Add `playwright.config.ts` (new)
- Update `package.json` with test scripts
- Create `.env.test` for test environment variables

### Files Modified
- `vitest.config.ts` (new)
- `playwright.config.ts` (new)
- `package.json` (modified)
- `packages/core/src/mocks/handlers.ts` (new)
- `packages/core/src/test/utils.ts` (new)
- `packages/functions/__tests__/auth/register.test.ts` (new example)
- `packages/web/e2e/auth.spec.ts` (new example)

## Acceptance Criteria

- [ ] Vitest runs unit tests successfully
- [ ] Playwright runs E2E tests in headless mode
- [ ] MSW intercepts API requests in tests
- [ ] Test coverage report generated (HTML and terminal)
- [ ] Coverage thresholds enforced (15% global)
- [ ] Example unit test passes
- [ ] Example E2E test passes
- [ ] Tests run in CI pipeline (GitHub Actions)

## Verification

```bash
# Run unit tests
npm run test

# Run unit tests with coverage
npm run test:coverage

# Run E2E tests
npm run test:e2e

# Run E2E tests in headed mode (debug)
npm run test:e2e:headed

# Open Vitest UI
npm run test:ui

# Verify coverage threshold
npm run test:coverage -- --reporter=json
````

## Documentation

- Update `coding-standards.md` with testing patterns and examples
- Add testing section to README.md

## Dependencies

- None (can be done early in Sprint 1)

## Out of Scope

- Visual regression testing (Percy, Chromatic) - Phase 2
- Load testing (k6, Artillery) - Phase 2
- Mutation testing - Phase 2

````

---

## Sub-task Standards

### Purpose

Sub-tasks break down User Stories or Tasks into smaller, actionable chunks. They help track progress within a larger piece of work and are typically completed in <4 hours.

**When to use:**
- Breaking down complex stories
- Tracking incremental progress
- Clarifying implementation steps

### Required Jira Fields

| Field | Value |
|-------|-------|
| **Issue Type** | Subtask (10012) |
| **Summary** | [Action verb]: [Specific outcome] |
| **Description** | Brief technical details |
| **Parent Issue** | Link to parent Story or Task |
| **Story Points** | Not estimated (parent story is estimated) |
| **Priority** | Inherits from parent |
| **Labels** | Same as parent |
| **Assignee** | Christopher Tregaskis (solo) |
| **Sprint** | Same as parent |

### Description Template

```markdown
## Objective

[What specific piece of work needs to be done?]

## Technical Details

[Implementation notes, code snippets, file paths]

## Acceptance Criteria

- [ ] Criterion 1
- [ ] Criterion 2

## Verification

[Quick test to verify completion]
````

### Examples

#### Example 1: Sub-task for Registration Story

````markdown
**Summary**: Create Zod schema for registration request validation

**Parent Issue**: FFP-5 (User Registration Story)

**Description**:

## Objective

Define a Zod schema to validate user registration request payloads, ensuring email format, password strength, and required fields are validated before Cognito API call.

## Technical Details

File: `packages/core/src/schemas/auth.schema.ts`

```typescript
import { z } from 'zod';

export const RegisterRequestSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain an uppercase letter')
    .regex(/[a-z]/, 'Password must contain a lowercase letter')
    .regex(/[0-9]/, 'Password must contain a digit')
    .regex(/[^A-Za-z0-9]/, 'Password must contain a special character'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  accountType: z.enum(['individual', 'business']),
});

export type RegisterRequest = z.infer<typeof RegisterRequestSchema>;
```
````

## Acceptance Criteria

- [ ] Schema validates correct payload
- [ ] Schema rejects invalid email
- [ ] Schema rejects weak password
- [ ] Schema rejects missing fields
- [ ] Type exported for use in Lambda handler

## Verification

```bash
# Run unit tests
npm run test packages/core/src/schemas/__tests__/auth.schema.test.ts
```

````

#### Example 2: Sub-task for Infrastructure Task

```markdown
**Summary**: Create Lambda function for user registration

**Parent Issue**: FFP-3 (Configure SST Infrastructure)

**Description**:

## Objective

Create the Lambda function handler for user registration that calls Cognito SignUpCommand and inserts user record in PostgreSQL.

## Technical Details

File: `packages/functions/auth/register.ts`

```typescript
import { APIGatewayProxyHandlerV2 } from 'aws-lambda';
import { CognitoIdentityProviderClient, SignUpCommand } from '@aws-sdk/client-cognito-identity-provider';
import { RegisterRequestSchema } from '@ffp/core/schemas/auth.schema';
import { randomUUID } from 'crypto';
import { db } from '@ffp/database';

const cognito = new CognitoIdentityProviderClient({ region: process.env.AWS_REGION });

export const handler: APIGatewayProxyHandlerV2 = async (event) => {
  // Parse and validate request body
  const body = RegisterRequestSchema.parse(JSON.parse(event.body || '{}'));

  // Generate unique tenantId
  const tenantId = randomUUID();
  const role = body.accountType === 'business' ? 'business_owner' : 'individual_user';

  // Create user in Cognito
  const signUpResult = await cognito.send(new SignUpCommand({
    ClientId: process.env.COGNITO_CLIENT_ID!,
    Username: body.email,
    Password: body.password,
    UserAttributes: [
      { Name: 'email', Value: body.email },
      { Name: 'given_name', Value: body.firstName },
      { Name: 'family_name', Value: body.lastName },
      { Name: 'custom:tenantId', Value: tenantId },
      { Name: 'custom:role', Value: role },
    ],
  }));

  // Store user in PostgreSQL
  await db.insert(users).values({
    id: signUpResult.UserSub!,
    tenantId,
    email: body.email,
    firstName: body.firstName,
    lastName: body.lastName,
    role,
  });

  return {
    statusCode: 200,
    body: JSON.stringify({ message: 'Registration successful', userId: signUpResult.UserSub }),
  };
};
````

## Acceptance Criteria

- [ ] Lambda function parses and validates request body using Zod
- [ ] Function generates unique tenantId using randomUUID()
- [ ] Function calls Cognito SignUpCommand with custom attributes
- [ ] Function inserts user record in PostgreSQL
- [ ] Function returns success response with userId
- [ ] Function handles errors gracefully (Cognito failures, DB failures)

## Verification

```bash
# Test locally with SST dev
npm run sst dev

# Invoke function
curl -X POST https://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!","firstName":"Test","lastName":"User","accountType":"individual"}'
```

````

---

## Bug Standards

### Purpose

Bugs represent defects in the system that prevent it from working as intended. Bugs should be clear, reproducible, and prioritized based on severity and impact.

**When to use:**
- Feature works incorrectly
- Security vulnerability discovered
- Performance degradation
- Data corruption or loss

### Required Jira Fields

| Field | Value |
|-------|-------|
| **Issue Type** | Bug (10006) |
| **Summary** | [Bug]: [Brief description] |
| **Description** | See template below |
| **Priority** | Blocker, Critical, Major, Minor, Trivial |
| **Severity** | Blocker, Critical, Major, Minor, Trivial |
| **Affects Version** | Version where bug was found |
| **Labels** | `production`, `security`, `data-loss`, `performance` |
| **Components** | Specific component area |
| **Assignee** | Christopher Tregaskis (solo) |
| **Sprint** | Current sprint (if in sprint) or Backlog |

### Severity Guidelines

| Severity | Description | Examples |
|----------|-------------|----------|
| **Blocker** | System unusable, no workaround | Database corruption, authentication completely broken, data loss |
| **Critical** | Core functionality broken, limited workaround | Assessment submission fails, program generation broken |
| **Major** | Important feature broken, workaround exists | Video playback fails on mobile, progress tracking incorrect |
| **Minor** | Minor feature broken, minimal impact | UI glitch, typo, minor styling issue |
| **Trivial** | Cosmetic issue, no functional impact | Button alignment off, color inconsistency |

### Description Template

```markdown
## Summary

[One-line description of the bug]

## Environment

- **Version**: [e.g., v1.2.3]
- **Environment**: Production / Staging / Dev
- **Browser/Device**: [e.g., Chrome 118 on MacOS, iPhone 14 Safari]
- **User Type**: Individual / Business Owner / Business User

## Steps to Reproduce

1. [Step 1]
2. [Step 2]
3. [Step 3]

## Expected Behavior

[What should happen]

## Actual Behavior

[What actually happens]

## Impact

[Who is affected? How many users? Business impact?]

## Severity Justification

[Why is this severity level appropriate?]

## Logs / Error Messages

````

[Paste relevant logs, error messages, stack traces]

```

## Screenshots / Videos

[Attach screenshots or videos if applicable]

## Workaround (if any)

[Is there a temporary workaround for users?]

## Root Cause (if known)

[What caused this bug?]

## Fix Proposal

[How should this be fixed?]

## Related Issues

[Links to related bugs, stories, or PRs]
```

### Examples

#### Example 1: Critical Bug

```markdown
**Summary**: [Bug] Assessment submission fails with "Tenant context not set" error

**Priority**: Critical

**Severity**: Critical

**Affects Version**: v1.1.0

**Labels**: `production`, `multi-tenant`, `security`

**Description**:

## Summary

Assessment submission is failing in production with a PostgreSQL error "Tenant context not set" preventing users from completing assessments and receiving workout programs.

## Environment

- **Version**: v1.1.0
- **Environment**: Production
- **Browser/Device**: All browsers, all devices
- **User Type**: All user types (Individual, Business)

## Steps to Reproduce

1. Login as any user
2. Start an assessment
3. Answer all questions
4. Click "Submit Assessment"
5. Error appears: "Failed to submit assessment"

## Expected Behavior

Assessment should be submitted successfully, score should be calculated, and user should be redirected to program view.

## Actual Behavior

Error message appears: "Failed to submit assessment. Please try again."

CloudWatch logs show:
```

{
"level": "ERROR",
"service": "AssessmentService",
"message": "Assessment submission failed",
"error": {
"message": "current_setting('app.tenant_id') is null",
"code": "42704"
}
}

````

## Impact

**Users Affected**: All users attempting to submit assessments (estimated 50+ users since deployment)

**Business Impact**:
- Users cannot complete assessments or receive programs
- Core product functionality broken
- User frustration and potential churn

## Severity Justification

Critical: Core product functionality (assessment submission) is completely broken with no workaround. Affects all users attempting to use the primary feature.

## Logs / Error Messages

```json
{
  "level": "ERROR",
  "service": "AssessmentService",
  "message": "Assessment submission failed",
  "timestamp": "2025-10-17T14:23:45.123Z",
  "tenantId": "550e8400-e29b-41d4-a716-446655440000",
  "userId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "assessmentId": "assessment-123",
  "error": {
    "message": "current_setting('app.tenant_id') is null",
    "code": "42704",
    "stack": "Error: current_setting('app.tenant_id') is null\n    at AssessmentRepository.submit..."
  }
}
````

## Screenshots / Videos

[Screenshot of error message in UI]

## Workaround (if any)

**No workaround available.** Users cannot complete assessments.

## Root Cause (if known)

Lambda function `assessments/submit.ts` is not calling `setRLSContext()` before querying the database, causing the RLS policy to reject the query with null tenant_id.

Likely introduced in commit `abc123` where the submit handler was refactored and the RLS context call was accidentally removed.

## Fix Proposal

1. Add `await setRLSContext(context.tenantId, context.userId)` at the start of the submit handler
2. Add integration test to verify RLS context is set correctly
3. Deploy hotfix to production immediately

**Code fix**:

```typescript
// packages/functions/assessments/submit.ts
export const handler = async (event) => {
  const context = extractTenantContext(event);

  // FIX: Add RLS context before any database operations
  await setRLSContext(context.tenantId, context.userId);

  // Rest of handler...
};
```

## Related Issues

- FFP-15: Original story for assessment submission
- PR #45: Refactor that introduced the bug

````

#### Example 2: Minor Bug

```markdown
**Summary**: [Bug] Video thumbnail not loading for newly uploaded exercises

**Priority**: Minor

**Severity**: Minor

**Affects Version**: v1.2.0

**Labels**: `frontend`, `ui`

**Description**:

## Summary

Newly uploaded exercise videos display a broken image icon instead of the thumbnail in the video library.

## Environment

- **Version**: v1.2.0
- **Environment**: Production
- **Browser/Device**: Chrome 118 on MacOS, Safari on iOS
- **User Type**: All users viewing video library

## Steps to Reproduce

1. Login as any user
2. Navigate to "Video Library"
3. Scroll to recently added exercises (uploaded in last week)
4. Observe broken image icons for thumbnails

## Expected Behavior

Thumbnails should display for all videos, showing a preview image of the exercise.

## Actual Behavior

Broken image icon (broken link icon) appears instead of thumbnail image.

Browser console shows:
````

Failed to load resource: the server responded with a status of 404 (Not Found)
https://d123456789.cloudfront.net/thumbnails/exercise-025-thumb.jpg

```

## Impact

**Users Affected**: All users browsing the video library

**Business Impact**:
- Slightly degraded user experience
- Videos are still playable (functionality not broken)
- Users can still identify videos by title

## Severity Justification

Minor: Cosmetic issue that doesn't prevent core functionality. Videos are still playable and identifiable. Has workaround (users can still read video title).

## Logs / Error Messages

Browser console:
```

GET https://d123456789.cloudfront.net/thumbnails/exercise-025-thumb.jpg 404 (Not Found)

````

## Screenshots / Videos

[Screenshot showing broken image icons in video library]

## Workaround (if any)

**Workaround**: Users can still play videos by clicking on them. Video titles are visible, so videos are still identifiable.

## Root Cause (if known)

Recent video uploads are missing thumbnails in the S3 bucket. The `video_upload.sh` script was modified to skip thumbnail generation for faster uploads, but the database still references thumbnail URLs that don't exist.

## Fix Proposal

1. Generate missing thumbnails for recent uploads using `ffmpeg`
2. Upload thumbnails to S3 bucket
3. Update `video_upload.sh` script to always generate thumbnails
4. Add validation to ensure thumbnail exists before saving video metadata

**Script to generate thumbnails**:
```bash
#!/bin/bash
# Generate thumbnail from video at 5-second mark
ffmpeg -i exercise-025.mp4 -ss 00:00:05 -vframes 1 exercise-025-thumb.jpg

# Upload to S3
aws s3 cp exercise-025-thumb.jpg s3://ffp-videos-prod/thumbnails/
````

## Related Issues

- FFP-22: Video upload improvements
- PR #67: Video upload script refactor (introduced bug)

```

---

## Story Point Reference

### Fibonacci Scale Rationale

FFP uses the Fibonacci sequence (1, 2, 3, 5, 8, 13) for estimation because:
- Non-linear scale reflects increasing uncertainty
- Prevents false precision (no difference between 7 and 8)
- Encourages breaking down large stories

### Quick Reference Table

| Points | Time Estimate | Complexity | Examples |
|--------|---------------|------------|----------|
| **1** | 1-2 hours | Trivial | Update text, fix typo, simple config change |
| **2** | 3-4 hours | Simple | Basic API endpoint, simple component, Zod schema |
| **3** | 5-8 hours | Moderate | API endpoint with business logic, component with state, DB migration |
| **5** | 1-2 days | Complex | Multiple endpoints, complex component, service layer feature |
| **8** | 2-3 days | Very Complex | Full feature (frontend + backend + DB), complex business logic |
| **13** | 3-5 days | Too Large | **Split into smaller stories** |

### Estimation Guidelines

**Consider these factors:**

1. **Technical Complexity**
   - Simple CRUD vs complex business logic
   - Existing patterns vs new patterns
   - Number of integration points

2. **Unknowns & Research**
   - Well-understood vs exploratory work
   - Familiar tech vs new tech
   - Documentation quality

3. **Testing Requirements**
   - Unit tests only vs integration + E2E
   - Simple test cases vs complex edge cases
   - Multi-tenant isolation tests

4. **Documentation**
   - Minor updates vs new documentation
   - Diagrams or architecture docs required

### Examples by Point Value

**1 Point Examples:**
- Update environment variable
- Fix typo in documentation
- Add validation error message
- Simple CSS styling fix

**2 Point Examples:**
- Create new Zod schema
- Add new API route (no business logic)
- Simple React component (button, card)
- Add index to database table

**3 Point Examples:**
- API endpoint with Zod validation + basic business logic
- React component with useState and form handling
- Database migration with RLS policy
- Integration test for multi-tenant isolation

**5 Point Examples:**
- User registration API (Cognito + DB)
- Assessment wizard frontend component
- Program generation service layer
- Video streaming with signed URLs

**8 Point Examples:**
- Complete assessment submission flow (frontend + backend + scoring)
- Video progress tracking (UI + API + DB)
- Business user invitation system
- Authentication flow with JWT validation

**13 Point Examples (should be split):**
- Complete video management system (upload + transcode + streaming + progress)
- Full business portal (multiple pages, roles, permissions)

---

## Definition of Done Checklists

### User Story Definition of Done

- [ ] **Code Quality**
  - [ ] Code implemented and follows TypeScript strict mode
  - [ ] No `any` types used
  - [ ] No linting errors (ESLint + Prettier)
  - [ ] Code follows SOLID principles
  - [ ] Service layer + Repository pattern used (where applicable)

- [ ] **Validation & Security**
  - [ ] Zod schemas defined for all API inputs
  - [ ] RLS context set correctly for all database queries
  - [ ] Tenant context validated (multi-tenant isolation)
  - [ ] No PHI or sensitive data in CloudWatch logs
  - [ ] Security review completed (if applicable)

- [ ] **Testing**
  - [ ] Unit tests written and passing (minimum 2)
  - [ ] Integration test for multi-tenant isolation
  - [ ] E2E test for critical user flow (if applicable)
  - [ ] All tests passing in CI pipeline
  - [ ] Test coverage meets 15% threshold (Phase 1)

- [ ] **Deployment & Validation**
  - [ ] Code merged to `develop` branch
  - [ ] Deployed to dev environment via SST
  - [ ] Manually tested in dev environment
  - [ ] Smoke tests passing
  - [ ] API response times <500ms (p95)

- [ ] **Documentation**
  - [ ] Code comments for complex logic
  - [ ] API documentation updated (if new endpoints)
  - [ ] Architecture documentation updated (if new patterns)
  - [ ] Relevant documentation in `project-documentation/` updated

- [ ] **Review & Cleanup**
  - [ ] Self-review completed (solo developer)
  - [ ] No console.log statements (use structured logging)
  - [ ] No commented-out code
  - [ ] No TODO comments (create Jira tickets instead)

### Task Definition of Done

- [ ] **Implementation**
  - [ ] Task objective completed
  - [ ] Configuration changes applied
  - [ ] All files created/modified as specified

- [ ] **Verification**
  - [ ] Verification steps executed successfully
  - [ ] Deployed to dev environment (if applicable)
  - [ ] Manually validated

- [ ] **Testing**
  - [ ] Unit tests passing (if applicable)
  - [ ] Integration tests passing (if applicable)

- [ ] **Documentation**
  - [ ] Documentation updated (if specified in task)
  - [ ] Configuration documented in code comments

### Bug Definition of Done

- [ ] **Fix Implementation**
  - [ ] Root cause identified and documented
  - [ ] Fix implemented and tested
  - [ ] No regression introduced

- [ ] **Testing**
  - [ ] Unit test added to prevent regression
  - [ ] Integration test added (if multi-tenant issue)
  - [ ] Manual testing completed

- [ ] **Verification**
  - [ ] Bug no longer reproducible
  - [ ] Original steps to reproduce now pass
  - [ ] Related functionality still works

- [ ] **Deployment**
  - [ ] Deployed to dev environment
  - [ ] Deployed to staging (if critical)
  - [ ] Deployed to production (if blocker/critical)

- [ ] **Documentation**
  - [ ] Root cause documented in ticket
  - [ ] Post-mortem written (if blocker/critical)
  - [ ] Prevention measures documented

---

## Jira Field Mappings

### Standard Jira Fields

| Jira Field | FFP Usage | Notes |
|------------|-----------|-------|
| **Issue Type** | Epic, Story, Task, Subtask, Bug | Use issue type IDs: 10011, 10010, 10008, 10012, 10006 |
| **Summary** | Brief, descriptive title | Use prefixes: "Epic:", "As a...", "[Bug]" |
| **Description** | Detailed markdown template | Use templates defined above |
| **Priority** | Highest, High, Medium, Low | Set based on business impact |
| **Status** | To Do, In Progress, In Review, Done | Standard workflow |
| **Assignee** | Christopher Tregaskis | Solo developer |
| **Reporter** | Christopher Tregaskis | Solo developer |
| **Labels** | Tags for filtering | See labels table below |
| **Components** | Functional area | See components table below |
| **Sprint** | Current sprint number | Sprint 1, Sprint 2, etc. |
| **Story Points** | Fibonacci estimation | 1, 2, 3, 5, 8, 13 |
| **Epic Link** | Parent epic | Links story to epic |

### Custom Labels

| Label | Purpose | Use Cases |
|-------|---------|-----------|
| `phase-1` | MVP phase work | All Sprint 1-6 tickets |
| `phase-2` | Post-MVP enhancements | Deferred features |
| `frontend` | React/UI work | React components, UI |
| `backend` | Lambda/API work | API endpoints, services |
| `database` | PostgreSQL work | Schemas, migrations, RLS |
| `infrastructure` | AWS/SST work | CloudFormation, SST stacks |
| `security` | Security-related | Auth, validation, OWASP |
| `testing` | Test infrastructure | Vitest, Playwright setup |
| `multi-tenant` | Tenant isolation | RLS, tenant context |
| `production` | Production issues | Critical production bugs |
| `performance` | Performance work | Optimization, caching |
| `documentation` | Docs updates | Project documentation |
| `refactor` | Code refactoring | Tech debt, cleanup |
| `bug` | Bug fix work | All bugs (auto-applied) |

### Components

| Component | Description | Examples |
|-----------|-------------|----------|
| `Authentication` | Cognito auth system | Login, registration, JWT |
| `Assessment Engine` | Assessment logic | Question engine, scoring |
| `Video Management` | Video system | Upload, streaming, CDN |
| `Program Generation` | Workout programs | Algorithm, exercise selection |
| `User Dashboard` | Individual user UI | Progress, programs, profile |
| `Business Portal` | Business account UI | Sub-users, admin features |
| `Company Management` | Company admin UI | Content management |
| `Database` | PostgreSQL schema | Tables, RLS, migrations |
| `Infrastructure` | AWS resources | SST, Lambda, API Gateway |
| `Testing` | Test framework | Vitest, Playwright, MSW |
| `CI/CD` | Deployment pipeline | GitHub Actions |
| `Monitoring` | CloudWatch | Logs, metrics, alarms |

---

## Linking & Hierarchy

### Issue Relationships

```

Epic (FFP-EPIC-1)
├── Story (FFP-10)
│ ├── Subtask (FFP-10-1)
│ ├── Subtask (FFP-10-2)
│ └── Subtask (FFP-10-3)
├── Story (FFP-11)
│ ├── Subtask (FFP-11-1)
│ └── Subtask (FFP-11-2)
└── Task (FFP-12)
├── Subtask (FFP-12-1)
└── Subtask (FFP-12-2)

````

### Link Types

| Link Type | Usage | Example |
|-----------|-------|---------|
| **Epic Link** | Story → Epic | Story "User Registration" linked to Epic "Application Setup" |
| **Parent** | Subtask → Story/Task | Subtask "Create Zod schema" linked to Story "User Registration" |
| **Blocks** | Issue A blocks Issue B | "Setup Cognito" blocks "User Registration" |
| **Relates to** | General relationship | Bug "Login fails" relates to Story "User Login" |
| **Duplicate** | Duplicate issues | Bug is duplicate of another bug |

### Creating Linked Issues

**Example: Creating a Story with Epic Link**

```json
{
  "fields": {
    "project": { "key": "FFP" },
    "summary": "As a new user, I want to register an account",
    "description": "[Markdown template content]",
    "issuetype": { "id": "10010" },
    "parent": { "key": "FFP-EPIC-1" },
    "priority": { "name": "High" },
    "labels": ["phase-1", "frontend", "backend", "authentication"],
    "components": [{ "name": "Authentication" }],
    "customfield_10016": 5  // Story points
  }
}
````

**Example: Creating a Subtask**

```json
{
  "fields": {
    "project": { "key": "FFP" },
    "summary": "Create Zod schema for registration validation",
    "description": "[Markdown template content]",
    "issuetype": { "id": "10012" },
    "parent": { "key": "FFP-10" },
    "priority": { "name": "High" },
    "labels": ["backend", "validation"]
  }
}
```

---

## Jira API Examples

### Create Epic

```bash
curl -X POST https://christophertregaskis.atlassian.net/rest/api/3/issue \
  -H "Authorization: Bearer $JIRA_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "fields": {
      "project": { "key": "FFP" },
      "summary": "Epic: Application Setup & Foundation",
      "description": "[Markdown content from template]",
      "issuetype": { "id": "10011" },
      "priority": { "name": "Highest" },
      "labels": ["phase-1", "infrastructure"],
      "components": [{ "name": "Infrastructure" }],
      "customfield_10011": "Application Setup"
    }
  }'
```

### Create Story with Epic Link

```bash
curl -X POST https://christophertregaskis.atlassian.net/rest/api/3/issue \
  -H "Authorization: Bearer $JIRA_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "fields": {
      "project": { "key": "FFP" },
      "summary": "As a new user, I want to register an account",
      "description": "[Markdown content from template]",
      "issuetype": { "id": "10010" },
      "parent": { "key": "FFP-EPIC-1" },
      "priority": { "name": "High" },
      "labels": ["phase-1", "frontend", "backend", "authentication"],
      "components": [{ "name": "Authentication" }],
      "customfield_10016": 5
    }
  }'
```

### Create Subtask

```bash
curl -X POST https://christophertregaskis.atlassian.net/rest/api/3/issue \
  -H "Authorization: Bearer $JIRA_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "fields": {
      "project": { "key": "FFP" },
      "summary": "Create Zod schema for registration validation",
      "description": "[Markdown content from template]",
      "issuetype": { "id": "10012" },
      "parent": { "key": "FFP-10" },
      "priority": { "name": "High" },
      "labels": ["backend", "validation"]
    }
  }'
```

### Create Bug

```bash
curl -X POST https://christophertregaskis.atlassian.net/rest/api/3/issue \
  -H "Authorization: Bearer $JIRA_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "fields": {
      "project": { "key": "FFP" },
      "summary": "[Bug] Assessment submission fails with tenant context error",
      "description": "[Markdown content from template]",
      "issuetype": { "id": "10006" },
      "priority": { "name": "Critical" },
      "labels": ["production", "multi-tenant", "security"],
      "components": [{ "name": "Assessment Engine" }]
    }
  }'
```

---

## Best Practices

### Writing Good Summaries

**Do:**

- ✅ Use "As a [user type], I want [action] so that [benefit]" for stories
- ✅ Start tasks with action verbs: "Configure", "Setup", "Implement"
- ✅ Prefix bugs with "[Bug]:" for clarity
- ✅ Keep summaries under 80 characters
- ✅ Be specific: "User registration API" not "Registration stuff"

**Don't:**

- ❌ Use vague terms: "Fix things", "Update code"
- ❌ Include implementation details in summary
- ❌ Use jargon without context
- ❌ Omit the user benefit in stories

### Writing Acceptance Criteria

**Do:**

- ✅ Use Given-When-Then format for clarity
- ✅ Make criteria testable (can be verified pass/fail)
- ✅ Include multi-tenant isolation criteria for all data operations
- ✅ Specify error cases, not just happy path
- ✅ Include security requirements (Zod validation, RLS, JWT)

**Don't:**

- ❌ Write vague criteria: "Works correctly"
- ❌ Include implementation details: "Use useState hook"
- ❌ Mix multiple concerns in one criterion
- ❌ Forget edge cases and error handling

### Ticket Hygiene

**Do:**

- ✅ Update ticket status promptly
- ✅ Add comments for important decisions or blockers
- ✅ Link related issues
- ✅ Attach screenshots/logs for bugs
- ✅ Close tickets when complete

**Don't:**

- ❌ Leave tickets in "In Progress" indefinitely
- ❌ Create duplicate tickets
- ❌ Skip linking to related work
- ❌ Forget to update estimates if scope changes

---

## Summary

This document defines comprehensive standards for all Jira ticket types in the FFP project:

1. **Epic Standards**: Large bodies of work spanning multiple sprints
2. **User Story Standards**: User-facing features with acceptance criteria
3. **Task Standards**: Technical work without direct user value
4. **Sub-task Standards**: Breaking down stories into actionable chunks
5. **Bug Standards**: Defect tracking with severity and impact

**Key Takeaways:**

- Use templates consistently for clarity
- Estimate stories with Fibonacci scale (1, 2, 3, 5, 8, 13)
- Always include multi-tenant isolation in acceptance criteria
- Minimum 2 unit tests per User Story
- Follow Definition of Done checklists strictly
- Link issues appropriately (Epic → Story → Subtask)

**Next Steps:**

1. Save this document in: `/Users/christophertregaskis/Documents/FFP/ffp/project-documentation/sprint-planning/outputs/jira-ticket-standards.md`
2. Reference this document when creating all Jira tickets
3. Update as patterns emerge or standards evolve

---

**Document Version**: 1.0  
**Last Updated**: October 17, 2025  
**Author**: Christopher Tregaskis  
**Project**: FFP (Fit For Purpose)
